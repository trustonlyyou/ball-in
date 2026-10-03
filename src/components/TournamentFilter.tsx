import Link from "next/link";
import type { Tournament } from "@/lib/types";

/** 대회 필터 칩. 선택값은 URL ?t= 로 유지되어 링크로 공유 가능 */
export function TournamentFilter({ basePath, tournaments, active }: { basePath: string; tournaments: Tournament[]; active: string | null }) {
  if (tournaments.length === 0) return null;
  return (
    <nav aria-label="대회 선택" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      <Chip href={basePath} active={!active}>
        전체
      </Chip>
      {tournaments.map((t) => (
        <Chip key={t.id} href={`${basePath}?t=${t.id}`} active={active === t.id}>
          {t.name}
        </Chip>
      ))}
    </nav>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 ${
        active ? "bg-blue-500 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
      }`}
    >
      {children}
    </Link>
  );
}
