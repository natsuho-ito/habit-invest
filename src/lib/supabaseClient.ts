"use client";

import { cookies } from "next/headers";
import {
  createClientComponentClient,
  createServerComponentClient,
  createRouteHandlerClient,
  type SupabaseClient,
} from "@supabase/auth-helpers-nextjs";
// 型を使わないなら Database の import は削除OK
// import type { Database } from "./types";

// ── 1) Client Components / クライアント用（use client のコンポーネントから）
export const supabaseBrowser = () =>
  createClientComponentClient/*<Database>*/();

// ── 2) Server Components / サーバ用（App Router のサーバコンポーネントから）
export const supabaseServer = () =>
  createServerComponentClient/*<Database>*/({ cookies });

// ── 3) Route Handlers / API ルート用（app/api/**/route.ts から）
export const supabaseRoute = () =>
  createRouteHandlerClient/*<Database>*/({ cookies });

/**
 * 🔎 補足：
 * もし「匿名・公開データだけを読む簡易クライアント」が欲しい場合は、
 * 下の supabaseAnon を使えます（セッション不要の場面だけ）。
 * 認証付きの操作には使わないでください。
 */
// import { createClient } from "@supabase/supabase-js";
// export const supabaseAnon = () =>
//   createClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//   );
