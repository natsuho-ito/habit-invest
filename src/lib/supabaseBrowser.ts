"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "./types"; // 型生成したら利用

export const supabaseBrowser = () =>
  createClientComponentClient/*<Database>*/();
