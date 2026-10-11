"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TEAM_NAME } from "@/config";
import { InstallButton } from "./InstallButton";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/games", label: "경기" },
  { href: "/stats", label: "스탯" },
  { href: "/highlights", label: "하이라이트" },
  { href: "/locker", label: "라커룸" },
];

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto max-w-5xl pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
        <div className="flex h-14 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 pt-0.5 font-display text-base text-white">
              JS
            </span>
            <span className="pt-0.5 font-display text-2xl tracking-wide">{TEAM_NAME}</span>
          </Link>
          <InstallButton />
        </div>
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "border-blue-500 text-blue-300"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
