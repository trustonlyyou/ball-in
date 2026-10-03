import { TEAM_NAME } from "@/config";
import { getSeason } from "@/lib/data";
import {
  completedGames,
  leaders,
  seasonRecord,
  teamAverages,
  teamRecords,
  upcomingGames,
  type GameResult,
  type Leader,
} from "@/lib/stats";

const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(m)}.${Number(day)}`;
};
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

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

  return (
    <div className="space-y-8">
      {/* 시즌 요약 */}
      <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950/60 to-gray-900 p-5 sm:p-6">
        <p className="text-sm text-blue-300">2026 시즌</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide sm:text-5xl">{TEAM_NAME}</h1>
        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="text-xs text-gray-400">시즌 전적</p>
            <p className="text-3xl font-black tabular-nums">
              {record.wins}
              <span className="text-lg font-bold text-gray-400">승 </span>
              {record.losses}
              <span className="text-lg font-bold text-gray-400">패</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">승률</p>
            <p className="text-3xl font-black tabular-nums">{fmtPct(winRate)}</p>
          </div>
          {record.streak && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                record.streak.type === "W" ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {record.streak.count}
              {record.streak.type === "W" ? "연승" : "연패"} 중
            </span>
          )}
        </div>
        {next && (
          <p className="mt-5 border-t border-gray-800 pt-4 text-sm text-gray-300">
            <span className="mr-2 font-bold text-blue-300">다음 경기</span>
            {fmtDate(next.date)} vs {next.opponent}
            {next.round && <span className="text-gray-500"> · {next.round}</span>}
          </p>
        )}
      </section>

      {/* 최근 경기 */}
      <Section title="최근 경기">
        {results.length === 0 ? (
          <Empty>아직 경기 기록이 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {results.slice(0, 5).map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </ul>
        )}
      </Section>

      {/* 아래 통계는 완료된 경기가 있을 때만 */}
      {results.length > 0 && (
        <>
          {/* 부문별 리더 */}
          <Section title="부문별 리더">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <LeaderCard label="득점" unit="PPG" leader={top.ppg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="리바운드" unit="RPG" leader={top.rpg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="어시스트" unit="APG" leader={top.apg} format={(v) => v.toFixed(1)} />
              <LeaderCard label="3점 성공률" unit="3P%" leader={top.fg3Pct} format={fmtPct} />
              <LeaderCard label="슈팅 효율" unit="TS%" leader={top.tsPct} format={fmtPct} />
            </div>
          </Section>

          {/* 팀 평균 */}
          <Section title="팀 평균">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatTile label="평균 득점" value={avg.ptsAvg.toFixed(1)} />
              <StatTile label="평균 실점" value={avg.oppAvg.toFixed(1)} />
              <StatTile label="야투율" value={fmtPct(avg.fgPct)} />
              <StatTile label="3점 성공률" value={fmtPct(avg.fg3Pct)} />
              <StatTile label="자유투 성공률" value={fmtPct(avg.ftPct)} />
            </div>
          </Section>

          {/* 팀 기록 */}
          <Section title="팀 기록">
            <ul className="grid gap-3 sm:grid-cols-2">
              {records.map((r) => (
                <li key={r.label} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-400">{r.label}</p>
                    <p className="truncate text-xs text-gray-500">
                      {fmtDate(r.game.date)} vs {r.game.opponent} ({r.game.ourScore}-{r.game.opponentScore})
                    </p>
                  </div>
                  <p className="text-2xl font-black tabular-nums">{r.value}</p>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-sm text-gray-500">{children}</p>;
}

function GameRow({ game: g }: { game: GameResult }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
          g.won ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
        }`}
      >
        {g.won ? "승" : "패"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">vs {g.opponent}</p>
        <p className="truncate text-xs text-gray-500">
          {fmtDate(g.date)} · {g.tournamentName}
          {g.round && ` · ${g.round}`}
        </p>
      </div>
      <p className="shrink-0 text-lg font-bold tabular-nums">
        <span className={g.won ? "text-blue-300" : ""}>{g.ourScore}</span>
        <span className="text-gray-600"> - </span>
        <span className={g.won ? "" : "text-red-300"}>{g.opponentScore}</span>
      </p>
      {g.youtubeUrl && (
        <a
          href={g.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="경기 영상 보기"
          className="shrink-0 rounded-md bg-red-600/20 px-2 py-1 text-xs font-bold text-red-300 hover:bg-red-600/30"
        >
          ▶ 영상
        </a>
      )}
    </li>
  );
}

function LeaderCard({
  label,
  unit,
  leader,
  format,
}: {
  label: string;
  unit: string;
  leader: Leader | null;
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-400">
        {label} <span className="text-gray-600">{unit}</span>
      </p>
      {leader ? (
        <>
          <p className="mt-2 text-2xl font-black tabular-nums text-blue-300">{format(leader.value)}</p>
          <p className="mt-1 truncate text-sm">
            <span className="text-gray-500">#{leader.player.number}</span> {leader.player.name}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-gray-600">기록 없음</p>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}
