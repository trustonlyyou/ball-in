"use client";

import { SubmitButton } from "./SubmitButton";

/** 되돌릴 수 없는 삭제: 확인 창을 거친 뒤 제출 */
export function ConfirmDeleteButton({ action, confirmMessage, children }: { action: () => Promise<void>; confirmMessage: string; children: React.ReactNode }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <SubmitButton className="min-h-11 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">{children}</SubmitButton>
    </form>
  );
}
