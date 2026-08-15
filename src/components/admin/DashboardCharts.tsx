"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TicketTrendPoint, StatusCount } from "@/lib/admin-stats";

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f97316",
  PROCESSING: "#60a5fa",
  SHIPPED: "#3b82f6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

const TICKET_RATIO_COLORS = ["#f97316", "#10b981"];

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  direction: "rtl" as const,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-sm font-semibold text-foreground/80">{title}</p>
      <div dir="ltr" className="h-64 w-full">
        {children}
      </div>
    </div>
  );
}

export function TicketTrendChart({ data }: { data: TicketTrendPoint[] }) {
  return (
    <ChartCard title="روند تیکت‌های ثبت‌شده (۳۰ روز اخیر)">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ticketTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} interval={4} />
          <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={28} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
          <Area type="monotone" dataKey="count" name="تیکت" stroke="#f97316" strokeWidth={2} fill="url(#ticketTrendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OrderStatusChart({ data }: { data: StatusCount[] }) {
  return (
    <ChartCard title="سفارش‌ها به تفکیک وضعیت">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={28} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="count" name="تعداد" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] ?? "#71717a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TicketRatioChart({ data }: { data: StatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ChartCard title="نسبت تیکت‌های باز به بسته">
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-foreground/40">هنوز تیکتی ثبت نشده است.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.status} fill={TICKET_RATIO_COLORS[i % TICKET_RATIO_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 12, direction: "rtl" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
