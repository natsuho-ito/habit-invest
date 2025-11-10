"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { getHabitLogsChannel, type HabitLogEvent } from "@/lib/realtime";

type Row = { date: string; amount: number; habits: { title: string } | null };
type RowRaw = { date: string; amount: number; habits: { title: string }[] | { title: string } | null };

type RowPortfolioRaw = {
    date: string;
    amount: number;
    habits: {
      goals: {
        categories: {
          name: string;
          color: string | null; // ← 追加！
        } | null;
      } | null;
    } | null;
  };
  
  type RowPortfolio = {
    date: string;
    amount: number;
    category: string;
    color: string; // ← 追加！
  };
  

export default function InvestmentDashboard() {
  const supabase = supabaseBrowser();

  const [rows, setRows] = useState<Row[]>([]);
  const [portfolioRows, setPortfolioRows] = useState<RowPortfolio[]>([]);

  const refreshBar = async () => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const ymd = toYmdJST(since);

    const { data, error } = await supabase
      .from("habit_logs")
      .select("date, amount, habits(title)")
      .gte("date", ymd)
      .order("date", { ascending: true })
      .returns<RowRaw[]>();

    if (error) return console.error(error);

    const normalized: Row[] = (data ?? []).map(({ habits, ...rest }) => ({
      ...rest,
      habits: Array.isArray(habits) ? habits[0] ?? null : habits,
    }));
    setRows(normalized);
  };

  useEffect(() => {
    void refreshBar();
  }, []);

  useEffect(() => {
    const channel = getHabitLogsChannel().on("broadcast", { event: "habit_log" }, (payload) => {
      const p = payload.payload as HabitLogEvent & {
        kind: "insert" | "update" | "delete";
      };

      const since = new Date();
      since.setDate(since.getDate() - 6);
      const minYmd = toYmdJST(since);

      if (p.kind === "insert" && p.date >= minYmd) {
        setRows((prev) => [
          ...prev,
          { date: p.date, amount: p.amount, habits: p.habitTitle ? { title: p.habitTitle } : null },
        ]);
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

    const interval = window.setInterval(() => void refreshBar(), 15000);
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 既存の棒グラフ用 useEffect のすぐ下に追加
useEffect(() => {
    const channel = getHabitLogsChannel().on("broadcast", { event: "habit_log" }, (payload) => {
      const p = payload.payload as HabitLogEvent & {
        kind: "insert" | "update" | "delete";
      };
  
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const minYmd = toYmdJST(since);
  
      // 円グラフも対象にしたいので、「今週内のデータ」であれば更新
      if (p.kind === "insert" && p.date >= minYmd) {
        void refreshPortfolio(); // ← ✅ 円グラフデータを再取得
      } else if (p.kind === "update" || p.kind === "delete") {
        void refreshPortfolio(); // ← ✅ 更新・削除も再取得
      }
    });
  
    // 定期リフレッシュもオプションで残してOK
    const interval = window.setInterval(() => void refreshPortfolio(), 15000);
  
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);
  

  const getMonday = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜を週の始まりに
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const { labels, datasets, total, today } = useMemo(() => {
    // 月曜日を基準に7日間分のラベルを作成
    const monday = getMonday();
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
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
        "rgba(251,146,60,0.8)",  // オレンジ
        // "rgba(236,72,153,0.8)",  // フューシャ
        // "rgba(20,184,166,0.8)",  // ティール
        "rgba(132,204,22,0.8)",  // ライムグリーン
        // "rgba(202,138,4,0.8)",   // ディープゴールド
        // "rgba(250,204,21,0.8)",  // サンフラワー
        "rgba(168,85,247,0.8)",  // ビビッドパープル
        // "rgba(161,98,7,0.8)",    // amber-800
        "rgba(147,197,253,0.8)", // ライトブルー
        "rgba(253,224,71,0.8)",  // ライトイエロー
        "rgba(34,211,238,0.8)",  // シアン
        "rgba(192,38,211,0.8)",  // ディープパープル
        // "rgba(239,68,68,0.8)",   // レッド
        "rgba(34,197,230,0.8)",  // スカイブルー
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

  const refreshPortfolio = async () => {
    const monday = getMonday();
    const ymd = toYmdJST(monday);
  
    const { data, error } = await supabase
      .from("habit_logs")
      .select(`
        date,
        amount,
        habits (
          goals (
            categories (
              name,
              color
            )
          )
        )
      `) // ← colorを取得
      .gte("date", ymd)
      .order("date", { ascending: true })
      .returns<RowPortfolioRaw[]>();
  
    if (error) return console.error(error);
  
    const normalized: RowPortfolio[] =
      (data ?? []).map((r) => ({
        date: r.date,
        amount: r.amount,
        category: r.habits?.goals?.categories?.name ?? "未分類",
        color: r.habits?.goals?.categories?.color ?? "#ccc", // ← fallbackも設定
      })) ?? [];
  
    setPortfolioRows(normalized);
  };

  useEffect(() => {
    void refreshPortfolio();
  }, []);

  const { labels: pieLabels, data: pieData, colors: pieColors, total: weekTotal } = useMemo(() => {
    const byCategory: Record<string, { amount: number; color: string }> = {};
    portfolioRows.forEach((r) => {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { amount: 0, color: r.color };
      }
      byCategory[r.category].amount += r.amount;
    });
  
    const labels = Object.keys(byCategory);
    const data = labels.map((l) => byCategory[l].amount);
    const colors = labels.map((l) => byCategory[l].color);
    const total = data.reduce((a, b) => a + b, 0);
  
    return { labels, data, colors, total };
  }, [portfolioRows]);
  

  const palettePie = [
    "rgba(251,146,60,0.8)",  // オレンジ
    "rgba(236,72,153,0.8)",  // フューシャ
    "rgba(20,184,166,0.8)",  // ティール
    "rgba(132,204,22,0.8)",  // ライムグリーン
    "rgba(202,138,4,0.8)",   // ディープゴールド
    "rgba(250,204,21,0.8)",  // サンフラワー
    "rgba(168,85,247,0.8)",  // ビビッドパープル
    "rgba(161,98,7,0.8)",    // amber-800
    "rgba(147,197,253,0.8)", // ライトブルー
    "rgba(253,224,71,0.8)",  // ライトイエロー
    "rgba(34,211,238,0.8)",  // シアン
    "rgba(192,38,211,0.8)",  // ディープパープル
    "rgba(239,68,68,0.8)",   // レッド
    "rgba(34,197,230,0.8)",  // スカイブルー
  ];

  return (
    <div className="space-y-4">
      {/* 総資産（全幅・左寄せ） */}
      <div className="rounded border p-3 bg-white shadow text-left">
        <div className="text-sm text-gray-500">総資産</div>
        <div className="text-3xl font-mono font-semibold">{total} HBT</div>
      </div>

      {/* 今日の投資 & 今週の総投資（横並び） */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-3 text-left bg-white shadow">
          <div className="text-xs text-gray-500">今日の投資</div>
          <div className="text-2xl font-mono font-semibold text-green-600">
            +{today} HBT
          </div>
        </div>
        <div className="rounded border p-3 text-left bg-white shadow">
          <div className="text-xs text-gray-500">今週の総投資</div>
          <div className="text-2xl font-mono font-semibold text-green-600">
            +{weekTotal} HBT
          </div>
        </div>
      </div>

      {/* 棒グラフ + 円グラフ（外枠なし） */}
      <div className="space-y-6">
        <div>
          <div className="text-xs text-gray-500 mb-1">今週の投資推移</div>
          <Bar
            data={{ labels, datasets }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: +${ctx.formattedValue} HBT`,
                  },
                },
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true, title: { display: true, text: "投資額（HBT）" } },
              },
            }}
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">今週の投資割合</div>
          <div className="w-3/5 mx-auto">
          <Pie
            data={{
                labels: pieLabels,
                datasets: [
                {
                    data: pieData,
                    backgroundColor: pieColors, // ← DBの色を使用！
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
      </div>
    </div>
  );
}
