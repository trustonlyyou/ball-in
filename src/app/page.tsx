import Link from "next/link";
import { TEAM_NAME } from "@/config";
import { getSeason } from "@/lib/data";
import { fmtDate, fmtLongDate, fmtPct } from "@/lib/format";
import {
  completedGames,
  leaders,
  points,
  seasonRecord,
  teamAverages,
  teamRecords,
  upcomingGames,
  type GameResult,
  type Leader,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const season = await getSeason();
  const results = completedGames(season);
  const record = seasonRecord(results);
  const top = leaders(season, results);
  const avg = teamAverages(season, results);
  const records = teamRecords(season, results);
  const next = upcomingGames(season)[0];
  const winRate = record.total ? record.wins / record.total : 0;
  const form = results.slice(0, 5).reverse(); // 오래된 → 최근

  // 지난 경기 최다 득점자
  const latest = results[0];
  const latestTop = latest
    ? (season.boxScores[latest.id] ?? [])
        .map((l) => ({ player: season.players.find((p) => p.id === l.playerId), pts: points(l) }))
        .filter((x) => x.player)
        .sort((a, b) => b.pts - a.pts)[0]
    : undefined;

  return (
    <div className="space-y-10">
      {/* ── 히어로 ─────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 px-5 pt-7 pb-6 sm:px-8 sm:pt-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -bottom-16 font-display text-[11rem] leading-none whitespace-nowrap text-white/[0.04] select-none sm:text-[16rem]"
        >
          {TEAM_NAME}
        </span>

        <div className="relative">
          <p className="text-xs font-bold tracking-[0.25em] text-blue-300">2026 SEASON</p>
          <h1 className="mt-1 font-display text-6xl leading-[0.9] tracking-wide sm:text-8xl">{TEAM_NAME}</h1>

          {record.total > 0 ? (
            <>
              <dl className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <dt className="text-xs text-gray-400">시즌 전적</dt>
                  <dd className="font-display text-5xl leading-none tabular-nums">
                    {record.wins}
                    <span className="mx-0.5 text-2xl text-gray-400">승</span>
                    {record.losses}
                    <span className="ml-0.5 text-2xl text-gray-400">패</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">승률</dt>
                  <dd className="font-display text-5xl leading-none tabular-nums">{fmtPct(winRate)}</dd>
                </div>
                {record.streak && (
                  <div>
                    <dt className="sr-only">흐름</dt>
                    <dd
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        record.streak.type === "W" ? "bg-blue-500/20 text-blue-300" : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {record.streak.count}
                      {record.streak.type === "W" ? "연승" : "연패"} 중
                    </dd>
                  </div>
                )}
              </dl>

              {/* 최근 5경기 */}
              <div className="mt-5 flex items-center gap-2">
                <span className="text-xs text-gray-400">최근 {form.length}경기</span>
                <ol className="flex gap-1" aria-label="최근 경기 결과, 오래된 순">
                  {form.map((g) => (
                    <li
                      key={g.id}
                      title={`${fmtDate(g.date)} vs ${g.opponent} ${g.ourScore}-${g.opponentScore}`}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-black ${
                        g.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {g.won ? "승" : "패"}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-gray-400">아직 기록된 경기가 없어요. 첫 경기를 기다리는 중!</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/stats"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-500 px-6 font-bold text-white transition-colors duration-200 hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              시즌 스탯 보기
              <Arrow />
            </Link>
            <Link href="/locker" className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-gray-300 hover:text-white">
              선수 명단
            </Link>
          </div>
        </div>

        {next && (
          <div className="relative mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-4 text-sm">
            <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">NEXT</span>
            <span className="font-bold">vs {next.opponent}</span>
            <span className="text-gray-400">
              {fmtLongDate(next.date)}
              {next.round && ` · ${next.round}`}
            </span>
          </div>
        )}
      </section>

      {/* ── 지난 경기 ─────────────────────────── */}
      {latest && (
        <Section title="지난 경기" href={`/games/${latest.id}`} linkLabel="박스스코어">
          <Link
            href={`/games/${latest.id}`}
            className="group block rounded-2xl border border-gray-800 bg-gray-900 p-5 transition-colors duration-200 hover:border-gray-600 focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            <p className="text-center text-xs text-gray-500">
              {fmtLongDate(latest.date)} · {latest.tournamentName}
              {latest.round && ` · ${latest.round}`}
            </p>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <ScoreSide name={TEAM_NAME} score={latest.ourScore} win={latest.won} />
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${latest.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
              >
                {latest.won ? "WIN" : "LOSS"}
              </span>
              <ScoreSide name={latest.opponent} score={latest.opponentScore} win={!latest.won} />
            </div>
            {latestTop?.player && latestTop.pts > 0 && (
              <p className="mt-4 border-t border-gray-800 pt-3 text-center text-sm text-gray-400">
                최다 득점{" "}
                <span className="font-bold text-white">
                  #{latestTop.player.number} {latestTop.player.name}
                </span>{" "}
                <span className="font-display text-xl leading-none text-blue-300 tabular-nums">{latestTop.pts}</span>
                <span className="text-xs">점</span>
              </p>
            )}
          </Link>
        </Section>
      )}

      {/* ── 최근 경기 ─────────────────────────── */}
      {results.length > 1 && (
        <Section title="최근 경기" href="/games" linkLabel="전체 경기">
          <ul className="space-y-2">
            {results.slice(1, 5).map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </ul>
        </Section>
      )}

      {results.length > 0 && (
        <>
          {/* ── 부문별 리더 ─────────────────────── */}
          <Section title="부문별 리더" href="/stats" linkLabel="전체 스탯">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <LeaderCard label="득점" unit="PPG" leader={top.ppg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="리바운드" unit="RPG" leader={top.rpg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="어시스트" unit="APG" leader={top.apg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="3점 성공률" unit="3P%" leader={top.fg3Pct} format={fmtPct} />
              <LeaderCard label="슈팅 효율" unit="TS%" leader={top.tsPct} format={fmtPct} className="col-span-2 sm:col-span-1" />
            </div>
          </Section>

          {/* ── 팀 평균 ─────────────────────────── */}
          <Section title="팀 평균">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatTile label="평균 득점" value={avg.ptsAvg.toFixed(1)} />
              <StatTile label="평균 실점" value={avg.oppAvg.toFixed(1)} />
              <StatTile label="야투율" value={fmtPct(avg.fgPct)} />
              <StatTile label="3점 성공률" value={fmtPct(avg.fg3Pct)} />
              <StatTile label="자유투 성공률" value={fmtPct(avg.ftPct)} className="col-span-2 sm:col-span-1" />
            </div>
          </Section>

          {/* ── 팀 기록 ─────────────────────────── */}
          <Section title="팀 기록">
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {records.map((r) => (
                <li key={r.label}>
                  <Link
                    href={`/games/${r.game.id}`}
                    className="block h-full rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-colors duration-200 hover:border-gray-600 focus-visible:outline-2 focus-visible:outline-blue-400"
                  >
                    <p className="text-xs text-gray-400">{r.label}</p>
                    <p className="mt-1 font-display text-4xl leading-none tabular-nums">{r.value}</p>
                    <p className="mt-2 truncate text-xs text-gray-500">
                      {fmtDate(r.game.date)} vs {r.game.opponent}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm text-gray-400 transition-colors hover:text-blue-300">
            {linkLabel}
            <Arrow />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M7.5 4.5L13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreSide({ name, score, win }: { name: string; score: number; win: boolean }) {
  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-sm font-bold text-gray-300">{name}</p>
      <p className={`font-display text-6xl leading-none tabular-nums ${win ? "text-white" : "text-gray-500"}`}>{score}</p>
    </div>
  );
}

function GameRow({ game: g }: { game: GameResult }) {
  return (
    <li>
      <Link
        href={`/games/${g.id}`}
        className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 transition-colors duration-200 hover:border-gray-600 focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
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
      </Link>
    </li>
  );
}

function LeaderCard({
  label,
  unit,
  leader,
  format,
  className,
}: {
  label: string;
  unit: string;
  leader: Leader | null;
  format: (v: number) => string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-4 ${className ?? ""}`}>
      {leader && (
        <span aria-hidden className="pointer-events-none absolute -top-2 -right-1 font-display text-7xl leading-none text-white/[0.05] select-none">
          {leader.player.number}
        </span>
      )}
      <p className="relative text-xs text-gray-400">
        {label} <span className="text-gray-600">{unit}</span>
      </p>
      {leader ? (
        <>
          <p className="relative mt-2 font-display text-4xl leading-none text-blue-300 tabular-nums">{format(leader.value)}</p>
          <p className="relative mt-2 truncate text-sm font-medium">
            <span className="text-gray-500">#{leader.player.number}</span> {leader.player.name}
          </p>
        </>
      ) : (
        <p className="relative mt-2 text-sm text-gray-600">기록 없음</p>
      )}
    </div>
  );
}

function StatTile({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-800 bg-gray-900 p-4 ${className ?? ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1.5 font-display text-4xl leading-none tabular-nums">{value}</p>
    </div>
  );
}
