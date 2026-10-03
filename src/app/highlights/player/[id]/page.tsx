import { notFound } from "next/navigation";
import { HighlightBackLink } from "@/components/HighlightBackLink";
import { HighlightPlayer } from "@/components/HighlightPlayer";
import { getSeason } from "@/lib/data";
import { buildClips, CLIP_KINDS, searchParam } from "@/lib/highlights";

export const dynamic = "force-dynamic";

export default async function PlayerHighlightsPage(props: PageProps<"/highlights/player/[id]">) {
  const [{ id }, sp, season] = await Promise.all([props.params, props.searchParams, getSeason()]);
  const player = season.players.find((p) => p.id === id);
  if (!player) notFound();

  const clips = buildClips(season).filter((c) => c.playerId === id);
  const counts = CLIP_KINDS.map((k) => ({ ...k, n: clips.filter((c) => c.kind === k.key).length })).filter((k) => k.n);

  return (
    <div className="space-y-6">
      <HighlightBackLink />

      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-950 via-gray-900 to-black p-5 sm:p-6">
        <span aria-hidden className="pointer-events-none absolute -top-6 right-2 font-display text-[9rem] leading-none text-white/[0.05] select-none">
          {player.number}
        </span>
        <p className="text-xs font-bold tracking-[0.2em] text-blue-300">PLAYER HIGHLIGHTS</p>
        <h1 className="relative mt-1 flex items-baseline gap-3">
          <span className="font-display text-5xl leading-none text-gray-400">#{player.number}</span>
          <span className="text-3xl font-black">{player.name}</span>
        </h1>
        <p className="relative mt-3 text-sm text-gray-300">
          클립 <span className="font-bold text-white tabular-nums">{clips.length}</span>
          {counts.map((k) => (
            <span key={k.key} className="text-gray-400">
              {" · "}
              {k.label} <span className="tabular-nums text-gray-200">{k.n}</span>
            </span>
          ))}
        </p>
      </section>

      {clips.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-sm text-gray-500">아직 이 선수의 하이라이트가 없어요.</p>
      ) : (
        <HighlightPlayer
          clips={clips}
          players={[]}
          showPlayerFilter={false}
          initial={{ kind: searchParam(sp.k), clip: Number(searchParam(sp.c)) || 0 }}
        />
      )}
    </div>
  );
}
