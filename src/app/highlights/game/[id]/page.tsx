import Link from "next/link";
import { notFound } from "next/navigation";
import { HighlightBackLink } from "@/components/HighlightBackLink";
import { HighlightPlayer } from "@/components/HighlightPlayer";
import { TEAM_NAME } from "@/config";
import { getSeason } from "@/lib/data";
import { fmtLongDate } from "@/lib/format";
import { buildClips, NO_TOURNAMENT, NO_TOURNAMENT_NAME, searchParam } from "@/lib/highlights";
import { gameResult } from "@/lib/stats";
import { youtubeId, youtubeThumb } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function GameHighlightsPage(props: PageProps<"/highlights/game/[id]">) {
  const [{ id }, sp, season] = await Promise.all([props.params, props.searchParams, getSeason()]);
  const game = season.games.find((g) => g.id === id);
  if (!game) notFound();

  const g = gameResult(season, game);
  const clips = buildClips(season).filter((c) => c.gameId === id);
  const players = season.players.filter((p) => clips.some((c) => c.playerId === p.id));
  const tournamentKey = game.tournamentId || NO_TOURNAMENT;
  const videoId = youtubeId(game.youtubeUrl);

  return (
    <div className="space-y-6">
      <HighlightBackLink href={`/highlights/tournament/${tournamentKey}`} label={g.tournamentName || NO_TOURNAMENT_NAME} />

      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 sm:p-6">
        {videoId && (
          // eslint-disable-next-line @next/next/no-img-element -- 유튜브 썸네일 (흐린 배경)
          <img src={youtubeThumb(videoId)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-md" />
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-blue-950/60" />
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-300">GAME HIGHLIGHTS</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black sm:text-3xl">vs {g.opponent}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {fmtLongDate(g.date)}
                {g.round && ` · ${g.round}`} · 클립 {clips.length}개
              </p>
            </div>
            <p className="font-display text-5xl leading-none tabular-nums">
              <span className="sr-only">{TEAM_NAME} </span>
              <span className={g.isComplete && g.won ? "text-blue-300" : ""}>{g.ourScore}</span>
              <span className="mx-1 text-gray-600">:</span>
              <span className="text-gray-400">{g.opponentScore}</span>
            </p>
          </div>
          <Link href={`/games/${id}`} className="mt-3 inline-flex min-h-11 items-center text-sm text-gray-300 hover:text-blue-300">
            박스스코어 보기 →
          </Link>
        </div>
      </section>

      {clips.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">이 경기에는 아직 하이라이트가 없어요.</p>
      ) : (
        <HighlightPlayer
          clips={clips}
          players={players.map((p) => ({ id: p.id, label: `#${p.number} ${p.name}` }))}
          initial={{ player: searchParam(sp.p), kind: searchParam(sp.k), clip: Number(searchParam(sp.c)) || 0 }}
        />
      )}
    </div>
  );
}
