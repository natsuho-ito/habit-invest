"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import {
  getHabitLogsChannel,
  type HabitLogEvent,
} from "@/lib/realtime";

type Row = { date: string; amount: number; habits: { title: string } | null };
type RowRaw = {
  date: string;
  amount: number;
  habits: { title: string }[] | { title: string } | null;
};

export default function SevenDayChart() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);

  // 取得（型付き） + 配列habitsの正規化
  const refresh = async (client: SupabaseClient) => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const ymd = toYmdJST(since);

    const { data, error } = await client
      .from("habit_logs")
      .select("date, amount, habits(title)")
      .gte("date", ymd)
      .order("date", { ascending: true })
      .returns<RowRaw[]>();

    if (error) {
      console.error(error);
      setRows([]);
      return;
    }
    const normalized: Row[] = (data ?? []).map(({ habits, ...rest }) => ({
      ...rest,
      habits: Array.isArray(habits) ? habits[0] ?? null : habits,
    }));
    setRows(normalized);
  };

  // 初回取得
  useEffect(() => {
    void refresh(supabase);
  }, [supabase]);

  // Broadcast受信 → 即時反映（Replication不要）
  useEffect(() => {
    const ch = getHabitLogsChannel().subscribe(); // 一度だけ購読
    const onBroadcast = (ev: MessageEvent) => {
      // supabase-js が window へ直接投げるわけではないので、
      // Channelの専用APIで受ける:
    };

    // supabase-js v2 の Channel で broadcast を受け取る
    const channel = getHabitLogsChannel()
      .on("broadcast", { event: "habit_log" }, (payload) => {
        const p = payload.payload as HabitLogEvent; // 型は自分で送った形
        const since = new Date();
        since.setDate(since.getDate() - 6);
        const minYmd = toYmdJST(since);

        if (p.kind === "insert") {
          if (p.date >= minYmd) {
            setRows((prev) => [
              ...prev,
              { date: p.date, amount: p.amount, habits: p.habitTitle ? { title: p.habitTitle } : null },
            ]);
          }
        } else if (p.kind === "update") {
          setRows((prev) =>
            prev.map((r) =>
              r.date === p.date && r.habits?.title === p.habitTitle
                ? { ...r, amount: p.amount }
                : r
            )
          );
        } else if (p.kind === "delete") {
          setRows((prev) =>
            prev.filter((r) => !(r.date === p.date && r.habits?.title === p.habitTitle))
          );
        }
      });

    // 10〜20秒おきに薄いポーリング（整合性確保、負荷は低め）
    const interval = window.setInterval(() => { void refresh(supabase); }, 15000);

    return () => {
      window.clearInterval(interval);
      // 同一チャネルをアプリ共通で使う場合は removeせず残してもOK
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ---- 以下はそのまま（集計・描画） ----
  const { labels, datasets, total, today } = useMemo(() => {
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return toYmdJST(d);
    });

    const byDateHabit: Record<string, Record<string, number>> = {};
    const habitNames = new Set<string>();

    rows.forEach((r) => {
      const name = r.habits?.title ?? "その他";
      habitNames.add(name);
      byDateHabit[r.date] ??= {};
      byDateHabit[r.date][name] = (byDateHabit[r.date][name] || 0) + r.amount;
    });

    const palette = [
      "rgba(34,197,94,0.8)", "rgba(59,130,246,0.8)", "rgba(139,92,246,0.8)",
      "rgba(234,179,8,0.8)", "rgba(16,185,129,0.8)", "rgba(99,102,241,0.8)", "rgba(244,63,94,0.8)",
    ];

    const datasets = Array.from(habitNames).map((name, i) => ({
      label: name,
      data: labels.map((d) => byDateHabit[d]?.[name] || 0),
      backgroundColor: palette[i % palette.length],
      stack: "s1",
    }));

    const totals = rows.reduce((s, r) => s + r.amount, 0);
    const todayYmd = toYmdJST(new Date());
    const todayTotal = rows.filter((r) => r.date === todayYmd).reduce((s, r) => s + r.amount, 0);

    return { labels, datasets, total: totals, today: todayTotal };
  }, [rows]);

  return (
    <div className="space-y-2">
      {/* ...（UIはそのまま） */}
      <Bar data={{ labels, datasets }} options={{ /* ... */ }} />
    </div>
  );
}
