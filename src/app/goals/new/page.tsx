// src/app/habits/new/page.tsx
import AddGoalForm from "@/components/AddGoalForm";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function NewGoalPage() {
  // 認証ガード（未ログインなら /login へ）
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    // <main className="max-w-lg mx-auto p-6">
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <Nav />
      </header>
      <h1 className="text-2xl font-semibold mb-4">新しい目標を追加</h1>
      <AddGoalForm />
    </main>
  );
}
