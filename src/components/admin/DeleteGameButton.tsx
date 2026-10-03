"use client";

import { SubmitButton } from "./SubmitButton";

/** 경기 삭제 (확인 후 제출) */
export function DeleteGameButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("이 경기와 모든 기록을 삭제할까요? 되돌릴 수 없어요.")) e.preventDefault();
      }}
    >
      <SubmitButton className="min-h-11 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">
        이 경기와 모든 기록 삭제
      </SubmitButton>
    </form>
  );
}
