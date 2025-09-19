// src/app/auth/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth | ミエル",
  description: "ログインやサインアップページ",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-ink-50 text-ink-900">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
            <h1 className="mb-6 text-center text-2xl font-bold text-brand-600">
              ミエル
            </h1>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
