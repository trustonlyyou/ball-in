"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { login } from "@/app/admin/actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

/** 아이폰 잠금화면 스타일 PIN 입력. 자릿수를 다 채우면 자동 제출. */
export function PinForm({ length }: { length: number }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [, startTransition] = useTransition();
  const [digits, setDigits] = useState("");

  const press = (key: string) => {
    if (pending) return;
    if (key === "del") return setDigits((d) => d.slice(0, -1));
    if (!/^\d$/.test(key) || digits.length >= length) return;
    const next = digits + key;
    setDigits(next);
    if (next.length === length) {
      const fd = new FormData();
      fd.set("pin", next);
      startTransition(() => action(fd));
      setDigits(""); // 실패 시 바로 다시 입력할 수 있게 비움 (성공하면 페이지가 바뀜)
    }
  };

  // PC 키보드 입력
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filled = pending ? length : digits.length;

  return (
    <div className="mx-auto flex max-w-xs flex-col items-center py-6">
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-gray-400">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
      </svg>
      <h1 className="mt-3 text-lg font-bold">PIN 입력</h1>
      <p className="mt-1 h-5 text-sm text-gray-400" role="status" aria-live="polite">
        {pending ? "확인 중…" : (state?.error ?? "기록 관리 PIN을 입력하세요")}
      </p>

      {/* 입력 표시 점. 틀리면 key 가 바뀌며 흔들림 애니메이션 재생 */}
      <div
        key={state?.at}
        aria-label={`${length}자리 중 ${filled}자리 입력됨`}
        className={`mt-6 flex gap-5 ${state?.error ? "motion-safe:animate-[shake_0.4s_ease-in-out]" : ""}`}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 transition-colors duration-150 ${
              i < filled ? "border-white bg-white" : state?.error && filled === 0 ? "border-red-400" : "border-gray-400"
            }`}
          />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : k === "del" ? (
            <button
              key={i}
              type="button"
              onClick={() => press("del")}
              disabled={digits.length === 0}
              aria-label="한 자리 지우기"
              className="flex h-[4.5rem] w-[4.5rem] cursor-pointer items-center justify-center rounded-full text-gray-300 transition-opacity active:opacity-50 disabled:invisible"
            >
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7z" strokeLinejoin="round" />
                <path d="M12 9.5l5 5M17 9.5l-5 5" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              disabled={pending}
              className="flex h-[4.5rem] w-[4.5rem] cursor-pointer items-center justify-center rounded-full bg-gray-800/80 text-3xl font-light transition-colors duration-100 select-none hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400 active:bg-gray-500"
            >
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
