import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { mimeFromExtension } from "@/lib/mime-from-extension";

// Next's built-in public/ static serving only reflects the directory as it
// was when the server process started (confirmed empirically: a file added
// to public/media/uploads/ while the server is already running 404s,
// while one present before `next start` launches serves fine) — a real
// problem for user uploads on a long-running production process, since
// public/ static serving takes priority over this route for anything it
// DOES have, so this only ever runs as the fallback for files uploaded
// after boot. No auth here — this mirrors public/ static serving, which
// this route is a fallback for; PUBLIC_SCOPES-only content lives here
// (see src/app/api/media/upload/route.ts), never anything private.
export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  const segments = params.path;
  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "مسیر نامعتبر است." }, { status: 400 });
  }

  const baseDir = path.join(process.cwd(), "public", "media", "uploads");
  const filePath = path.resolve(baseDir, ...segments);

  // Defense in depth on top of the segment blocklist above: resolve the
  // final path and confirm it's still actually inside baseDir before ever
  // touching the filesystem with it.
  if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
    return NextResponse.json({ error: "مسیر نامعتبر است." }, { status: 400 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) throw new Error("not a file");
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": mimeFromExtension(path.extname(filePath)),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }
}
