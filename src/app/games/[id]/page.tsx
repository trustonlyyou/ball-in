import Link from "next/link";
import { notFound } from "next/navigation";
import { BoxScoreTable, type BoxScoreRow } from "@/components/BoxScoreTable";
import { TEAM_NAME } from "@/config";
import { getSeason } from "@/lib/data";
import { fmtLongDate } from "@/lib/format";
import { gameResult, points, rebounds } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function GamePage(props: PageProps<"/games/[id]">) {
  const { id } = await props.params;
  const season = await getSeason();
  const game = season.games.find((g) => g.id === id);
  if (!game) notFound();

  const g = gameResult(season, game);
  const rows: BoxScoreRow[] = (season.boxScores[g.id] ?? []).flatMap((l) => {
    const player = season.players.find((p) => p.id === l.playerId);
    return player ? [{ ...l, player, pts: points(l), reb: rebounds(l) }] : [];
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/games?t=${g.tournamentId}`}
        className="inline-flex min-h-11 items-center gap-1 text-sm text-gray-400 hover:text-gray-200"
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        경기 목록
      </Link>

      {/* 점수판 */}
      <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 p-5 sm:p-7">
        <p className="text-center text-xs text-gray-400">
          {g.tournamentName}
          {g.round && ` · ${g.round}`}
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">{fmtLongDate(g.date)}</p>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamScore name={TEAM_NAME} score={g.ourScore} highlight={g.isComplete && g.won} />
          <span className="font-display text-2xl text-gray-600">VS</span>
          <TeamScore name={g.opponent} score={g.opponentScore} highlight={g.isComplete && !g.won} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {g.isComplete ? (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${g.won ? "bg-blue-500/20 text-blue-300" : "bg-red-500/15 text-red-300"}`}>
              {g.won ? `${g.margin}점 차 승리` : `${-g.margin}점 차 패배`}
            </span>
          ) : (
            <span className="rounded-full bg-gray-800 px-3 py-1 text-sm font-bold text-gray-300">경기 예정</span>
          )}
          {g.youtubeUrl && (
            <a
              href={g.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-red-600/20 px-4 text-sm font-bold text-red-300 hover:bg-red-600/30"
            >
              <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6 4.5v11l9-5.5-9-5.5z" />
              </svg>
              경기 영상
            </a>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">박스스코어</h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">
            기록된 데이터가 없습니다
          </p>
        ) : (
          <BoxScoreTable rows={rows} />
        )}
      </section>
    </div>
  );
}

function TeamScore({ name, score, highlight }: { name: string; score: number; highlight: boolean }) {
  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-sm font-bold text-gray-300">{name}</p>
      <p className={`font-display text-6xl leading-none tabular-nums sm:text-7xl ${highlight ? "text-white" : "text-gray-500"}`}>
        {score}
      </p>
    </div>
  );
}
