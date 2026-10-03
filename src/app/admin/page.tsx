import type { Metadata } from "next";
import Link from "next/link";
import { GameForm } from "@/components/admin/GameForm";
import { PinForm } from "@/components/admin/PinForm";
import { isAdmin } from "@/lib/admin";
import { getSeason } from "@/lib/data";
import { fmtLongDate } from "@/lib/format";
import { gameResult } from "@/lib/stats";
import { createGame, logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "기록 관리", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <PinForm length={process.env.ADMIN_PIN?.length ?? 4} />;

  const season = await getSeason();
  const games = season.games.map((g) => gameResult(season, g)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">기록 관리</h1>
        <form action={logout}>
          <button type="submit" className="min-h-11 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:text-gray-100">
            로그아웃
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">경기 목록</h2>
        {games.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">아직 경기가 없어요. 아래에서 새 경기를 만들어주세요.</p>
        ) : (
          <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {games.map((g) => (
              <li key={g.id}>
                <Link href={`/admin/games/${g.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-gray-800/60">
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      g.isComplete ? (g.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300") : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {g.isComplete ? (g.won ? "승" : "패") : "진행"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">vs {g.opponent}</p>
                    <p className="truncate text-xs text-gray-500">
                      {fmtLongDate(g.date)}
                      {g.tournamentName && ` · ${g.tournamentName}`}
                    </p>
                  </div>
                  <span className="font-display text-2xl tabular-nums">
                    {g.ourScore}:{g.opponentScore}
                  </span>
                  <span className="text-sm font-bold text-blue-300">기록 →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-bold">새 경기 만들기</h2>
        <GameForm action={createGame} tournaments={season.tournaments} submitLabel="경기 만들고 기록 시작" />
      </section>
    </div>
  );
}
