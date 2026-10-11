import { renderAppIcon } from "@/lib/appIcon";

// manifest 용 아이콘: /icons/192.png, /icons/512.png
const SIZES: Record<string, number> = { "192.png": 192, "512.png": 512 };

export function generateStaticParams() {
  return Object.keys(SIZES).map((name) => ({ name }));
}

export const dynamicParams = false;

export async function GET(_req: Request, ctx: RouteContext<"/icons/[name]">) {
  const { name } = await ctx.params;
  return renderAppIcon(SIZES[name]);
}
