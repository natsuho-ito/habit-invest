"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthButton() {
  const supabase = supabaseBrowser();

  return (
    <button
      className="px-3 py-2 rounded border"
      onClick={async () => {
        await supabase.auth.signOut();
        location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
