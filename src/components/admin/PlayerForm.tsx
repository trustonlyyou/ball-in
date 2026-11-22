"use client";

import { useActionState } from "react";
import type { PlayerFormState } from "@/app/admin/actions";
import { POSITIONS, type Player } from "@/lib/types";

const input =
  "block min-h-11 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 text-base outline-none focus:border-blue-400";

/** 선수 추가/수정 폼. player 가 없으면 추가. */
export function PlayerForm({
  action,
  player,
  submitLabel,
}: {
  action: (prev: PlayerFormState, fd: FormData) => Promise<PlayerFormState>;
  player?: Player;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // 검증에 실패하면 방금 입력한 값을, 아니면 저장된 값을 보여준다
  const v = state?.values;
  const str = (key: string, saved: string | number | undefined) => (v ? String(v[key] ?? "") : saved === undefined ? "" : String(saved));
  const positions = v ? (v.positions as string[]) : (player?.positions ?? []);
  const checked = (key: string, saved: boolean) => (v ? v[key] === "on" : saved);

  return (
    // key: 검증 실패 후 다시 그릴 때 체크박스도 입력값으로 맞춘다
    <form action={formAction} key={state ? JSON.stringify(state.values) : "saved"} className="grid gap-4 sm:grid-cols-2">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300 sm:col-span-2">
          {state.error}
        </p>
      )}

      <Field label="이름 *" htmlFor="name">
        <input id="name" name="name" required maxLength={20} defaultValue={str("name", player?.name)} className={input} />
      </Field>
      <Field label="등번호 *" htmlFor="number">
        <input id="number" name="number" required inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} defaultValue={str("number", player?.number)} className={input} />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-gray-300">포지션 (여러 개 선택 가능)</legend>
        <div className="flex gap-2">
          {POSITIONS.map((pos) => (
            <label
              key={pos}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 text-sm font-bold has-checked:border-blue-400 has-checked:bg-blue-500/15 has-checked:text-blue-300"
            >
              <input type="checkbox" name="positions" value={pos} defaultChecked={positions.includes(pos)} className="h-4 w-4 accent-blue-500" />
              {pos}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="키 (cm)" htmlFor="heightCm">
        <input id="heightCm" name="heightCm" type="number" min={100} max={250} inputMode="numeric" defaultValue={str("heightCm", player?.heightCm)} className={input} />
      </Field>

      <Field label="생년월일" htmlFor="birthDate">
        <input id="birthDate" name="birthDate" type="date" defaultValue={str("birthDate", player?.birthDate)} className={input} />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-lg border border-gray-700 px-3">
        <input name="isElite" type="checkbox" defaultChecked={checked("isElite", player?.isElite ?? false)} className="h-5 w-5 accent-blue-500" />
        <span className="text-sm font-medium">선출 (선수 출신)</span>
      </label>

      {player && (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-gray-700 px-3 py-2.5 sm:col-span-2">
          <input name="isActive" type="checkbox" defaultChecked={checked("isActive", player.isActive)} className="mt-0.5 h-5 w-5 accent-blue-500" />
          <span className="text-sm">
            <span className="font-medium">활동 중</span>
            <span className="block text-xs text-gray-500">해제하면 라커룸과 기록 화면에서 숨겨져요. 지난 경기 기록과 스탯은 그대로 남아요.</span>
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="min-h-11 cursor-pointer rounded-lg bg-blue-500 px-6 font-bold text-white transition-colors hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}
