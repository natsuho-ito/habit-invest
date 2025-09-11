"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

type Row = { date: string; amount: number; habits: { title: string } | null };

export default function SevenDayChart() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const ymd = since.toISOString().slice(0, 10);

    supabase
      .from("habit_logs")
      .select("date, amount, habits(title)")
      .gte("date", ymd)
      .order("date", { ascending: true })
      .then(({ data }) => setRows(data ?? []));
  }, [supabase]);

  const { labels, datasets, total, today } = useMemo(() => {
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    const byDateHabit: Record<string, Record<string, number>> = {};
    const habitNames = new Set<string>();

    rows.forEach((r) => {
      const name = r.habits?.title ?? "その他";
      habitNames.add(name);
      byDateHabit[r.date] ??= {};
      byDateHabit[r.date][name] = (byDateHabit[r.date][name] || 0) + r.amount;
    });

    const datasets = Array.from(habitNames).map((name, i) => ({
      label: name,
      data: labels.map((d) => byDateHabit[d]?.[name] || 0),
      backgroundColor: `hsl(${(i * 67) % 360},70%,50%)`,
      stack: "s1",
    }));

    const totals = rows.reduce((s, r) => s + r.amount, 0);
    const todayYmd = new Date().toISOString().slice(0, 10);
    const todayTotal = rows.filter((r) => r.date === todayYmd).reduce((s, r) => s + r.amount, 0);

    return { labels, datasets, total: totals, today: todayTotal };
  }, [rows]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">総資産：{total} / 今日：{today}</div>
      <Bar
        data={{ labels, datasets }}
        options={{
          responsive: true,
          plugins: { legend: { position: "bottom" } },
          scales: { x: { stacked: true }, y: { stacked: true } },
        }}
      />
    </div>
  );
}
