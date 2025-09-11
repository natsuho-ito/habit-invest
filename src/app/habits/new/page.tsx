// src/app/habits/new/page.tsx
import AddHabitForm from "@/components/AddHabitForm";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function NewHabitPage() {
  // 認証ガード（未ログインなら /login へ）
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">新しい習慣を追加</h1>
      <AddHabitForm />
    </main>
  );
}
