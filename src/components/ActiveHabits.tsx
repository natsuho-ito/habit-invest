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

  const availableColors = [
    "bg-orange-200",
    "bg-purple-200",
    "bg-blue-200",
    "bg-lime-200",
    "bg-cyan-200",
    "bg-green-200",
    "bg-sky-200",
    "bg-pink-200",
    "bg-yellow-200",
    "bg-teal-200",
  ];

  const goalColorMap: Record<string, string> = {};

// 配列から順番に色を割り当てる関数
function assignGoalColor(goalTitle: string) {
  if (!goalColorMap[goalTitle]) {
    // すでに割り当てられている色を除外
    const usedColors = Object.values(goalColorMap);
    const available = availableColors.filter((c) => !usedColors.includes(c));

    // 使える色がなければ最後の色（gray）を使う
    const color = available.length > 0 ? available[0] : "bg-gray-200";

    goalColorMap[goalTitle] = color;
  }
  return goalColorMap[goalTitle];
}

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

  // ゴールごとにhabitsをグルーピング
  const habitsByGoal = habits.reduce<Record<string, Habit[]>>((acc, habit) => {
    const goalTitle = habit.goal?.title ?? "ゴールなし";
    if (!acc[goalTitle]) acc[goalTitle] = [];
    acc[goalTitle].push(habit);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
     {Object.entries(habitsByGoal).map(([goalTitle, goalHabits]) => {
  const bgColor = assignGoalColor(goalTitle);

  return (
    <div key={goalTitle} className="space-y-1">
      {/* ゴールタイトル */}
      <div className={`${bgColor} inline-block px-4 py-2 rounded-lg font-medium text-gray-900`}>
        {goalTitle}
      </div>

      {/* ゴールに紐づく習慣リスト */}
      <div className="space-y-3 mt-2">
        {goalHabits.map((h) => {
          const disabled = loadingIds.includes(h.id) || doneTodayIds.has(h.id);
          return (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="font-medium break-words">{h.title}</div>
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
      </div>
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