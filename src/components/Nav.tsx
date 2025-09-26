"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "@/components/AuthButton";

const tabs = [
  // { href: "/", label: "ミエル" },
  { href: "/habits/new", label: "習慣の追加", id: 1 },
  { href: "/archive", label: "ポートフォリオ", id: 2 },
];

export default function Nav() {
  const pathname = usePathname();

  return (
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-2xl h-12 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-md text-green-800 font-bold">    
          <Link href="/" className="pr-3 flex items-center gap-1">
              <CheckCircleIcon className="h-6 w-6" />
              InvestSelf
          </Link>
          </div>
          <div className="flex items-center gap-2 text-sm">
          {tabs.map((t) => {
              const active =
              pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
              return (
              <Link
                  key={t.href}
                  href={t.href}
                  className={
                  "px-1.5 py-1.5 rounded-md transition-colors " +
                  (active
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100")
                  }
              >
                  {t.id == 1 ? <PlusIcon className="h-6 w-6" /> : <TrophyIcon className="h-6 w-6" />}
              </Link>
              );
          })}
          </div>
          <div className="pl-4"><AuthButton /></div>
      </div>
      </nav>
  );
  
  function LeafIcon({ className = "" }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M21 3c-7 1-13.5 4.5-16 11 3 3 8 3.5 11 1.5 2.5-2 3.5-5.5 3-9.5 1-.5 1-2-.5-3z" />
        <path d="M4 20c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  function CheckCircleIcon({ className = "" }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        {/* 丸 */}
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* チェックマーク */}
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11 5h2v14h-2zM5 11h14v2H5z" />
    </svg>
  );
  }
  function TrophyIcon({ className = "" }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M5 5h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V5z" />
        <path d="M7 20h10v-2a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v2z" />
        <path d="M3 6h2a3 3 0 0 0 3 3H6A3 3 0 0 1 3 6zm18 0h-2a3 3 0 0 1-3 3h2a3 3 0 0 0 3-3z" />
      </svg>
    );
  }
}
