import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateDownloadHostUrl } from "@/lib/download-host";
import { SITE_CONTENT_TAG, DOWNLOADS_KEY, type DownloadsContent } from "@/lib/site-content";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const catalogUrlResult = validateDownloadHostUrl(typeof body.catalogUrl === "string" ? body.catalogUrl : "");
  if (!catalogUrlResult.ok) {
    return NextResponse.json({ error: catalogUrlResult.error }, { status: 400 });
  }
  const introVideoUrlResult = validateDownloadHostUrl(typeof body.introVideoUrl === "string" ? body.introVideoUrl : "");
  if (!introVideoUrlResult.ok) {
    return NextResponse.json({ error: introVideoUrlResult.error }, { status: 400 });
  }

  const content: DownloadsContent = {
    catalogUrl: catalogUrlResult.value,
    introVideoUrl: introVideoUrlResult.value,
  };

  await prisma.siteContent.upsert({
    where: { key: DOWNLOADS_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: DOWNLOADS_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  await logEvent({
    actor: actorFromSession(session),
    action: "update",
    target: { type: "site_content", id: DOWNLOADS_KEY, label: "بخش دانلودها" },
  });

  return NextResponse.json({ ok: true, content });
}
