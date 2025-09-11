"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

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

  useEffect(() => { fetchHabits(); }, []);

  const onCheck = async (habitId: string) => {
    setLoadingIds((ids) => [...ids, habitId]);
    try {
      const { error } = await supabase.rpc("log_done_and_update", {
        p_habit_id: habitId,
      });
      if (error) throw error;
      await fetchHabits(); // 再取得（楽さ優先）
    } catch (e) {
      console.error(e);
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
          >
            +{h.unit_amount}
          </button>
        </div>
      ))}
      {habits.length === 0 && (
        <p className="text-sm text-gray-500">アクティブな習慣がありません。まずは追加してください。</p>
      )}
    </div>
  );
}
