import { PlayerStatsTable, type PlayerStatsRow } from "@/components/PlayerStatsTable";
import { TournamentFilter } from "@/components/TournamentFilter";
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

/** 부문별 TOP 3 (경기당 평균) */
const CATEGORIES: { key: string; label: string; unit: string; value: (r: PlayerStatsRow) => number }[] = [
  { key: "pts", label: "득점", unit: "PPG", value: (r) => r.pts / r.gp },
  { key: "reb", label: "리바운드", unit: "RPG", value: (r) => r.reb / r.gp },
  { key: "ast", label: "어시스트", unit: "APG", value: (r) => r.totals.ast / r.gp },
  { key: "stl", label: "스틸", unit: "SPG", value: (r) => r.totals.stl / r.gp },
];

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
  const margin = avg.ptsAvg - avg.oppAvg;
  const winRate = record.total ? record.wins / record.total : 0;
  const tournamentName = season.tournaments.find((x) => x.id === tournamentId)?.name;

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 p-5 sm:p-7">
        <span aria-hidden className="pointer-events-none absolute -right-3 -bottom-12 font-display text-[10rem] leading-none text-white/[0.04] select-none sm:text-[13rem]">
          STATS
        </span>
        <p className="text-xs font-bold tracking-[0.2em] text-blue-300">{tournamentName ?? "ALL GAMES"}</p>
        <h1 className="mt-1 font-display text-5xl leading-none tracking-wide sm:text-6xl">STATS</h1>
        {record.total > 0 && (
          <dl className="relative mt-5 flex flex-wrap gap-x-8 gap-y-3">
            <Big label="전적" value={`${record.wins}-${record.losses}`} sub={`${record.total}경기`} />
            <Big label="승률" value={fmtPct(winRate)} />
            {record.streak && (
              <Big label="흐름" value={`${record.streak.count}${record.streak.type === "W" ? "연승" : "연패"}`} />
            )}
          </dl>
        )}
      </section>

      <TournamentFilter basePath="/stats" tournaments={season.tournaments} active={tournamentId} />

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">아직 종료된 경기 기록이 없어요.</p>
      ) : (
        <>
          {/* 팀 요약 */}
          <section aria-label="팀 평균" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Tile label="평균 득점" value={avg.ptsAvg.toFixed(1)} />
            <Tile label="평균 실점" value={avg.oppAvg.toFixed(1)} />
            <Tile
              label="득실 마진"
              value={`${margin >= 0 ? "+" : "−"}${Math.abs(margin).toFixed(1)}`}
              tone={margin > 0 ? "good" : margin < 0 ? "bad" : undefined}
            />
            <Tile label="야투율" value={fmtPct(avg.fgPct)} />
            <Tile label="3점 성공률" value={fmtPct(avg.fg3Pct)} className="col-span-2 sm:col-span-1" />
          </section>

          {/* 부문별 TOP 3 */}
          <Section title="부문별 TOP 3" note="경기당 평균">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => {
                const top = rows.filter((r) => c.value(r) > 0).sort((a, b) => c.value(b) - c.value(a)).slice(0, 3);
                const max = Math.max(...top.map(c.value), 0.0001);
                return (
                  <div key={c.key} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-sm font-bold">
                      {c.label} <span className="text-xs font-medium text-gray-500">{c.unit}</span>
                    </p>
                    {top.length === 0 && <p className="mt-3 text-sm text-gray-500">기록 없음</p>}
                    <ol className="mt-3 space-y-2.5">
                      {top.map((r, i) => (
                        <li key={r.player.id}>
                          <div className="flex items-baseline gap-2 text-sm">
                            <span className={`w-4 font-display text-lg leading-none ${i === 0 ? "text-blue-300" : "text-gray-500"}`}>{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate">
                              <span className="text-gray-500">#{r.player.number}</span> {r.player.name}
                            </span>
                            <span className={`font-display text-xl leading-none tabular-nums ${i === 0 ? "text-white" : "text-gray-300"}`}>
                              {c.value(r).toFixed(1)}
                            </span>
                          </div>
                          <span aria-hidden className="mt-1 ml-6 block h-1.5 overflow-hidden rounded-full bg-gray-800">
                            <span
                              className={`block h-full rounded-full ${i === 0 ? "bg-blue-500" : "bg-gray-600"}`}
                              style={{ width: `${(c.value(r) / max) * 100}%` }}
                            />
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 선수 스탯 */}
          <Section title="선수 스탯">
            <PlayerStatsTable rows={rows} team={team} />
          </Section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* 쿼터별 득점 */}
            <Section title="쿼터별 평균 득점" note={quarters.games ? `${quarters.games}경기 기준 · 우리 팀` : undefined}>
              {quarters.games === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">쿼터가 기록된 경기가 없어요.</p>
              ) : (
                <QuarterChart quarters={quarters.quarters} />
              )}
            </Section>

            {/* 상대별 전적 */}
            <Section title="상대별 전적">
              <ul className="space-y-2">
                {opponents.map((o) => {
                  const diff = o.ptsAvg - o.oppAvg;
                  return (
                    <li key={o.opponent} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">vs {o.opponent}</p>
                        <p className="text-xs text-gray-500">
                          {o.games}경기 · <span className="text-blue-300">{o.wins}승</span> {o.games - o.wins}패
                        </p>
                      </div>
                      <p className="text-right">
                        <span className="font-display text-2xl leading-none tabular-nums">
                          {o.ptsAvg.toFixed(1)}
                          <span className="mx-1 text-gray-600">:</span>
                          <span className="text-gray-400">{o.oppAvg.toFixed(1)}</span>
                        </span>
                        <span className={`block text-xs font-bold ${diff > 0 ? "text-blue-300" : diff < 0 ? "text-red-300" : "text-gray-400"}`}>
                          평균 {diff >= 0 ? "+" : "−"}
                          {Math.abs(diff).toFixed(1)}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-display text-4xl leading-none tabular-nums">{value}</span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </dd>
    </div>
  );
}

function Tile({ label, value, tone, className }: { label: string; value: string; tone?: "good" | "bad"; className?: string }) {
  const color = tone === "good" ? "text-blue-300" : tone === "bad" ? "text-red-300" : "text-white";
  return (
    <div className={`rounded-2xl border border-gray-800 bg-gray-900 p-4 ${className ?? ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1.5 font-display text-4xl leading-none tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function QuarterChart({ quarters }: { quarters: { quarter: number; avg: number }[] }) {
  const max = Math.max(...quarters.map((q) => q.avg), 0.0001);
  const best = quarters.reduce((a, b) => (b.avg > a.avg ? b : a));
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <ul className="flex h-44 items-end gap-3" aria-label="쿼터별 평균 득점">
        {quarters.map((q) => {
          const top = q.quarter === best.quarter;
          return (
            <li key={q.quarter} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className={`font-display text-2xl leading-none tabular-nums ${top ? "text-white" : "text-gray-300"}`}>{q.avg.toFixed(1)}</span>
              {/* 막대 영역: 숫자·라벨을 뺀 나머지 높이 기준으로 비율 계산 */}
              <span aria-hidden className="flex w-full flex-1 items-end justify-center">
                <span
                  className={`block w-full max-w-14 rounded-t-lg ${top ? "bg-blue-500" : "bg-gray-700"}`}
                  style={{ height: `${(q.avg / max) * 100}%`, minHeight: "0.25rem" }}
                />
              </span>
              <span className="text-xs font-bold text-gray-400">{quarterLabel(q.quarter)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-gray-500">
        가장 강한 쿼터: <span className="font-bold text-blue-300">{quarterLabel(best.quarter)}</span>
      </p>
    </div>
  );
}
