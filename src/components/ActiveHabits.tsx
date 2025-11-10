
// // "use client";

// // import { useEffect, useState } from "react";
// // import { supabaseBrowser } from "@/lib/supabaseBrowser";
// // import { toYmdJST } from "@/lib/date";
// // import { sendHabitLogBroadcast, getHabitLogsChannel } from "@/lib/realtime";

// // // ---- 型定義 ----------------------------------------------------

// // type Goal = {
// //   id: string;
// //   title: string;
// //   category: {
// //     id: string;
// //     name: string;
// //   } | null;
// // };

// // type Habit = {
// //   id: string;
// //   title: string;
// //   unit_amount: number;
// //   total_investment: number;
// //   target_days: number;
// //   total_days: number;
// //   trigger: string | null;
// //   steps: string | null;
// //   goal: Goal | null;
// // };

// // // ---- コンポーネント --------------------------------------------

// // export default function ActiveHabits() {
// //   const supabase = supabaseBrowser();

// //   const [habits, setHabits] = useState<Habit[]>([]);
// //   const [loadingIds, setLoadingIds] = useState<string[]>([]);
// //   const [doneTodayIds, setDoneTodayIds] = useState<Set<string>>(new Set());
// //   const [today, setToday] = useState<string>(() => toYmdJST(new Date())); // JSTの今日

// //   // ---- カラー設定 ------------------------------------------------

// //   const availableColors = [
// //     "bg-orange-200",
// //     "bg-purple-200",
// //     "bg-blue-200",
// //     "bg-lime-200",
// //     "bg-cyan-200",
// //     "bg-green-200",
// //     "bg-sky-200",
// //     "bg-pink-200",
// //     "bg-yellow-200",
// //     "bg-teal-200",
// //   ];

// //   const goalColorMap: Record<string, string> = {};

// //   // ゴールごとに被らない色を順番に割り当て
// //   function assignGoalColor(goalTitle: string) {
// //     if (!goalColorMap[goalTitle]) {
// //       const usedColors = Object.values(goalColorMap);
// //       const available = availableColors.filter((c) => !usedColors.includes(c));
// //       const color = available.length > 0 ? available[0] : "bg-gray-200";
// //       goalColorMap[goalTitle] = color;
// //     }
// //     return goalColorMap[goalTitle];
// //   }

// //   // ---- Data fetchers -------------------------------------------

// //   const fetchHabits = async () => {
// //     const { data, error } = await supabase
// //       .from("habits")
// //       // .select(
// //       //   "id,title,unit_amount,total_investment,target_days,total_days,trigger,steps,goal:goals(id,title)"
// //       // )
// //       .select(`
// //         id,
// //         title,
// //         status,
// //         unit_amount,
// //         total_investment,
// //         target_days,
// //         total_days,
// //         trigger,
// //         steps,
// //         goal:goals (
// //           id,
// //           title,
// //           description,
// //           due_date,
// //           category_id,
// //           category:categories!goals_category_id_fkey (
// //             id,
// //             name
// //           )
// //         )
// //       `)
// //       .eq("status", "active")
// //       .order("created_at", { ascending: true })
// //       // .limit(6)
// //       .returns<Habit[]>(); // ← 型を明示

// //     if (!error && data) {
// //       setHabits(data);
// //     }
// //   };

// //   const fetchDoneToday = async (ymd: string) => {
// //     type Row = { habit_id: string };
// //     const { data, error } = await supabase
// //       .from("habit_logs")
// //       .select("habit_id")
// //       .eq("date", ymd)
// //       .returns<Row[]>();

// //     if (!error && data) {
// //       setDoneTodayIds(new Set(data.map((r) => r.habit_id)));
// //     }
// //   };

// //   // ---- Effects -------------------------------------------------

// //   useEffect(() => {
// //     void fetchHabits();
// //     void fetchDoneToday(today);
// //     getHabitLogsChannel().subscribe();
// //   }, [supabase, today]);

// //   useEffect(() => {
// //     const timer = window.setInterval(() => {
// //       const y = toYmdJST(new Date());
// //       if (y !== today) {
// //         setToday(y);
// //         setDoneTodayIds(new Set());
// //         void fetchDoneToday(y);
// //       }
// //     }, 60 * 1000);
// //     return () => window.clearInterval(timer);
// //   }, [today]);

// //   // ---- Actions -------------------------------------------------

// //   const onCheck = async (habitId: string) => {
// //     if (doneTodayIds.has(habitId)) return;
// //     setLoadingIds((ids) => [...ids, habitId]);

// //     const target = habits.find((h) => h.id === habitId);
// //     if (!target) {
// //       setLoadingIds((ids) => ids.filter((id) => id !== habitId));
// //       return;
// //     }

// //     const snapshot = habits.map((h) => ({ ...h }));

// //     setHabits((prev) =>
// //       prev.map((h) =>
// //         h.id === habitId
// //           ? {
// //             ...h,
// //             total_investment: h.total_investment + h.unit_amount,
// //             total_days: h.total_days + 1,
// //           }
// //           : h
// //       )
// //     );
// //     setDoneTodayIds((prev) => {
// //       const next = new Set(prev);
// //       next.add(habitId);
// //       return next;
// //     });

// //     sendHabitLogBroadcast({
// //       kind: "insert",
// //       date: today,
// //       amount: target.unit_amount,
// //       habitId,
// //       habitTitle: target.title ?? null,
// //     });

// //     try {
// //       const { error } = await supabase.rpc("log_done_and_update", {
// //         p_habit_id: habitId,
// //         p_on: today,
// //       });
// //       if (error) throw error;

// //       await fetchHabits();
// //       await fetchDoneToday(today);
// //     } catch (e) {
// //       console.error(e);
// //       setHabits(snapshot);
// //       setDoneTodayIds((prev) => {
// //         const next = new Set(prev);
// //         next.delete(habitId);
// //         return next;
// //       });
// //       alert("記録に失敗しました");
// //     } finally {
// //       setLoadingIds((ids) => ids.filter((id) => id !== habitId));
// //     }
// //   };

// //   // ---- Render --------------------------------------------------

// //   const habitsByGoal = habits.reduce<Record<string, Habit[]>>((acc, habit) => {
// //     const goalTitle = habit.goal?.title ?? "ゴールなし";
// //     if (!acc[goalTitle]) acc[goalTitle] = [];
// //     acc[goalTitle].push(habit);
// //     return acc;
// //   }, {});

// //   return (
// //     <div className="space-y-6">
// //       {Object.entries(habitsByGoal).map(([goalTitle, goalHabits]) => {
// //         const bgColor = assignGoalColor(goalTitle);

// //         return (
// //           <div key={goalTitle} className="space-y-1">

// //             <div className={`${bgColor} inline-block px-4 py-2 rounded-lg font-medium text-gray-900`}>
// //               {goalTitle}

// //               {/* カテゴリ名をタグ風に表示 */}
// //               {goalHabits[0]?.goal?.category && (
// //                 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-700">
// //                   {goalHabits[0].goal.category.name}
// //                 </span>
// //               )}
// //             </div>

// //             {/* ゴールに紐づく習慣リスト */}
// //             <div className="space-y-3 mt-2">
// //               {goalHabits.map((h) => {
// //                 const disabled =
// //                   loadingIds.includes(h.id) || doneTodayIds.has(h.id);
// //                 return (
// //                   <div
// //                     key={h.id}
// //                     className="flex flex-col rounded-lg border p-3 hover:shadow-sm transition-shadow"
// //                   >
// //                     <div className="flex items-center justify-between">
// //                       <div className="font-medium break-words">{h.title}</div>
// //                       <div className="flex items-center gap-2">
// //                         {/* ✅ 今日記録済みならコイン表示 */}
// //                         {doneTodayIds.has(h.id) && (
// //                           <span className="text-green-600 text-sm font-bold">
// //                             +{h.unit_amount} HBT
// //                           </span>
// //                         )}
// //                         <button
// //                           className="px-3 py-2 rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
// //                           disabled={disabled}
// //                           onClick={() => onCheck(h.id)}
// //                           aria-label={`${h.title} を +${h.unit_amount} 記録`}
// //                           title={disabled ? "今日は記録済み" : `+${h.unit_amount} 記録`}
// //                         >
// //                           +{h.unit_amount}
// //                         </button>
// //                       </div>
// //                     </div>

// //                     {/* トリガー行 */}
// //                     {h.trigger && (
// //                       <div className="text-sm text-gray-600 mt-1">
// //                         <span className="inline-block px-2 py-0.5 rounded bg-red-50">
// //                           Trigger: {h.trigger}
// //                         </span>
// //                       </div>
// //                     )}

// //                     {/* ステップ行 */}
// //                     {h.steps && (
// //                       <div className="text-sm text-gray-600 mt-1">
// //                         <span className="inline-block px-2 py-0.5 rounded bg-gray-50">
// //                           Steps: {h.steps}
// //                         </span>
// //                       </div>
// //                     )}

// //                     {/* 累計情報 */}
// //                     <div className="text-sm text-gray-600 mt-1">
// //                       累計 <span className="font-bold">{h.total_investment} HBT</span>
// //                       {" "}達成{" "} <span className="font-bold">{h.total_days}日</span>（目標 {h.target_days}日）
// //                     </div>
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //           </div>
// //         );
// //       })}

// //       {habits.length === 0 && (
// //         <p className="text-sm text-gray-500">
// //           アクティブな習慣がありません。まずは追加してください。
// //         </p>
// //       )}
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { supabaseBrowser } from "@/lib/supabaseBrowser";
// import { toYmdJST } from "@/lib/date";
// import { sendHabitLogBroadcast, getHabitLogsChannel } from "@/lib/realtime";

// // ---- 型定義 ----------------------------------------------------

// type Goal = {
//   id: string;
//   title: string;
//   category: {
//     id: string;
//     name: string;
//   } | null;
// };

// type Habit = {
//   id: string;
//   title: string;
//   unit_amount: number;
//   total_investment: number;
//   target_days: number;
//   total_days: number;
//   trigger: string | null;
//   steps: string | null;
//   goal: Goal | null;
// };

// // ---- コンポーネント --------------------------------------------

// export default function ActiveHabits() {
//   const supabase = supabaseBrowser();

//   const [habits, setHabits] = useState<Habit[]>([]);
//   const [loadingIds, setLoadingIds] = useState<string[]>([]);
//   const [doneTodayIds, setDoneTodayIds] = useState<Set<string>>(new Set());
//   const [today, setToday] = useState<string>(() => toYmdJST(new Date())); // JSTの今日
//   const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set()); // 折りたたみ状態

//   // ---- カラー設定 ------------------------------------------------

//   const availableColors = [
//     "bg-orange-200",
//     "bg-purple-200",
//     "bg-blue-200",
//     "bg-lime-200",
//     "bg-cyan-200",
//     "bg-green-200",
//     "bg-sky-200",
//     "bg-pink-200",
//     "bg-yellow-200",
//     "bg-teal-200",
//   ];

//   const goalColorMap: Record<string, string> = {};

//   // ゴールごとに被らない色を順番に割り当て
//   function assignGoalColor(goalTitle: string) {
//     if (!goalColorMap[goalTitle]) {
//       const usedColors = Object.values(goalColorMap);
//       const available = availableColors.filter((c) => !usedColors.includes(c));
//       const color = available.length > 0 ? available[0] : "bg-gray-200";
//       goalColorMap[goalTitle] = color;
//     }
//     return goalColorMap[goalTitle];
//   }

//   // ---- Data fetchers -------------------------------------------

//   const fetchHabits = async () => {
//     const { data, error } = await supabase
//       .from("habits")
//       .select(`
//         id,
//         title,
//         status,
//         unit_amount,
//         total_investment,
//         target_days,
//         total_days,
//         trigger,
//         steps,
//         goal:goals (
//           id,
//           title,
//           description,
//           due_date,
//           category_id,
//           category:categories!goals_category_id_fkey (
//             id,
//             name
//           )
//         )
//       `)
//       .eq("status", "active")
//       .order("created_at", { ascending: true })
//       .returns<Habit[]>(); // ← 型を明示

//     if (!error && data) {
//       setHabits(data);
//     }
//   };

//   const fetchDoneToday = async (ymd: string) => {
//     type Row = { habit_id: string };
//     const { data, error } = await supabase
//       .from("habit_logs")
//       .select("habit_id")
//       .eq("date", ymd)
//       .returns<Row[]>();

//     if (!error && data) {
//       setDoneTodayIds(new Set(data.map((r) => r.habit_id)));
//     }
//   };

//   // ---- Effects -------------------------------------------------

//   useEffect(() => {
//     void fetchHabits();
//     void fetchDoneToday(today);
//     getHabitLogsChannel().subscribe();
//   }, [supabase, today]);

//   useEffect(() => {
//     const timer = window.setInterval(() => {
//       const y = toYmdJST(new Date());
//       if (y !== today) {
//         setToday(y);
//         setDoneTodayIds(new Set());
//         void fetchDoneToday(y);
//       }
//     }, 60 * 1000);
//     return () => window.clearInterval(timer);
//   }, [today]);

//   // ---- Actions -------------------------------------------------

//   const onCheck = async (habitId: string) => {
//     if (doneTodayIds.has(habitId)) return;
//     setLoadingIds((ids) => [...ids, habitId]);

//     const target = habits.find((h) => h.id === habitId);
//     if (!target) {
//       setLoadingIds((ids) => ids.filter((id) => id !== habitId));
//       return;
//     }

//     const snapshot = habits.map((h) => ({ ...h }));

//     setHabits((prev) =>
//       prev.map((h) =>
//         h.id === habitId
//           ? {
//               ...h,
//               total_investment: h.total_investment + h.unit_amount,
//               total_days: h.total_days + 1,
//             }
//           : h
//       )
//     );
//     setDoneTodayIds((prev) => {
//       const next = new Set(prev);
//       next.add(habitId);
//       return next;
//     });

//     sendHabitLogBroadcast({
//       kind: "insert",
//       date: today,
//       amount: target.unit_amount,
//       habitId,
//       habitTitle: target.title ?? null,
//     });

//     try {
//       const { error } = await supabase.rpc("log_done_and_update", {
//         p_habit_id: habitId,
//         p_on: today,
//       });
//       if (error) throw error;

//       await fetchHabits();
//       await fetchDoneToday(today);
//     } catch (e) {
//       console.error(e);
//       setHabits(snapshot);
//       setDoneTodayIds((prev) => {
//         const next = new Set(prev);
//         next.delete(habitId);
//         return next;
//       });
//       alert("記録に失敗しました");
//     } finally {
//       setLoadingIds((ids) => ids.filter((id) => id !== habitId));
//     }
//   };

//   // ---- 折りたたみ制御 ------------------------------------------

//   const toggleGoal = (goalTitle: string) => {
//     setExpandedGoals((prev) => {
//       const next = new Set(prev);
//       if (next.has(goalTitle)) next.delete(goalTitle);
//       else next.add(goalTitle);
//       return next;
//     });
//   };

//   // ---- Render --------------------------------------------------

//   const habitsByGoal = habits.reduce<Record<string, Habit[]>>((acc, habit) => {
//     const goalTitle = habit.goal?.title ?? "ゴールなし";
//     if (!acc[goalTitle]) acc[goalTitle] = [];
//     acc[goalTitle].push(habit);
//     return acc;
//   }, {});

//   return (
//     <div className="space-y-4">
//       {Object.entries(habitsByGoal).map(([goalTitle, goalHabits]) => {
//         const bgColor = assignGoalColor(goalTitle);
//         const expanded = expandedGoals.has(goalTitle);

//         return (
//           <div key={goalTitle} className="space-y-1">
//             <button
//               onClick={() => toggleGoal(goalTitle)}
//               className={`${bgColor} inline-flex items-center justify-between w-full px-4 py-2 rounded-lg font-medium text-gray-900 transition hover:opacity-80`}
//             >
//               <div className="flex items-center gap-2">
//                 <span>{goalTitle}</span>
//                 {goalHabits[0]?.goal?.category && (
//                   <span className="px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-700">
//                     {goalHabits[0].goal.category.name}
//                   </span>
//                 )}
//               </div>
//               <span className="text-gray-700 text-sm">
//                 {expanded ? "▲" : "▼"}
//               </span>
//             </button>

//             {expanded && (
//               <div className="space-y-3 mt-2">
//                 {goalHabits.map((h) => {
//                   const disabled =
//                     loadingIds.includes(h.id) || doneTodayIds.has(h.id);
//                   return (
//                     <div
//                       key={h.id}
//                       className="flex flex-col rounded-lg border p-3 hover:shadow-sm transition-shadow"
//                     >
//                       <div className="flex items-center justify-between">
//                         <div className="font-medium break-words">{h.title}</div>
//                         <div className="flex items-center gap-2">
//                           {doneTodayIds.has(h.id) && (
//                             <span className="text-green-600 text-sm font-bold">
//                               +{h.unit_amount} HBT
//                             </span>
//                           )}
//                           <button
//                             className="px-3 py-2 rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
//                             disabled={disabled}
//                             onClick={() => onCheck(h.id)}
//                             aria-label={`${h.title} を +${h.unit_amount} 記録`}
//                             title={
//                               disabled ? "今日は記録済み" : `+${h.unit_amount} 記録`
//                             }
//                           >
//                             +{h.unit_amount}
//                           </button>
//                         </div>
//                       </div>

//                       {h.trigger && (
//                         <div className="text-sm text-gray-600 mt-1">
//                           <span className="inline-block px-2 py-0.5 rounded bg-red-100">
//                             Trigger: {h.trigger}
//                           </span>
//                         </div>
//                       )}

//                       {h.steps && (
//                         <div className="text-sm text-gray-600 mt-1">
//                           <span className="inline-block px-2 py-0.5 rounded underline">
//                             Steps: {h.steps}
//                           </span>
//                         </div>
//                       )}

//                       <div className="text-sm text-gray-600 mt-1">
//                         累計{" "}
//                         <span className="font-bold">{h.total_investment} HBT</span>{" "}
//                         達成{" "}
//                         <span className="font-bold">{h.total_days}日</span>（目標{" "}
//                         {h.target_days}日）
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         );
//       })}

//       {habits.length === 0 && (
//         <p className="text-sm text-gray-500">
//           アクティブな習慣がありません。まずは追加してください。
//         </p>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toYmdJST } from "@/lib/date";
import { sendHabitLogBroadcast, getHabitLogsChannel } from "@/lib/realtime";

// ---- 型定義 ----------------------------------------------------

type Goal = {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
  } | null;
};

type Habit = {
  id: string;
  title: string;
  unit_amount: number;
  total_investment: number;
  target_days: number;
  total_days: number;
  trigger: string | null;
  steps: string | null;
  goal: Goal | null;
};

// ---- コンポーネント --------------------------------------------

export default function ActiveHabits() {
  const supabase = supabaseBrowser();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [doneTodayIds, setDoneTodayIds] = useState<Set<string>>(new Set());
  const [today, setToday] = useState<string>(() => toYmdJST(new Date())); // JSTの今日

  // 🟢 追加：ポップアップ用 state
  const [showPopup, setShowPopup] = useState(false);
  const [popupHabitTitle, setPopupHabitTitle] = useState<string | null>(null);

  // ---- カラー設定 ------------------------------------------------

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

  function assignGoalColor(goalTitle: string) {
    if (!goalColorMap[goalTitle]) {
      const usedColors = Object.values(goalColorMap);
      const available = availableColors.filter((c) => !usedColors.includes(c));
      const color = available.length > 0 ? available[0] : "bg-gray-200";
      goalColorMap[goalTitle] = color;
    }
    return goalColorMap[goalTitle];
  }

  // ---- Data fetchers -------------------------------------------

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select(`
        id,
        title,
        status,
        unit_amount,
        total_investment,
        target_days,
        total_days,
        trigger,
        steps,
        goal:goals (
          id,
          title,
          description,
          due_date,
          category_id,
          category:categories!goals_category_id_fkey (
            id,
            name
          )
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .returns<Habit[]>();

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

    const updatedTotalDays = target.total_days + 1;
    const willReachGoal = updatedTotalDays >= target.target_days;

    try {
      const { error } = await supabase.rpc("log_done_and_update", {
        p_habit_id: habitId,
        p_on: today,
      });
      if (error) throw error;

      // 🎉 目標達成した場合にポップアップ表示
      if (willReachGoal) {
        setPopupHabitTitle(target.title);
        setShowPopup(true);
      }

      await fetchHabits();
      await fetchDoneToday(today);
    } catch (e) {
      console.error(e);
      alert("記録に失敗しました");
    } finally {
      setLoadingIds((ids) => ids.filter((id) => id !== habitId));
    }
  };

  // ---- Render --------------------------------------------------

  const habitsByGoal = habits.reduce<Record<string, Habit[]>>((acc, habit) => {
    const goalTitle = habit.goal?.title ?? "ゴールなし";
    if (!acc[goalTitle]) acc[goalTitle] = [];
    acc[goalTitle].push(habit);
    return acc;
  }, {});

  return (
    <div className="space-y-6 relative">
      {/* ✅ ポップアップ */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center space-y-4 w-80">
            <h2 className="text-lg font-semibold">目標日数を達成しました 🎉</h2>
            <p className="text-gray-600">{popupHabitTitle}</p>
            <button
              onClick={() => {
                setShowPopup(false);
                setPopupHabitTitle(null);
              }}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {Object.entries(habitsByGoal).map(([goalTitle, goalHabits]) => {
        const bgColor = assignGoalColor(goalTitle);

        return (
          <div key={goalTitle} className="space-y-1">
            <div
              className={`${bgColor} inline-block px-4 py-2 rounded-lg font-medium text-gray-900`}
            >
              {goalTitle}
              {goalHabits[0]?.goal?.category && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/60 text-gray-700">
                  {goalHabits[0].goal.category.name}
                </span>
              )}
            </div>

            <div className="space-y-3 mt-2">
              {goalHabits.map((h) => {
                const disabled =
                  loadingIds.includes(h.id) || doneTodayIds.has(h.id);
                return (
                  <div
                    key={h.id}
                    className="flex flex-col rounded-lg border p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium break-words">{h.title}</div>
                      <div className="flex items-center gap-2">
                        {doneTodayIds.has(h.id) && (
                          <span className="text-green-600 text-sm font-bold">
                            +{h.unit_amount} HBT
                          </span>
                        )}
                        <button
                          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={disabled}
                          onClick={() => onCheck(h.id)}
                          aria-label={`${h.title} を +${h.unit_amount} 記録`}
                          title={
                            disabled
                              ? "今日は記録済み"
                              : `+${h.unit_amount} 記録`
                          }
                        >
                          +{h.unit_amount}
                        </button>
                      </div>
                    </div>

                    {h.trigger && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-red-50">
                          Trigger: {h.trigger}
                        </span>
                      </div>
                    )}

                    {h.steps && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-50">
                          Steps: {h.steps}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 mt-1">
                      累計 <span className="font-bold">{h.total_investment} HBT</span>{" "}
                      達成 <span className="font-bold">{h.total_days}日</span>（目標{" "}
                      {h.target_days}日）
                    </div>
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
