import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidLogFilename, listLogFilenames } from "@/lib/logger";
import { createEncryptedLogExportZip } from "@/lib/log-export";
import { ALL_LOG_CATEGORIES, type LogCategory } from "@/lib/log-types";

function isLogCategory(value: string): value is LogCategory {
  return (ALL_LOG_CATEGORIES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const category = searchParams.get("category");

  let filenames: string[];
  let downloadName: string;

  if (filename) {
    if (!isValidLogFilename(filename)) {
      return NextResponse.json({ error: "نام فایل نامعتبر است." }, { status: 400 });
    }
    filenames = [filename];
    downloadName = `${filename.replace(/\.log$/, "")}.zip`;
  } else if (category) {
    // "all", or a comma-separated list of categories from the multi-select filter.
    let categories: LogCategory[] | "all";
    if (category === "all") {
      categories = "all";
    } else {
      const requested = category.split(",").filter(Boolean);
      if (requested.length === 0 || !requested.every(isLogCategory)) {
        return NextResponse.json({ error: "دسته نامعتبر است." }, { status: 400 });
      }
      categories = requested;
    }

    filenames = await listLogFilenames(categories);
    if (filenames.length === 0) {
      return NextResponse.json({ error: "فایلی برای این دسته یافت نشد." }, { status: 404 });
    }
    downloadName = `logs-${categories === "all" ? "all" : categories.join("_")}-export.zip`;
  } else {
    return NextResponse.json({ error: "پارامتر filename یا category لازم است." }, { status: 400 });
  }

  try {
    const { zip, usedPlaceholderPassword } = await createEncryptedLogExportZip(filenames);
    // NextResponse's BodyInit type wants a Uint8Array<ArrayBuffer>, which a
    // Buffer's own (ArrayBufferLike-backed) view doesn't satisfy under this
    // TS/Node lib version — this copy is what keeps the compiler honest;
    // export payloads here are CSV text, not the 300MB LOG_DIR ceiling.
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(zip.length),
        // Read client-side to warn the admin the export isn't actually
        // protected by a secret only they know — LOG_EXPORT_PASSWORD was
        // never configured, so this zip used the placeholder baked into
        // the source instead.
        "X-Log-Export-Placeholder-Password": usedPlaceholderPassword ? "1" : "0",
      },
    });
  } catch (err) {
    console.warn("[logs export] failed:", err);
    return NextResponse.json({ error: "ساخت فایل خروجی ناموفق بود." }, { status: 500 });
  }
}
