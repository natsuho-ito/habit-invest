import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import SevenDayChart from "@/components/SevenDayChart";
import ActiveHabits from "@/components/ActiveHabits";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">私の投資ポートフォリオ</h1>
        <p className="text-sm text-gray-600">直近7日間の自己投資履歴</p>
      </header>

      <div className="space-y-6">
        <SevenDayChart />
        <section>
          <h2 className="font-medium mb-2">今取り組んでいる習慣（最大5件）</h2>
          <ActiveHabits />
        </section>
      </div>
    </>
  );
}
