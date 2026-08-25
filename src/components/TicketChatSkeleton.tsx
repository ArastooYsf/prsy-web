import Skeleton from "react-loading-skeleton";

// Mirrors TicketChat.tsx's own layout: RTL means `justify-start` is the
// visual right side (the mine/accent side) and `justify-end` is the visual
// left (the other party) — see the same note in TicketChat.tsx.
const JUSTIFY_CLASS: Record<"left" | "right", string> = {
  right: "justify-start",
  left: "justify-end",
};

const ROWS: { side: "left" | "right"; width: string; lines: 1 | 2 }[] = [
  { side: "left", width: "62%", lines: 1 },
  { side: "right", width: "45%", lines: 1 },
  { side: "right", width: "70%", lines: 2 },
  { side: "left", width: "50%", lines: 1 },
  { side: "left", width: "38%", lines: 1 },
  { side: "right", width: "58%", lines: 1 },
];

function MessageRow({ side, width, lines }: (typeof ROWS)[number]) {
  return (
    <div className={`flex items-end gap-2 ${JUSTIFY_CLASS[side]}`}>
      {side === "left" && <Skeleton circle width={28} height={28} containerClassName="shrink-0" />}
      <div className="flex flex-col gap-1.5 rounded-2xl px-3.5 py-2" style={{ width }}>
        <Skeleton height={13} />
        {lines === 2 && <Skeleton height={13} width="70%" />}
      </div>
    </div>
  );
}

// Shared skeleton for the ticket-chat route boundary — used by both the
// customer and admin ticket detail loading.tsx, which both stream in the
// same TicketChat shell via a server-side prisma fetch (the chat component
// itself receives its initial messages as an already-resolved prop, so this
// is the real async gap, not TicketChat's own client state).
export default function TicketChatSkeleton() {
  return (
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.02] to-background/10">
      <div className="flex-1 space-y-3 overflow-hidden p-4 sm:p-6">
        {ROWS.map((row, i) => (
          <MessageRow key={i} {...row} />
        ))}
      </div>

      <div className="border-t border-foreground/10 bg-background/60 p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <Skeleton circle width={32} height={32} />
          <Skeleton circle width={32} height={32} />
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-foreground/10 bg-foreground/5 p-1.5">
          <Skeleton height={36} borderRadius={8} containerClassName="flex-1" />
          <Skeleton circle width={36} height={36} containerClassName="shrink-0" />
        </div>
      </div>
    </div>
  );
}
