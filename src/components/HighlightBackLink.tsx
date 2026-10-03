import Link from "next/link";

export function HighlightBackLink({ href = "/highlights", label = "하이라이트" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm text-gray-400 hover:text-gray-200">
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}
