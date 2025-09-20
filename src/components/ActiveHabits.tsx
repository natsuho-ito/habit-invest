"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { getHabitLogsChannel, sendHabitLogBroadcast } from "@/lib/realtime";

type Habit = {
  id: string;
  title: string;
  unit_amount: number;
  total_investment: number;
  target_days: number;
  total_days: number;
};

export default function ActiveHabits() {
  const supabase = supabaseBrowser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select("id,title,unit_amount,total_investment,target_days,total_days")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(5);

    if (!error) setHabits(data ?? []);
  };

  useEffect(() => {
    // 初回データ取得
    void fetchHabits();

    // Broadcast用チャンネルに参加（送受信のため）
    const ch = getHabitLogsChannel().subscribe(() => {
      // console.log("broadcast channel: SUBSCRIBED");
    });

    // このチャンネルはアプリ全体で共用想定。ここでは明示解除しない。
    // もし個別に解除したい場合は supabase.removeChannel(ch);
    // return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  const onCheck = async (habitId: string) => {
    setLoadingIds((ids) => [...ids, habitId]);

    // 対象ハビットを取得（見つからなければ何もしない）
    const target = habits.find((h) => h.id === habitId);
    if (!target) {
      setLoadingIds((ids) => ids.filter((id) => id !== habitId));
      return;
    }

    // ----- ① 楽観更新（UI即時反映） -----
    // スナップショットを取り、失敗時に巻き戻せるようにする
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

    // ----- ② Broadcast 送信（グラフ即時反映） -----
    const today = toYmdJST(new Date());
    sendHabitLogBroadcast({
      kind: "insert",
      date: today,
      amount: target.unit_amount,
      habitTitle: target.title ?? null,
    });

    // ----- ③ サーバー反映（RPC） -----
    try {
      const { error } = await supabase.rpc("log_done_and_update", {
        p_habit_id: habitId,
      });
      if (error) throw error;

      // サーバーの真値で整合（任意：外してもOK。残すと数値ズレの心配ゼロ）
      await fetchHabits();
    } catch (e) {
      console.error(e);
      // 失敗したら UI を巻き戻す
      setHabits(snapshot);
      alert("記録に失敗しました");
    } finally {
      setLoadingIds((ids) => ids.filter((id) => id !== habitId));
    }
  };

  return (
    <div className="space-y-3">
      {habits.map((h) => (
        <div key={h.id} className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="font-medium">{h.title}</div>
            <div className="text-sm text-gray-500">
              累計 {h.total_investment} / 目標 {h.target_days}日（達成 {h.total_days}日）
            </div>
          </div>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={loadingIds.includes(h.id)}
            onClick={() => onCheck(h.id)}
            aria-label={`${h.title} を +${h.unit_amount} 記録`}
            title={`+${h.unit_amount} 記録`}
          >
            +{h.unit_amount}
          </button>
        </div>
      ))}
      {habits.length === 0 && (
        <p className="text-sm text-gray-500">
          アクティブな習慣がありません。まずは追加してください。
        </p>
      )}
    </div>
  );
}
