import Link from "next/link";
import { HighlightPlayerPicker, type PickerPlayer } from "@/components/HighlightPlayerPicker";
import { getSeason } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { buildClips, CLIP_KINDS, tournamentHighlights } from "@/lib/highlights";
import { youtubeThumb } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export default async function HighlightsPage() {
  const season = await getSeason();
  const clips = buildClips(season);

  const players: PickerPlayer[] = season.players.map((p) => {
    const mine = clips.filter((c) => c.playerId === p.id);
    return {
      id: p.id,
      name: p.name,
      number: p.number,
      photoUrl: p.photoUrl,
      positions: p.positions,
      clips: mine.length,
      // 가장 많은 종류 2개
      top: CLIP_KINDS.map((k) => ({ label: k.label, n: mine.filter((c) => c.kind === k.key).length }))
        .filter((k) => k.n)
        .sort((a, b) => b.n - a.n)
        .slice(0, 2),
    };
  });
  const tournaments = tournamentHighlights(season, clips);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-black p-5 sm:p-7">
        <span aria-hidden className="pointer-events-none absolute -right-4 -bottom-10 font-display text-[9rem] leading-none text-white/[0.04] select-none sm:text-[12rem]">
          PLAY
        </span>
        <h1 className="relative font-display text-5xl leading-none tracking-wide sm:text-6xl">HIGHLIGHTS</h1>
        <p className="relative mt-2 text-sm text-gray-300">대회·경기·선수별로 득점·수비 장면을 이어서 봐요.</p>
        <p className="relative mt-4 text-sm text-gray-400">
          <span className="font-display text-3xl leading-none text-white tabular-nums">{clips.length}</span> 클립 ·{" "}
          <span className="font-display text-3xl leading-none text-white tabular-nums">{new Set(clips.map((c) => c.gameId)).size}</span> 경기
        </p>
      </section>

      {/* 대회별 */}
      {tournaments.length > 0 && (
        <section aria-labelledby="by-tournament">
          <h2 id="by-tournament" className="mb-3 text-lg font-bold">
            대회별 보기
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/highlights/tournament/${t.id}`}
                  className="group relative block aspect-[16/9] overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 transition-colors duration-200 hover:border-blue-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 유튜브 썸네일 */}
                  <img
                    src={youtubeThumb(t.videoId)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-300 motion-safe:group-hover:scale-105 group-hover:opacity-75"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-amber-300 backdrop-blur">
                    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    TOURNAMENT
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-bold">{t.name}</span>
                      <span className="block text-sm text-gray-300">
                        {t.games}경기 · 클립 {t.clips}개 · 최근 {fmtDate(t.latest)}
                      </span>
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-transform duration-200 motion-safe:group-hover:scale-110">
                      <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="ml-0.5 h-5 w-5">
                        <path d="M6 4.5v11l9-5.5-9-5.5z" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <HighlightPlayerPicker players={players} />
    </div>
  );
}
