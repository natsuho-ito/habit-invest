// src/components/ActiveHabits.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { sendHabitLogBroadcast, getHabitLogsChannel } from "@/lib/realtime";

// ---- 型定義 ----------------------------------------------------

type Goal = {
  id: string;
  title: string;
};

type Habit = {
  id: string;
  title: string;
  unit_amount: number;
  total_investment: number;
  target_days: number;
  total_days: number;
  goal: Goal | null;
};

// ---- コンポーネント --------------------------------------------

export default function ActiveHabits() {
  const supabase = supabaseBrowser();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [doneTodayIds, setDoneTodayIds] = useState<Set<string>>(new Set());
  const [today, setToday] = useState<string>(() => toYmdJST(new Date())); // JSTの今日

  // ---- Data fetchers -------------------------------------------

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select(
        "id,title,unit_amount,total_investment,target_days,total_days,goal:goals(id,title)"
      )
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(6)
      .returns<Habit[]>(); // ← 型を明示

    if (!error && data) {
      setHabits(data);
    }
  };

  const fetchDoneToday = async (ymd: string) => {
    type Row = { habit_id: string };
    const { data, error } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("date", ymd)
      .returns<Row[]>();

    if (!error && data) {
      setDoneTodayIds(new Set(data.map((r) => r.habit_id)));
    }
  };

  // ---- Effects -------------------------------------------------

  useEffect(() => {
    void fetchHabits();
    void fetchDoneToday(today);
    getHabitLogsChannel().subscribe();
  }, [supabase, today]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const y = toYmdJST(new Date());
      if (y !== today) {
        setToday(y);
        setDoneTodayIds(new Set());
        void fetchDoneToday(y);
      }
    }, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [today]);

  // ---- Actions -------------------------------------------------

  const onCheck = async (habitId: string) => {
    if (doneTodayIds.has(habitId)) return;
    setLoadingIds((ids) => [...ids, habitId]);

    const target = habits.find((h) => h.id === habitId);
    if (!target) {
      setLoadingIds((ids) => ids.filter((id) => id !== habitId));
      return;
    }

    const snapshot = habits.map((h) => ({ ...h }));

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              total_investment: h.total_investment + h.unit_amount,
              total_days: h.total_days + 1,
            }
          : h
      )
    );
    setDoneTodayIds((prev) => {
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });

    sendHabitLogBroadcast({
      kind: "insert",
      date: today,
      amount: target.unit_amount,
      habitId,
      habitTitle: target.title ?? null,
    });

    try {
      const { error } = await supabase.rpc("log_done_and_update", {
        p_habit_id: habitId,
        p_on: today,
      });
      if (error) throw error;

      await fetchHabits();
      await fetchDoneToday(today);
    } catch (e) {
      console.error(e);
      setHabits(snapshot);
      setDoneTodayIds((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      alert("記録に失敗しました");
    } finally {
      setLoadingIds((ids) => ids.filter((id) => id !== habitId));
    }
  };

  // ---- Render --------------------------------------------------

  return (
    <div className="space-y-3">
      {habits.map((h) => {
        const disabled = loadingIds.includes(h.id) || doneTodayIds.has(h.id);
        return (
          <div
            key={h.id}
            className="flex items-center justify-between rounded border p-3"
          >
            {/* <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{h.title}</span>
                {h.goal && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {h.goal.title}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                累計 {h.total_investment} / 目標 {h.target_days}日（達成{" "}
                {h.total_days}日）
              </div>
            </div> */}
            <div>
              {/* タイトル */}
              <div className="font-medium break-words">{h.title}</div>

              {/* ゴールタグ（存在する場合） */}
              {h.goal && (
                <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 break-words">
                  {h.goal.title}
                </div>
              )}

              {/* 累計情報 */}
              <div className="text-sm text-gray-500 mt-1">
                累計 {h.total_investment} / 目標 {h.target_days}日（達成 {h.total_days}日）
              </div>
            </div>
            <button
              className="px-3 py-2 rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              onClick={() => onCheck(h.id)}
              aria-label={`${h.title} を +${h.unit_amount} 記録`}
              title={disabled ? "今日は記録済み" : `+${h.unit_amount} 記録`}
            >
              +{h.unit_amount}
            </button>
          </div>
        );
      })}
      {habits.length === 0 && (
        <p className="text-sm text-gray-500">
          アクティブな習慣がありません。まずは追加してください。
        </p>
      )}
    </div>
  );
}
