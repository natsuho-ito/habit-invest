import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  const supabase = supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p>Welcome, {session.user.email}</p>
      <div className="mt-4">
        <AuthButton />
      </div>
    </main>
  );
}
