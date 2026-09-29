"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBytesLarge, toPersianDigits } from "@/lib/format-number";
import { ChartCard, ChartLegend, axisTick, tooltipLabelStyle, tooltipStyle } from "@/components/admin/DashboardCharts";
import { DEDICATED_UPLOAD_CAP_BYTES } from "@/lib/storage-caps";
import type { StorageTrendPoint } from "@/lib/storage-usage";

// Two-series categorical pair validated for both light/dark via this repo's
// dataviz skill (node scripts/validate_palette.js "#3987e5,#d95926" — all
// checks pass: lightness band, CVD ΔE 26.8, normal-vision ΔE 31.8, contrast).
const PUBLIC_COLOR = "#3987e5";
const PRIVATE_COLOR = "#d95926";

function formatBytesTick(bytes: number): string {
  // formatBytesLarge already converts digits to Persian numerals (۰-۹), so an
  // ASCII \d here would never match — axis labels don't need decimal precision.
  return formatBytesLarge(bytes).replace(/\.[۰-۹]+/, "");
}

export function StorageTrendChart({ data }: { data: StorageTrendPoint[] }) {
  if (data.length < 2) {
    return (
      <ChartCard title="روند رشد فضای اختصاصی" height={56}>
        <div className="flex h-full items-center justify-center text-center text-sm text-foreground/40">
          برای نمایش روند، حداقل به دو روز داده نیاز است — هر بار که ادمین این صفحه را باز کند (حداکثر یک‌بار در روز)
          یک رکورد ثبت می‌شود.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="روند رشد فضای اختصاصی" height={56}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--foreground) / 0.08)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis tick={axisTick} width={56} tickFormatter={formatBytesTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            cursor={{ stroke: "rgb(var(--foreground) / 0.15)" }}
            formatter={(value, name) => [formatBytesLarge(Number(value ?? 0)), name]}
          />
          <Legend content={(p) => <ChartLegend payload={p.payload} />} />
          <ReferenceLine
            y={DEDICATED_UPLOAD_CAP_BYTES}
            stroke="rgb(var(--foreground) / 0.3)"
            strokeDasharray="4 4"
            label={{ value: toPersianDigits(`سقف ${formatBytesLarge(DEDICATED_UPLOAD_CAP_BYTES)}`), position: "insideTopLeft", fill: "rgb(var(--foreground) / 0.5)", fontSize: 11 }}
          />
          <Line dataKey="publicBytes" name="آپلودهای عمومی" stroke={PUBLIC_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line dataKey="privateBytes" name="آپلودهای خصوصی" stroke={PRIVATE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
