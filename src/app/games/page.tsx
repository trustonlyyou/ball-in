import Link from "next/link";
import { TournamentFilter } from "@/components/TournamentFilter";
import { getSeason } from "@/lib/data";
import { fmtDate, fmtLongDate } from "@/lib/format";
import { completedGames, seasonRecord, upcomingGames, type GameResult } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function GamesPage(props: PageProps<"/games">) {
  const { t } = await props.searchParams;
  const season = await getSeason();
  const tournamentId = typeof t === "string" && season.tournaments.some((x) => x.id === t) ? t : null;

  const inTournament = <G extends { tournamentId: string }>(g: G) => !tournamentId || g.tournamentId === tournamentId;
  const results = completedGames(season).filter(inTournament);
  const upcoming = upcomingGames(season).filter(inTournament);
  const record = seasonRecord(results);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-5xl leading-none tracking-wide">GAMES</h1>
        {record.total > 0 && (
          <p className="text-sm text-gray-400">
            <span className="font-bold text-blue-300 tabular-nums">{record.wins}승</span>{" "}
            <span className="font-bold text-gray-300 tabular-nums">{record.losses}패</span>
            <span className="text-gray-600"> · </span>
            {record.total}경기
          </p>
        )}
      </div>
      <TournamentFilter basePath="/games" tournaments={season.tournaments} active={tournamentId} />

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-400">예정 경기</h2>
          <ul className="space-y-2">
            {upcoming.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl border border-dashed border-gray-700 px-4 py-3">
                <span className="rounded-md bg-gray-800 px-2 py-1 text-xs font-bold text-gray-300">예정</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">vs {g.opponent}</p>
                  <p className="truncate text-xs text-gray-500">
                    {fmtLongDate(g.date)}
                    {g.round && ` · ${g.round}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        {upcoming.length > 0 && <h2 className="mb-2 text-sm font-bold text-gray-400">경기 결과</h2>}
        {results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">
            아직 경기 기록이 없어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


function GameCard({ game: g }: { game: GameResult }) {
  return (
    <li>
      <Link
        href={`/games/${g.id}`}
        className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 transition-colors duration-200 hover:border-gray-600 focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-black ${
            g.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {g.won ? "승" : "패"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">vs {g.opponent}</p>
          <p className="truncate text-xs text-gray-500">
            {fmtDate(g.date)} · {g.tournamentName}
            {g.round && ` · ${g.round}`}
          </p>
        </div>
        <p className="shrink-0 font-display text-3xl leading-none tabular-nums">
          <span className={g.won ? "text-blue-300" : ""}>{g.ourScore}</span>
          <span className="mx-1 text-gray-600">:</span>
          <span className={g.won ? "text-gray-400" : "text-red-300"}>{g.opponentScore}</span>
        </p>
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-gray-600 transition-colors group-hover:text-gray-300">
          <path d="M7.5 4.5L13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  );
}
