"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthButton() {
  const supabase = supabaseBrowser();

  return (
    <button
      className="px-2 py-1 text-sm border rounded"
      onClick={async () => {
        await supabase.auth.signOut();
        location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
