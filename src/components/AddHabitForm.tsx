// // src/components/AddHabitForm.tsx
// "use client";

// import { useState } from "react";
// import { z } from "zod";
// import { useRouter } from "next/navigation";
// import { supabaseBrowser } from "@/lib/supabaseBrowser";

// const schema = z.object({
//   title: z.string().min(1, "タイトルは必須です").max(50),
//   trigger: z.string().max(50).optional(),
//   target_days: z.coerce.number().int().min(1).max(365)
//     .default(30),
//   unit_amount: z.coerce.number().int().min(1).max(999)
//     .default(1),
// });

// export default function AddHabitForm() {
//   const supabase = supabaseBrowser();
//   const router = useRouter();

//   const [form, setForm] = useState({
//     title: "",
//     trigger: "",
//     target_days: 30,
//     unit_amount: 1,
//   });
//   const [error, setError] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);

//   const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
//   };

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     const parsed = schema.safeParse(form);
//     if (!parsed.success) {
//       setError(parsed.error.issues[0].message);
//       return;
//     }

//     setSubmitting(true);
//     try {
//       // セッション取得 & ユーザーID
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user?.id) {
//         setError("ログインが必要です");
//         setSubmitting(false);
//         return;
//       }

//       // アクティブ習慣が5件未満か確認
//       const { data: actives, error: countErr } = await supabase
//         .from("habits")
//         .select("id", { count: "exact", head: true })
//         .eq("status", "active");

//       if (countErr) throw countErr;
//       if (!actives || actives.length === 0) {
//         // head:true のとき data は null になるため count は別取得
//       }
//       // Supabaseは head:true の場合 dataはnull、countはレスポンスに含まれる
//       // auth-helpers 経由での count は型付けが難しいので再取得（簡単さ優先）
//       const { count } = await supabase
//         .from("habits")
//         .select("*", { count: "exact", head: true })
//         .eq("status", "active");

//       if ((count ?? 0) >= 5) {
//         setError("アクティブ習慣は最大5件までです。1件アーカイブしてから追加してください。");
//         setSubmitting(false);
//         return;
//       }

//       // INSERT
//       const insertPayload = {
//         user_id: session.user.id,
//         title: parsed.data.title,
//         trigger: parsed.data.trigger || null,
//         target_days: parsed.data.target_days,
//         unit_amount: parsed.data.unit_amount,
//         // total_days / total_investment / status はデフォルト値に任せる
//       };

//       const { error: insErr } = await supabase
//         .from("habits")
//         .insert(insertPayload);

//       if (insErr) throw insErr;

//       router.replace("/"); // ダッシュボードへ
//       router.refresh();
//     } catch (err: unknown) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : typeof err === "string"
//           ? err
//           : "作成に失敗しました";
//       setError(message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <form onSubmit={onSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm mb-1">タイトル</label>
//         <input
//           name="title"
//           value={form.title}
//           onChange={onChange}
//           className="w-full rounded border px-3 py-2"
//           placeholder="例: 朝ストレッチ"
//           required
//         />
//       </div>

//       <div>
//         <label className="block text-sm mb-1">トリガー（任意）</label>
//         <input
//           name="trigger"
//           value={form.trigger}
//           onChange={onChange}
//           className="w-full rounded border px-3 py-2"
//           placeholder="例: 起きたらすぐ"
//         />
//       </div>

//       <div className="flex gap-4">
//         <div className="flex-1">
//           <label className="block text-sm mb-1">目標日数</label>
//           <input
//             type="number"
//             name="target_days"
//             value={form.target_days}
//             onChange={onChange}
//             min={1}
//             max={365}
//             className="w-full rounded border px-3 py-2"
//           />
//         </div>
//         <div className="flex-1">
//           <label className="block text-sm mb-1">1回あたりの投資額</label>
//           <input
//             type="number"
//             name="unit_amount"
//             value={form.unit_amount}
//             onChange={onChange}
//             min={1}
//             max={999}
//             className="w-full rounded border px-3 py-2"
//           />
//         </div>
//       </div>

//       {error && <p className="text-sm text-red-600">{error}</p>}

//       <button
//         type="submit"
//         disabled={submitting}
//         className="rounded px-4 py-2 bg-black text-white disabled:opacity-60"
//       >
//         {submitting ? "追加中…" : "追加する"}
//       </button>
//     </form>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const schema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(50),
  trigger: z.string().max(50).optional(),
  target_days: z.coerce.number().int().min(1).max(365).default(30),
  unit_amount: z.coerce.number().int().min(1).max(999).default(1),
  goal_id: z.string().nonempty("ゴールを選択してください"),
});

type Goal = { id: string; title: string };

export default function AddHabitForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    trigger: "",
    target_days: 30,
    unit_amount: 1,
    goal_id: "",
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ユーザーのゴール一覧を取得（ログインユーザーのものだけ）
  useEffect(() => {
    let mounted = true;

    const fetchGoals = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) {
        // ログインしてない場合は空のまま
        setGoals([]);
        return;
      }

      const { data, error } = await supabase
        .from("goals")
        .select("id, title")
        .eq("user_id", uid) // <- ここで自分のゴールのみ取得
        .order("created_at", { ascending: true });

      if (error) {
        console.error("ゴール取得エラー:", error);
      } else if (mounted) {
        setGoals(data ?? []);
      }
    };

    fetchGoals();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // onChange: number フィールドは数値へ変換
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "target_days" || name === "unit_amount") {
      setForm((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      // セッションとユーザーID
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error("ログインが必要です");

      // insert に user_id と goal_id を含める
      const insertPayload = {
        user_id: uid,
        title: parsed.data.title,
        trigger: parsed.data.trigger || null,
        target_days: parsed.data.target_days,
        unit_amount: parsed.data.unit_amount,
        goal_id: parsed.data.goal_id,
      };

      const { error: insErr } = await supabase.from("habits").insert(insertPayload);

      if (insErr) throw insErr;

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "作成に失敗しました";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm mb-1">ゴール</label>
        <select
          name="goal_id"
          value={form.goal_id}
          onChange={onChange}
          className="w-full border rounded p-2"
          required
        >
          <option value="">-- ゴールを選択してください --</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">タイトル</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">トリガー（任意）</label>
        <input
          type="text"
          name="trigger"
          value={form.trigger}
          onChange={onChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1">目標日数</label>
          <input
            type="number"
            name="target_days"
            value={form.target_days}
            onChange={onChange}
            min={1}
            max={365}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1">1回あたりの投資額</label>
          <input
            type="number"
            name="unit_amount"
            value={form.unit_amount}
            onChange={onChange}
            min={1}
            max={999}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded px-4 py-2 bg-black text-white disabled:opacity-60"
      >
        {submitting ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
