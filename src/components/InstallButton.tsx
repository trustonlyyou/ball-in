"use client";

import { useEffect, useState } from "react";
import { TEAM_NAME } from "@/config";

type BeforeInstallPromptEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Mode = "hidden" | "prompt" | "ios";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS 는 데스크톱 Safari 로 위장하므로 터치 지원으로 구분
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * 홈 화면에 앱 설치.
 * - 안드로이드/크롬: 브라우저 설치 창을 바로 띄움 (beforeinstallprompt)
 * - 아이폰: 설치 API 가 없어 "공유 → 홈 화면에 추가" 안내를 보여줌
 * - 이미 앱으로 실행 중이거나 설치를 지원하지 않는 브라우저: 숨김
 */
export function InstallButton() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    // 브라우저 환경 감지는 마운트 후에만 가능
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIOS()) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 배너 대신 우리 버튼으로
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => {
      setDeferred(null);
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  const onClick = async () => {
    if (mode === "ios") return setGuideOpen(true);
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // 프롬프트는 한 번만 쓸 수 있음
    setDeferred(null);
    if (outcome === "accepted") setMode("hidden");
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="ml-auto inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-blue-500/15 px-3 text-sm font-bold text-blue-300 transition-colors hover:bg-blue-500/25 focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        앱 설치
      </button>
      {guideOpen && <IOSGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}

function IOSGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <h2 id="ios-install-title" className="text-lg font-bold">
          홈 화면에 {TEAM_NAME} 추가
        </h2>
        <p className="mt-1 text-sm text-gray-400">아이폰은 아래 순서로 설치할 수 있어요.</p>
        <ol className="mt-4 space-y-3 text-sm">
          <Step n={1}>
            Safari 아래쪽(또는 위쪽)의 <b>공유 버튼</b>
            <ShareIcon />을 누르세요.
          </Step>
          <Step n={2}>
            목록을 내려 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 누르세요.
          </Step>
          <Step n={3}>
            오른쪽 위 <b>&lsquo;추가&rsquo;</b>를 누르면 끝!
          </Step>
        </ol>
        <p className="mt-4 text-xs text-gray-500">카카오톡 등 앱 안에서 열었다면, 먼저 Safari로 열어주세요.</p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-5 min-h-11 w-full cursor-pointer rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-400"
        >
          확인
        </button>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{n}</span>
      <span className="pt-0.5 leading-relaxed text-gray-200">{children}</span>
    </li>
  );
}

function ShareIcon() {
  return (
    <svg aria-label="공유" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="mx-1 inline h-4 w-4 align-[-2px] text-blue-300">
      <path d="M10 2.5v10M10 2.5L7 5.5M10 2.5l3 3M6 8.5H5a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1v-7a1 1 0 00-1-1h-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
