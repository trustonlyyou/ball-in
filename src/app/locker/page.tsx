import { RosterList, type RosterPlayer } from "@/components/RosterList";
import { TEAM_NAME } from "@/config";
import { getSeason } from "@/lib/data";
import { age, gamesPlayed } from "@/lib/stats";
import { POSITIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

const POSITION_BAR: Record<string, string> = { G: "bg-sky-400", F: "bg-emerald-400", C: "bg-violet-400" };

export default async function LockerPage() {
  const season = await getSeason();
  const gp = gamesPlayed(season);
  const players: RosterPlayer[] = season.players.map((p) => ({
    ...p,
    age: p.birthDate ? age(p.birthDate) : undefined,
    gamesPlayed: gp[p.id] ?? 0,
  }));

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const avgAge = avg(players.flatMap((p) => (p.age !== undefined ? [p.age] : [])));
  const avgHeight = avg(players.flatMap((p) => (p.heightCm ? [p.heightCm] : [])));
  const byPosition = POSITIONS.map((pos) => ({ pos, count: players.filter((p) => p.positions.includes(pos)).length }));
  const positionTotal = byPosition.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-gray-950 p-5 sm:p-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -bottom-10 font-display text-[9rem] leading-none text-white/[0.04] select-none sm:text-[12rem]"
        >
          {TEAM_NAME}
        </span>
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{TEAM_NAME} BASKETBALL</h1>

        <dl className="relative mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          <Summary label="선수" value={`${players.length}`} unit="명" />
          <Summary label="평균 나이" value={avgAge !== null ? avgAge.toFixed(1) : "-"} unit="세" />
          <Summary label="평균 키" value={avgHeight !== null ? avgHeight.toFixed(0) : "-"} unit="cm" />
        </dl>

        {positionTotal > 0 && (
          <div className="relative mt-5 sm:max-w-md">
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-800" role="img" aria-label={byPosition.map((b) => `${b.pos} ${b.count}명`).join(", ")}>
              {byPosition.map((b) => (
                <div key={b.pos} className={POSITION_BAR[b.pos]} style={{ width: `${(b.count / positionTotal) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-2 flex gap-4 text-xs text-gray-400">
              {byPosition.map((b) => (
                <li key={b.pos} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${POSITION_BAR[b.pos]}`} aria-hidden />
                  {b.pos} <span className="font-bold text-gray-200 tabular-nums">{b.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <RosterList players={players} />
    </div>
  );
}

function Summary({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5">
        <span className="font-display text-4xl leading-none tabular-nums">{value}</span>
        <span className="ml-0.5 text-xs text-gray-400">{unit}</span>
      </dd>
    </div>
  );
}
