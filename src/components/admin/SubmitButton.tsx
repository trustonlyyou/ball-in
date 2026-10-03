"use client";

import { useFormStatus } from "react-dom";

/** 저장 중에는 비활성화해서 중복 제출을 막는 버튼 */
export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className ?? ""} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? "저장 중…" : children}
    </button>
  );
}
