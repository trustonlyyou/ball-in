import Link from "next/link";
import { notFound } from "next/navigation";
import { HighlightBackLink } from "@/components/HighlightBackLink";
import { getSeason } from "@/lib/data";
import { fmtLongDate } from "@/lib/format";
import { buildClips, NO_TOURNAMENT, NO_TOURNAMENT_NAME } from "@/lib/highlights";
import { gameResult } from "@/lib/stats";
import { youtubeId, youtubeThumb } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function TournamentHighlightsPage(props: PageProps<"/highlights/tournament/[id]">) {
  const [{ id }, season] = await Promise.all([props.params, getSeason()]);
  const tournament = id === NO_TOURNAMENT ? { id, name: NO_TOURNAMENT_NAME } : season.tournaments.find((t) => t.id === id);
  if (!tournament) notFound();

  const clips = buildClips(season);
  const games = season.games
    .filter((g) => (id === NO_TOURNAMENT ? !g.tournamentId : g.tournamentId === id))
    .map((g) => ({ ...gameResult(season, g), clips: clips.filter((c) => c.gameId === g.id).length }))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!games.length) notFound();
  const total = games.reduce((n, g) => n + g.clips, 0);

  return (
    <div className="space-y-6">
      <HighlightBackLink />
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-blue-300">TOURNAMENT</p>
        <h1 className="mt-1 text-3xl font-black">{tournament.name}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {games.length}경기 · 클립 {total}개
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {games.map((g) => {
          const has = g.clips > 0;
          const videoId = youtubeId(g.youtubeUrl);
          const result = !g.isComplete ? "진행 중" : g.won ? "WIN" : "LOSS";
          const body = (
            <>
              {videoId ? (
                // eslint-disable-next-line @next/next/no-img-element -- 유튜브 썸네일
                <img
                  src={youtubeThumb(videoId)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-300 motion-safe:group-hover:scale-105 group-hover:opacity-75"
                />
              ) : (
                <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <span
                className={`absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-black ${
                  !g.isComplete ? "bg-amber-400/90 text-black" : g.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-100"
                }`}
              >
                {result}
              </span>
              <span className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-gray-100 backdrop-blur">
                {has ? `클립 ${g.clips}` : "클립 없음"}
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold">vs {g.opponent}</span>
                  <span className="block truncate text-xs text-gray-300">
                    {fmtLongDate(g.date)}
                    {g.round && ` · ${g.round}`}
                  </span>
                </span>
                <span className="shrink-0 font-display text-4xl leading-none tabular-nums">
                  <span className={g.isComplete && g.won ? "text-blue-300" : ""}>{g.ourScore}</span>
                  <span className="mx-0.5 text-gray-500">:</span>
                  <span className="text-gray-300">{g.opponentScore}</span>
                </span>
              </span>
            </>
          );
          const card = "group relative block aspect-[16/9] overflow-hidden rounded-2xl border bg-gray-900";
          return (
            <li key={g.id}>
              {has ? (
                <Link
                  href={`/highlights/game/${g.id}`}
                  className={`${card} border-gray-800 transition-colors duration-200 hover:border-blue-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400`}
                >
                  {body}
                </Link>
              ) : (
                <div className={`${card} border-gray-900 opacity-50`} aria-disabled>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
