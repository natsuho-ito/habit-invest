import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "./types";

export const supabaseRoute = () =>
  createRouteHandlerClient/*<Database>*/({ cookies });
