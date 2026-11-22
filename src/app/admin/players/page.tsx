import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { isAdmin } from "@/lib/admin";
import { getSeason } from "@/lib/data";
import type { Player } from "@/lib/types";
import { savePlayer } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "선수 관리", robots: { index: false } };

export default async function AdminPlayersPage() {
  if (!(await isAdmin())) redirect("/admin");
  const season = await getSeason();
  const active = season.players.filter((p) => p.isActive);
  const inactive = season.players.filter((p) => !p.isActive);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-gray-400 hover:text-gray-200">
          ← 기록 관리
        </Link>
        <h1 className="text-2xl font-bold">선수 관리</h1>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          활동 중 <span className="text-sm font-medium text-gray-500 tabular-nums">{active.length}명</span>
        </h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">아직 선수가 없어요. 아래에서 추가해주세요.</p>
        ) : (
          <PlayerList players={active} />
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">
            비활성 <span className="text-sm font-medium text-gray-500 tabular-nums">{inactive.length}명</span>
          </h2>
          <PlayerList players={inactive} />
        </section>
      )}

      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-bold">선수 추가</h2>
        <PlayerForm action={savePlayer.bind(null, null)} submitLabel="선수 추가" />
      </section>
    </div>
  );
}

function PlayerList({ players }: { players: Player[] }) {
  return (
    <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      {players.map((p) => (
        <li key={p.id}>
          <Link href={`/admin/players/${p.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-gray-800/60">
            <span className="w-9 shrink-0 font-display text-2xl leading-none text-gray-400 tabular-nums">{p.number}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {p.name}
                {p.isElite && <span className="ml-1.5 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs font-bold text-amber-300">선출</span>}
              </span>
              <span className="block truncate text-xs text-gray-500">
                {[p.positions.join("/"), p.heightCm && `${p.heightCm}cm`, p.birthDate].filter(Boolean).join(" · ") || "추가 정보 없음"}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-blue-300">수정 →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
