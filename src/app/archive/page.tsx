import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function ArchivePage() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: habits } = await supabase
    .from("habits")
    .select("id,title,total_investment,target_days,total_days,archived_at,created_at")
    .eq("status", "archived")
    .order("archived_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <Nav />
      </header>
      <h1 className="text-xl font-semibold">殿堂入り（資産コレクション）</h1>
      {(!habits || habits.length === 0) ? (
        <p className="text-sm text-gray-500">まだ殿堂入りした習慣はありません。</p>
      ) : (
        <div className="space-y-3">
          {habits!.map(h => (
            <div key={h.id} className="rounded border p-3">
              <div className="font-medium">{h.title}</div>
              <div className="text-sm text-gray-600">
                達成：{h.total_days}/{h.target_days}日 ・ 累計投資：{h.total_investment} コイン
              </div>
              <div className="text-xs text-gray-500">
                追加: {new Date(h.created_at!).toLocaleDateString()} ／ 卒業: {h.archived_at ? new Date(h.archived_at).toLocaleDateString() : "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
