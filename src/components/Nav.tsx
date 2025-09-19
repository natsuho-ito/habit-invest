"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "@/components/AuthButton";

const tabs = [
  { href: "/", label: "ポートフォリオ" },
  { href: "/habits/new", label: "習慣を登録" },
  { href: "/archive", label: "達成した習慣" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-2xl h-12 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {tabs.map((t) => {
            const active =
              pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "px-3 py-1.5 rounded-md transition-colors " +
                  (active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <AuthButton />
      </div>
    </nav>
  );
}
