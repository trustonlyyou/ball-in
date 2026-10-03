import { RosterList, type RosterPlayer } from "@/components/RosterList";
import { getSeason } from "@/lib/data";
import { age, gamesPlayed } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function LockerPage() {
  const season = await getSeason();
  const gp = gamesPlayed(season);
  const players: RosterPlayer[] = season.players.map((p) => ({
    ...p,
    age: p.birthDate ? age(p.birthDate) : undefined,
    gamesPlayed: gp[p.id] ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">라커룸</h1>
        <p className="mt-1 text-sm text-gray-400">잡솨 선수 명단</p>
      </div>
      <RosterList players={players} />
    </div>
  );
}
