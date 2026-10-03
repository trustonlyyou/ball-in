import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteGameButton } from "@/components/admin/DeleteGameButton";
import { GameForm } from "@/components/admin/GameForm";
import { Recorder } from "@/components/admin/Recorder";
import { isAdmin } from "@/lib/admin";
import { getGameEvents, getSeason } from "@/lib/data";
import { deleteGame, updateGame } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "경기 기록", robots: { index: false } };

export default async function RecordPage(props: PageProps<"/admin/games/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await props.params;
  const season = await getSeason();
  const game = season.games.find((g) => g.id === id);
  if (!game) notFound();
  const events = await getGameEvents(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-gray-400 hover:text-gray-200">
          ← 기록 관리
        </Link>
        <Link href={`/games/${id}`} className="inline-flex min-h-11 items-center text-sm text-blue-300 hover:text-blue-200">
          공개 페이지 보기 →
        </Link>
      </div>

      <Recorder game={game} players={season.players} initialEvents={events} />

      <details className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <summary className="cursor-pointer text-lg font-bold">경기 정보 수정 / 경기 종료</summary>
        <div className="mt-4">
          <GameForm action={updateGame.bind(null, id)} tournaments={season.tournaments} game={game} submitLabel="저장" />
        </div>
        <div className="mt-6 border-t border-gray-800 pt-4">
          <DeleteGameButton action={deleteGame.bind(null, id)} />
        </div>
      </details>
    </div>
  );
}
