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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
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
}
