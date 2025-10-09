"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// --- スキーマ定義 ----------------------------------------------------
const schema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(50),
  description: z.string().max(50).optional(),
  category_id: z.string().min(1, "カテゴリを選択してください"),
});

// --- 型定義 ----------------------------------------------------------
type Category = { id: string; name: string };

export default function AddGoalForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- カテゴリ一覧の取得 -------------------------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) {
        console.error(error);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, [supabase]);

  // --- フォーム変更 --------------------------------------------------
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // --- 送信処理 ------------------------------------------------------
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
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error("ログインが必要です");

      const insertPayload = {
        user_id: uid,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category_id: parsed.data.category_id,
      };

      const { error: insErr } = await supabase.from("goals").insert(insertPayload);
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

  // --- JSX -----------------------------------------------------------
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

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
        <label className="block text-sm mb-1">詳細（任意）</label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={onChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">カテゴリ</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={onChange}
          className="w-full border rounded p-2"
        >
          <option value="">-- カテゴリー (投資銘柄) を選択してください --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
