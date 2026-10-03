import type { Game, Tournament } from "@/lib/types";

const input =
  "block min-h-11 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 text-base outline-none focus:border-blue-400";

/** 경기 생성/수정 공용 폼 (서버 컴포넌트). action 에 서버 액션을 넘긴다. */
export function GameForm({
  action,
  tournaments,
  game,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  tournaments: Tournament[];
  game?: Game;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="대회" htmlFor="tournamentId">
        <select id="tournamentId" name="tournamentId" defaultValue={game?.tournamentId ?? ""} className={input}>
          <option value="">(대회 없음 / 친선)</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="또는 새 대회 이름" htmlFor="newTournament" hint="입력하면 새 대회를 만들어 연결해요">
        <input id="newTournament" name="newTournament" placeholder="예: 2026 바다배 수도권리그" className={input} />
      </Field>
      <Field label="날짜 *" htmlFor="date">
        <input id="date" name="date" type="date" required defaultValue={game?.date} className={input} />
      </Field>
      <Field label="상대팀 *" htmlFor="opponent">
        <input id="opponent" name="opponent" required defaultValue={game?.opponent} className={input} />
      </Field>
      <Field label="라운드" htmlFor="round">
        <input id="round" name="round" placeholder="예: 조별예선, 8강" defaultValue={game?.round} className={input} />
      </Field>
      <Field label="장소" htmlFor="venue">
        <input id="venue" name="venue" defaultValue={game?.venue} className={input} />
      </Field>
      <Field label="유튜브 영상 주소" htmlFor="youtubeUrl" hint="있으면 기록할 때 영상 시간이 함께 저장돼요" wide>
        <input id="youtubeUrl" name="youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=..." defaultValue={game?.youtubeUrl} className={input} />
      </Field>

      {game && (
        <>
          <Field label="상대 점수" htmlFor="opponentScore">
            <input id="opponentScore" name="opponentScore" type="number" min={0} inputMode="numeric" defaultValue={game.opponentScore} className={input} />
          </Field>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-lg border border-gray-700 px-3">
            <input name="isComplete" type="checkbox" defaultChecked={game.isComplete} className="h-5 w-5 accent-blue-500" />
            <span className="text-sm font-medium">경기 종료 (결과·통계에 반영)</span>
          </label>
        </>
      )}

      <button
        type="submit"
        className="min-h-11 cursor-pointer rounded-lg bg-blue-500 px-6 font-bold text-white transition-colors hover:bg-blue-400 sm:col-span-2 sm:justify-self-start"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
