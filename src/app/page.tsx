import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import InvestmentDashboard from "@/components/InvestmentDashboard";
import SevenDayChart from "@/components/SevenDayChart";
import PortfolioChart from "@/components/PortfolioChart";
import ActiveHabits from "@/components/ActiveHabits";
// import Link from "next/link";
import Nav from "@/components/Nav";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <Nav />
      </header>
      <InvestmentDashboard />
      {/* <SevenDayChart />
      <PortfolioChart /> */}
      <section>
        <h2 className="font-medium mb-2">アクティブ習慣（最大5件）</h2>
        <ActiveHabits />
      </section>
    </main>
  );
}
