"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

type RowRaw = {
  date: string;
  amount: number;
  habits: {
    goals: {
      categories: {
        name: string;
      } | null;
    } | null;
  } | null;
};

type Row = {
  date: string;
  amount: number;
  category: string;
};

export default function PortfolioChart() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);

  // 🌕 今週（月曜〜今日）の範囲を取得
  const getMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜始まり
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const refresh = async () => {
    const monday = getMonday();
    const ymd = toYmdJST(monday);

    // 👇 categoriesまでJOIN（4テーブル分）
    const { data, error } = await supabase
      .from("habit_logs")
      .select(`
        date,
        amount,
        habits (
          goals (
            categories (
              name
            )
          )
        )
      `)
      .gte("date", ymd)
      .order("date", { ascending: true })
      .returns<RowRaw[]>();

    if (error) {
      console.error(error);
      return;
    }

    const normalized: Row[] =
      (data ?? []).map((r) => ({
        date: r.date,
        amount: r.amount,
        category: r.habits?.goals?.categories?.name ?? "未分類",
      })) ?? [];

    setRows(normalized);
  };

  useEffect(() => {
    void refresh();
  }, []);

  // 🌸 カテゴリー別合計（月曜〜今日）
  const { labels, data, total } = useMemo(() => {
    const byCategory: Record<string, number> = {};

    rows.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
    });

    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);
    const total = data.reduce((a, b) => a + b, 0);

    return { labels, data, total };
  }, [rows]);

  const palette = [
    "rgba(34,197,94,0.8)",   // green
    "rgba(59,130,246,0.8)",  // blue
    "rgba(139,92,246,0.8)",  // purple
    "rgba(234,179,8,0.8)",   // yellow
    "rgba(244,63,94,0.8)",   // rose
    "rgba(251,146,60,0.8)",  // orange
    "rgba(147,197,253,0.8)", // light blue
    "rgba(52,211,153,0.8)",  // emerald
  ];

  return (
    <div className="space-y-3">
      <div className="rounded border p-3">
        <div className="text-xs text-gray-500">今週の総投資（カテゴリ別）</div>
        <div className="text-2xl font-mono font-semibold text-green-600">
          +{total} HBT
        </div>
      </div>

      <div className="w-4/5 mx-auto">
      <Pie
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: labels.map(
                (_, i) => palette[i % palette.length]
              ),
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: +${ctx.formattedValue} HBT`,
              },
            },
          },
        }}
      />
      </div>
    </div>
  );
}
