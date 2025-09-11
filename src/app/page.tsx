import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import SevenDayChart from "@/components/SevenDayChart";
import ActiveHabits from "@/components/ActiveHabits";
import Link from "next/link";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">自己投資ポートフォリオ</h1>
        <Link href="/habits/new" className="rounded border px-3 py-2">＋ 新しい習慣</Link>
      </header>

      <SevenDayChart />
      <section>
        <h2 className="font-medium mb-2">アクティブ習慣（最大5件）</h2>
        <ActiveHabits />
      </section>
    </main>
  );
}
