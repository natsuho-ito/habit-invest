// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // すでにログイン済みなら / へリダイレクト
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
      else setLoading(false);
    });

    // ログイン直後のセッション変化を検知
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });
    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (loading) return null;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
    {/* <main className="mx-auto max-w-md p-6">*/}
      <header className="flex items-center">
        <LeafIcon className="h-6 w-6" />
        <span className="font-bold">ミエル</span>
      </header>
      {/* <h1 className="text-2xl font-semibold mb-4 flex">
        <LeafIcon className="h-6 w-6" />
        <span className="font-bold">ミエル</span>
      </h1> */}
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        // 必要なら OAuth を追加: providers={["google"]}
        providers={[]}
        // Magic Link を使う場合は passwordless を有効化（デフォルトでOK）
        // view="sign_in"
      />
      <p className="text-sm text-gray-500 mt-4">
        Use your email to receive a sign-in link.
      </p>
    </main>
  );
  function LeafIcon({ className = "" }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M21 3c-7 1-13.5 4.5-16 11 3 3 8 3.5 11 1.5 2.5-2 3.5-5.5 3-9.5 1-.5 1-2-.5-3z" />
        <path d="M4 20c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
}
