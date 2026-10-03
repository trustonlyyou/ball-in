import { TournamentFilter } from "@/components/TournamentFilter";
import { PlayerStatsTable, type PlayerStatsRow } from "@/components/PlayerStatsTable";
import { getSeason } from "@/lib/data";
import { quarterLabel } from "@/lib/events";
import { fmtPct } from "@/lib/format";
import {
  completedGames,
  opponentSplits,
  playerSeasonStats,
  points,
  quarterScoring,
  rebounds,
  seasonRecord,
  teamAverages,
} from "@/lib/stats";
import type { BoxScoreLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StatsPage(props: PageProps<"/stats">) {
  const { t } = await props.searchParams;
  const season = await getSeason();
  const tournamentId = typeof t === "string" && season.tournaments.some((x) => x.id === t) ? t : null;

  const results = completedGames(season).filter((g) => !tournamentId || g.tournamentId === tournamentId);
  const record = seasonRecord(results);
  const rows = playerSeasonStats(season, results);
  const avg = teamAverages(season, results);
  const quarters = quarterScoring(season, results);
  const opponents = opponentSplits(results);

  // 팀 줄: 모든 선수 합계, 출전 경기 = 팀 경기 수 (평균 = 경기당 팀 기록)
  const teamTotals = rows.reduce<BoxScoreLine>(
    (acc, r) => {
      for (const k of ["fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "ast", "stl", "blk", "tov", "pf"] as const) acc[k] += r.totals[k];
      return acc;
    },
    { playerId: "team", fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 },
  );
  const team: PlayerStatsRow = {
    player: { id: "team", name: "팀", number: "", positions: [], isElite: false },
    gp: results.length,
    totals: teamTotals,
    pts: points(teamTotals),
    reb: rebounds(teamTotals),
  };
  const maxQuarter = Math.max(1, ...quarters.quarters.map((q) => q.avg));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-5xl leading-none tracking-wide">STATS</h1>
        {record.total > 0 && (
          <p className="text-sm text-gray-400">
            <span className="font-bold text-blue-300 tabular-nums">{record.wins}승</span>{" "}
            <span className="font-bold text-gray-300 tabular-nums">{record.losses}패</span>
            <span className="text-gray-600"> · </span>
            {record.total}경기
          </p>
        )}
      </div>

      <TournamentFilter basePath="/stats" tournaments={season.tournaments} active={tournamentId} />

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">
          아직 종료된 경기 기록이 없어요.
        </p>
      ) : (
        <>
          {/* 팀 요약 */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Tile label="평균 득점" value={avg.ptsAvg.toFixed(1)} />
            <Tile label="평균 실점" value={avg.oppAvg.toFixed(1)} />
            <Tile label="득실 마진" value={`${avg.ptsAvg >= avg.oppAvg ? "+" : ""}${(avg.ptsAvg - avg.oppAvg).toFixed(1)}`} />
            <Tile label="야투율" value={fmtPct(avg.fgPct)} />
            <Tile label="3점 성공률" value={fmtPct(avg.fg3Pct)} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">선수 스탯</h2>
            <PlayerStatsTable rows={rows} team={team} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 쿼터별 득점 */}
            <section>
              <h2 className="mb-3 text-lg font-bold">쿼터별 평균 득점</h2>
              {quarters.games === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">쿼터가 기록된 경기가 없어요.</p>
              ) : (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <ul className="space-y-3">
                    {quarters.quarters.map((q) => (
                      <li key={q.quarter} className="grid grid-cols-[2.5rem_1fr_3rem] items-center gap-3">
                        <span className="text-sm font-bold text-gray-400">{quarterLabel(q.quarter)}</span>
                        <span className="h-3 overflow-hidden rounded-full bg-gray-800">
                          <span className="block h-full rounded-full bg-blue-500" style={{ width: `${(q.avg / maxQuarter) * 100}%` }} />
                        </span>
                        <span className="text-right font-display text-2xl leading-none tabular-nums">{q.avg.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">쿼터가 기록된 {quarters.games}경기 기준 · 우리 팀 득점만</p>
                </div>
              )}
            </section>

            {/* 상대별 전적 */}
            <section>
              <h2 className="mb-3 text-lg font-bold">상대별 전적</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full min-w-max text-sm tabular-nums">
                  <thead className="bg-gray-900 text-xs text-gray-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium">상대</th>
                      <th scope="col" className="px-3 py-2 font-medium">경기</th>
                      <th scope="col" className="px-3 py-2 font-medium">승-패</th>
                      <th scope="col" className="px-3 py-2 font-medium">평균 득점</th>
                      <th scope="col" className="px-3 py-2 font-medium">평균 실점</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {opponents.map((o) => (
                      <tr key={o.opponent}>
                        <th scope="row" className="px-3 py-2.5 text-left font-medium">{o.opponent}</th>
                        <td className="px-3 py-2.5 text-center">{o.games}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-blue-300">{o.wins}</span>-<span>{o.games - o.wins}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">{o.ptsAvg.toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center">{o.oppAvg.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}


function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none tabular-nums">{value}</p>
    </div>
  );
}
