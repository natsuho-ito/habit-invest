"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

// UIで最終的に使う型（habits は単体オブジェクト or null）
type Row = { date: string; amount: number; habits: { title: string } | null };

// Supabaseの素の返却型（habits が配列/単体/null のいずれも来うる）
type RowRaw = {
  date: string;
  amount: number;
  habits: { title: string }[] | { title: string } | null;
};

export default function SevenDayChart() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;

    // 直近7日分（今日を含む）をJST基準で
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const ymd = toYmdJST(since);

    (async () => {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("date, amount, habits(title)")
        .gte("date", ymd)
        .order("date", { ascending: true })
        .returns<RowRaw[]>(); // ★ dataの型を固定

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
        return;
      }

      // ★ habits が配列で来るケースを first-or-null に正規化
      const normalized: Row[] = (data ?? []).map(({ habits, ...rest }) => ({
        ...rest,
        habits: Array.isArray(habits) ? habits[0] ?? null : habits,
      }));

      setRows(normalized);
    })();

    return () => {
      alive = false; // アンマウント後のsetStateを防止
    };
  }, [supabase]);

  const { labels, datasets, total, today } = useMemo(() => {
    // 表示ラベルもJST基準で生成
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
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

    // 柔らかめの配色（拡張したい場合はここに追加）
    const palette = [
      "rgba(34,197,94,0.8)",   // emerald-500
      "rgba(59,130,246,0.8)",  // blue-500
      "rgba(139,92,246,0.8)",  // violet-500
      "rgba(234,179,8,0.8)",   // yellow-500
      "rgba(16,185,129,0.8)",  // teal-500
      "rgba(99,102,241,0.8)",  // indigo-500
      "rgba(244,63,94,0.8)",   // rose-500
    ];

    const datasets = Array.from(habitNames).map((name, i) => ({
      label: name,
      data: labels.map((d) => byDateHabit[d]?.[name] || 0),
      backgroundColor: palette[i % palette.length],
      stack: "s1",
    }));

    const totals = rows.reduce((s, r) => s + r.amount, 0);
    const todayYmd = toYmdJST(new Date()); // ★ JST今日
    const todayTotal = rows
      .filter((r) => r.date === todayYmd)
      .reduce((s, r) => s + r.amount, 0);

    return { labels, datasets, total: totals, today: todayTotal };
  }, [rows]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border p-3">
          <div className="text-xs text-gray-500">総資産</div>
          <div className="text-2xl font-mono font-semibold">{total} コイン</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-gray-500">今日の投資</div>
          <div className="text-2xl font-mono font-semibold">+{today} コイン</div>
        </div>
      </div>

      <Bar
        data={{ labels, datasets }}
        options={{
          responsive: true,
          animation: { duration: 700, easing: "easeOutQuart" },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { family: "ui-monospace, monospace", size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: +${ctx.formattedValue} コイン`
              }
            }
          },
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              title: {
                display: true,
                text: "投資額（コイン）",
                font: { weight: "bold" }
              }
            }
          }
        }}
      />
    </div>
  );
}
