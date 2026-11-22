import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { isAdmin } from "@/lib/admin";
import { getSeason } from "@/lib/data";
import { deletePlayer, savePlayer } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "선수 수정", robots: { index: false } };

export default async function AdminPlayerPage(props: PageProps<"/admin/players/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await props.params;
  const season = await getSeason();
  const player = season.players.find((p) => p.id === id);
  if (!player) notFound();
  // 득점·어시스트 등 기록이 하나라도 있으면 삭제 대신 비활성화만 가능
  const records = season.events.filter((e) => e.playerId === id || e.assistPlayerId === id).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/players" className="inline-flex min-h-11 items-center text-sm text-gray-400 hover:text-gray-200">
          ← 선수 관리
        </Link>
        <h1 className="text-2xl font-bold">
          <span className="font-display text-3xl text-gray-400">#{player.number}</span> {player.name}
        </h1>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <PlayerForm action={savePlayer.bind(null, id)} player={player} submitLabel="저장" />
      </section>

      <section className="rounded-2xl border border-gray-800 p-5">
        <h2 className="font-bold">선수 삭제</h2>
        {records > 0 ? (
          <p className="mt-1 text-sm text-gray-400">
            이 선수는 기록이 {records}건 있어서 삭제할 수 없어요. 삭제하면 지난 경기 점수가 바뀌기 때문이에요. 팀을 떠난 선수는 위에서 &lsquo;활동 중&rsquo; 체크를 해제해주세요.
          </p>
        ) : (
          <>
            <p className="mt-1 mb-2 text-sm text-gray-400">기록이 없는 선수라서 삭제할 수 있어요.</p>
            <ConfirmDeleteButton action={deletePlayer.bind(null, id)} confirmMessage={`${player.name} 선수를 삭제할까요? 되돌릴 수 없어요.`}>
              이 선수 삭제
            </ConfirmDeleteButton>
          </>
        )}
      </section>
    </div>
  );
}
