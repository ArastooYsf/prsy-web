"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, User } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import EmojiPicker from "@/components/EmojiPicker";
import CannedResponsePicker from "@/components/admin/CannedResponsePicker";
import MediaPickerModal from "@/components/MediaPickerModal";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";

export type ChatMessage = {
  id: string;
  authorId: string;
  authorLabel: string;
  isStaff: boolean;
  message: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  seenAt: string | null;
};

type TicketChatProps = {
  ticketId: string;
  initialMessages: ChatMessage[];
  viewerRole: "customer" | "staff";
  canReply: boolean;
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
// Consecutive messages from the same sender within this window are grouped
// together (single tail + single avatar on the last one), matching Telegram.
const GROUP_GAP_MS = 5 * 60 * 1000;

// There's no websocket/SSE server in this project, so "typing" status is
// polled over plain REST rather than pushed live. TYPING_POLL_MS controls
// how often we check whether the other party is typing; TYPING_STALE_MS is
// how long a typing timestamp is considered "still typing" before it's
// treated as stopped (no explicit "stopped typing" signal is sent).
const TYPING_POLL_MS = 2500;
const TYPING_STALE_MS = 5000;
// Minimum gap between "I'm typing" pings sent while the user types, so every
// keystroke doesn't hit the API.
const TYPING_PING_THROTTLE_MS = 2500;

// Physical side each role renders on. The page is dir="rtl", where CSS
// `justify-start` renders on the visual RIGHT and `justify-end` on the
// visual LEFT — the inverse of an LTR page. Getting this backwards is an
// easy, silent mistake, so the mapping lives in one place.
const PHYSICAL_SIDE = { staff: "right", customer: "left" } as const;
const JUSTIFY_CLASS: Record<"left" | "right", string> = {
  right: "justify-start",
  left: "justify-end",
};

function isImageUrl(url: string) {
  return IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
}

function SeenTicks({ seen, onGradient }: { seen: boolean; onGradient: boolean }) {
  return (
    <svg
      width="15"
      height="9"
      viewBox="0 0 20 12"
      fill="none"
      className={onGradient ? (seen ? "text-white" : "text-white/60") : seen ? "text-accent-300" : "text-current opacity-60"}
    >
      <path d="M1 6l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {seen && <path d="M8 6l3.5 3.5L18 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

// Small circular avatar shown next to the other party's messages, collapsed
// to only the last bubble of a consecutive group (invisible placeholder on
// earlier ones so the bubble column stays aligned).
function Avatar({ isStaff, visible }: { isStaff: boolean; visible: boolean }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        isStaff ? "bg-gradient-to-br from-accent-500 to-accent-600" : "bg-white/10",
        !visible && "invisible",
      )}
    >
      {isStaff ? <LifeBuoy className="size-3.5 text-white" /> : <User className="size-3.5 text-foreground/70" />}
    </div>
  );
}

// Three bouncing dots shown while the other party is composing a reply,
// styled to match whichever side/color their bubbles use.
function TypingIndicator({ isStaff }: { isStaff: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl px-4 py-3",
        isStaff
          ? "bg-gradient-to-br from-accent-500 to-accent-600 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]"
          : "bg-white/[0.07] backdrop-blur-sm",
      )}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn("h-2 w-2 rounded-full", isStaff ? "bg-white/80" : "bg-foreground/50")}
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

// Builds a single closed SVG path — the bubble's rounded rectangle fused
// with a small pointed tail at one bottom corner — so the tail is part of
// the same filled shape as the body (no separate element, no seam),
// matching the "droplet clip-path" technique used by Telegram Desktop.
function buildTailPath(w: number, h: number, side: "left" | "right"): string {
  const T = 7; // how far the tail tip pokes out past the body edge
  const R = Math.max(4, Math.min(16, h / 2, w / 2)); // corner radius, clamped for tiny bubbles

  if (side === "right") {
    const bodyW = w - T;
    const rightEdgeY = Math.max(R, h - R - T);
    return [
      `M ${R} 0`,
      `L ${bodyW - R} 0`,
      `A ${R} ${R} 0 0 1 ${bodyW} ${R}`,
      `L ${bodyW} ${rightEdgeY}`,
      `L ${w} ${h}`,
      `L ${bodyW - R} ${h}`,
      `L ${R} ${h}`,
      `A ${R} ${R} 0 0 1 0 ${h - R}`,
      `L 0 ${R}`,
      `A ${R} ${R} 0 0 1 ${R} 0`,
      "Z",
    ].join(" ");
  }

  const bodyX0 = T;
  const leftEdgeY = Math.max(R, h - R - T);
  return [
    `M ${bodyX0 + R} 0`,
    `L ${w - R} 0`,
    `A ${R} ${R} 0 0 1 ${w} ${R}`,
    `L ${w} ${h - R}`,
    `A ${R} ${R} 0 0 1 ${w - R} ${h}`,
    `L ${bodyX0 + R} ${h}`,
    `L 0 ${h}`,
    `L ${bodyX0} ${leftEdgeY}`,
    `L ${bodyX0} ${R}`,
    `A ${R} ${R} 0 0 1 ${bodyX0 + R} 0`,
    "Z",
  ].join(" ");
}

type BubbleProps = {
  side: "left" | "right";
  isStaff: boolean;
  hasTail: boolean;
  children: ReactNode;
};

function Bubble({ side, isStaff, hasTail, children }: BubbleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    if (!hasTail) return;
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasTail]);

  const clipPath = hasTail && size ? `path('${buildTailPath(size.w, size.h, side)}')` : undefined;
  // Slides in from the outward direction it settles into (right-side
  // bubbles slide in from further right, left-side from further left).
  const entranceX = side === "right" ? 16 : -16;

  return (
    <motion.div
      ref={ref}
      style={clipPath ? { clipPath } : undefined}
      initial={{ opacity: 0, y: 12, scale: 0.96, x: entranceX }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-fit max-w-[70%] rounded-2xl px-3.5 py-2",
        isStaff
          ? "bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]"
          : "bg-white/[0.07] text-foreground shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] backdrop-blur-sm",
      )}
    >
      {children}
    </motion.div>
  );
}

export default function TicketChat({ ticketId, initialMessages, viewerRole, canReply }: TicketChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string } | null>(null);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnce = useRef(false);
  const lastTypingPingRef = useRef(0);

  const seenEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/seen` : `/api/admin/tickets/${ticketId}/seen`;
  const replyEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/reply` : `/api/admin/tickets/${ticketId}/reply`;
  const typingEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/typing` : `/api/admin/tickets/${ticketId}/typing`;

  useEffect(() => {
    fetch(seenEndpoint, { method: "POST" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!hasScrolledOnce.current) {
      // Jump instantly to the bottom on first load — no animated scroll on open.
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      hasScrolledOnce.current = true;
      return;
    }
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, otherTyping]);

  useEffect(() => {
    if (!canReply) return;

    let cancelled = false;
    const poll = async () => {
      const res = await fetch(typingEndpoint).catch(() => null);
      if (cancelled || !res?.ok) return;
      const { typingAt } = await res.json();
      const isTyping = !!typingAt && Date.now() - new Date(typingAt).getTime() < TYPING_STALE_MS;
      setOtherTyping(isTyping);
    };

    poll();
    const interval = setInterval(poll, TYPING_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [typingEndpoint, canReply]);

  const pingTyping = () => {
    const now = Date.now();
    if (now - lastTypingPingRef.current < TYPING_PING_THROTTLE_MS) return;
    lastTypingPingRef.current = now;
    fetch(typingEndpoint, { method: "POST" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!text.trim() && !pendingAttachment) return;

    setSending(true);

    const res = await fetch(replyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        attachmentUrl: pendingAttachment?.url ?? null,
        attachmentName: pendingAttachment?.name ?? null,
      }),
    });

    setSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ارسال پیام.");
      return;
    }

    const { reply } = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        id: reply.id,
        authorId: reply.authorId,
        authorLabel: "شما",
        isStaff: viewerRole === "staff",
        message: reply.message,
        attachmentUrl: reply.attachmentUrl,
        attachmentName: reply.attachmentName,
        createdAt: reply.createdAt,
        seenAt: null,
      },
    ]);
    setText("");
    setPendingAttachment(null);
    router.refresh();
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-black/10">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.map((m, i) => {
          const isMine = viewerRole === "staff" ? m.isStaff : !m.isStaff;
          const side = m.isStaff ? PHYSICAL_SIDE.staff : PHYSICAL_SIDE.customer;

          const prev = messages[i - 1];
          const next = messages[i + 1];
          const gapFromPrev = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
          const gapToNext = next ? new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() : Infinity;
          const isFirstInGroup = !prev || prev.isStaff !== m.isStaff || gapFromPrev > GROUP_GAP_MS;
          const isLastInGroup = !next || next.isStaff !== m.isStaff || gapToNext > GROUP_GAP_MS;

          const bubbleContent = (
            <Bubble side={side} isStaff={m.isStaff} hasTail={isLastInGroup}>
              {m.message && <p className="whitespace-pre-wrap text-sm leading-6">{m.message}</p>}

              {m.attachmentUrl &&
                (isImageUrl(m.attachmentUrl) ? (
                  <a href={getMediaUrl(m.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getMediaUrl(m.attachmentUrl)}
                      alt={m.attachmentName ?? ""}
                      className={`max-w-full rounded-lg border border-white/10 ${m.message ? "mt-2" : ""}`}
                    />
                  </a>
                ) : (
                  <a
                    href={getMediaUrl(m.attachmentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs hover:border-white/30 ${m.message ? "mt-2" : ""}`}
                  >
                    <FileTypeIcon kind={fileKindFromName(m.attachmentUrl)} />
                    <span className="truncate">{m.attachmentName ?? "فایل پیوست"}</span>
                  </a>
                ))}

              <div
                className={cn(
                  "mt-1 flex items-center justify-end gap-1.5 text-[10px]",
                  m.isStaff ? "text-white/70" : "text-foreground/40",
                )}
              >
                <span dir="ltr">
                  {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isMine && <SeenTicks seen={!!m.seenAt} onGradient={m.isStaff} />}
              </div>
            </Bubble>
          );

          return (
            <div
              key={m.id}
              className={cn(
                "flex",
                JUSTIFY_CLASS[side],
                isFirstInGroup ? (i === 0 ? "mt-0" : "mt-4") : "mt-1",
              )}
            >
              <div className="flex items-end gap-2">
                {!isMine && side === "right" && <Avatar isStaff={m.isStaff} visible={isLastInGroup} />}
                {bubbleContent}
                {!isMine && side === "left" && <Avatar isStaff={m.isStaff} visible={isLastInGroup} />}
              </div>
            </div>
          );
        })}

        <AnimatePresence>
          {otherTyping &&
            (() => {
              const otherIsStaff = viewerRole === "customer";
              const side = otherIsStaff ? PHYSICAL_SIDE.staff : PHYSICAL_SIDE.customer;
              return (
                <div className={cn("flex mt-4", JUSTIFY_CLASS[side])}>
                  <div className="flex items-end gap-2">
                    {side === "right" && <Avatar isStaff={otherIsStaff} visible />}
                    <TypingIndicator isStaff={otherIsStaff} />
                    {side === "left" && <Avatar isStaff={otherIsStaff} visible />}
                  </div>
                </div>
              );
            })()}
        </AnimatePresence>
      </div>

      {canReply ? (
        <form onSubmit={handleSend} className="border-t border-white/10 bg-background/60 p-3 backdrop-blur-sm sm:p-4">
          {pendingAttachment && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
              <span className="truncate text-foreground/70">{pendingAttachment.name}</span>
              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                className="mr-auto shrink-0 text-foreground/40 hover:text-red-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          <div className="mb-2 flex items-center gap-1">
            <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />
            {viewerRole === "staff" && <CannedResponsePicker onSelect={(body) => setText((prev) => (prev ? `${prev}\n${body}` : body))} />}
            <button
              type="button"
              onClick={() => setAttachmentPickerOpen(true)}
              aria-label="پیوست فایل"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.5 8.5l-7 7a2.5 2.5 0 003.5 3.5l7-7a4 4 0 00-5.5-5.5l-7 7a5.5 5.5 0 007.5 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <MediaPickerModal
            open={attachmentPickerOpen}
            onClose={() => setAttachmentPickerOpen(false)}
            kind="all"
            multiple={false}
            onConfirm={(assets) => {
              if (assets[0]) setPendingAttachment({ url: assets[0].url, name: assets[0].filename });
            }}
          />

          <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-sm transition-colors focus-within:border-accent-500/50">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim()) pingTyping();
              }}
              rows={2}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-foreground/40"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={sending || (!text.trim() && !pendingAttachment)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="ارسال"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 3L11 13M21 3l-6.5 18-4-8-8-4L21 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </div>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </form>
      ) : (
        <div className="border-t border-white/10 p-4 text-center text-sm text-foreground/50">
          این تیکت بسته شده است.
        </div>
      )}
    </div>
  );
}
