"use client";

import { useEffect, useRef, useState } from "react";

/** 사용하는 YouTube IFrame Player API 메서드만 선언 */
export type YTPlayer = {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  destroy(): void;
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

/**
 * el 을 div 에 붙이면 그 자리에 유튜브 플레이어를 만든다.
 * videoId 가 바뀌면 플레이어를 다시 만든다 (같은 플레이어로 영상만 바꾸려면 loadVideoById 사용).
 */
export function useYouTube(videoId: string | null, startSeconds?: number) {
  const el = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!videoId || !el.current) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !el.current || !window.YT) return;
      player.current = new window.YT.Player(el.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1, ...(startSeconds ? { start: Math.floor(startSeconds) } : {}) },
        events: { onReady: () => !cancelled && setReady(true) },
      });
    });
    return () => {
      cancelled = true;
      setReady(false);
      player.current?.destroy();
      player.current = null;
    };
    // startSeconds 는 처음 만들 때만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return { el, player, ready };
}
