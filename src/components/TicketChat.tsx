"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LifeBuoy, User, MoreVertical, ListChecks, Trash2, X } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { toPersianDigits, formatNumber } from "@/lib/format-number";
import EmojiPicker from "@/components/EmojiPicker";
import { useToast } from "@/components/ToastProvider";
import CannedResponsePicker from "@/components/admin/CannedResponsePicker";
import MediaPickerModal from "@/components/MediaPickerModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";

export type ChatAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorLabel: string;
  isStaff: boolean;
  isReply: boolean;
  message: string;
  attachments: ChatAttachment[];
  createdAt: string;
  seenAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
};

// A file the viewer has picked but not sent yet — no DB id until the reply
// that carries it is created, so a locally-generated tempId is the React key.
type PendingAttachment = {
  tempId: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

type TicketChatProps = {
  ticketId: string;
  initialMessages: ChatMessage[];
  viewerRole: "customer" | "staff";
  viewerId: string;
  canReply: boolean;
};

// Consecutive messages from the same sender within this window are grouped
// together (single avatar on the last one), matching Telegram.
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
const SEND_COOLDOWN_MS = 400;

// Shared width ceiling for every bubble (text or image), matching Telegram's
// shrink-to-fit behavior: short content hugs itself, long content wraps at
// this cap. Resolved with CSS min() against a viewport unit rather than a
// parent-relative `%`, because the bubble's immediate flex ancestor is itself
// shrink-to-fit — a percentage max-width there has no definite containing
// block to resolve against and silently fails (short messages were wrapping
// as if the cap were much narrower than intended).
const BUBBLE_MAX_WIDTH_PX = 420;
const BUBBLE_MAX_WIDTH_VW = 85;
const BUBBLE_MAX_WIDTH_CSS = `min(${BUBBLE_MAX_WIDTH_PX}px, ${BUBBLE_MAX_WIDTH_VW}vw)`;

// Fixed display box for a single-image message (sized per breakpoint in the
// className below) — every photo renders at exactly this size (object-fit:
// cover crops to fill it) regardless of the uploaded file's actual
// resolution, so a 4000x3000 photo and a 100x100 icon both come out
// identically sized instead of dictating the bubble's size. Smaller on
// mobile — at the old fixed 320x400 a single photo ate ~49% of a phone's
// viewport height, crowding out the rest of the conversation and the composer.

// Side is relative to the viewer, not to role: the viewer's own messages
// always render on the right (accent color), everyone else's on the left
// (dark) — the same ticket looks different depending on who's looking at it.
// The page is dir="rtl", where CSS `justify-start` renders on the visual
// RIGHT and `justify-end` on the visual LEFT — the inverse of an LTR page.
// Getting this backwards is an easy, silent mistake, so the mapping lives in
// one place.
const JUSTIFY_CLASS: Record<"left" | "right", string> = {
  right: "justify-start",
  left: "justify-end",
};

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return toPersianDigits(`${bytes} B`);
  if (bytes < 1024 * 1024) return toPersianDigits(`${Math.round(bytes / 1024)} KB`);
  return toPersianDigits(`${(bytes / (1024 * 1024)).toFixed(1)} MB`);
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
        isStaff ? "bg-accent-500" : "bg-white/10",
        !visible && "invisible",
      )}
    >
      {isStaff ? <LifeBuoy className="size-3.5 text-white" /> : <User className="size-3.5 text-foreground/70" />}
    </div>
  );
}

// Three bouncing dots shown while the other party is composing a reply. Only
// ever shown for the other party (never the viewer's own typing), so it
// always uses the "other" dark styling — never the accent/gradient "mine"
// look.
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="inline-flex items-center gap-1 rounded-2xl bg-white/[0.07] px-4 py-3 backdrop-blur-sm"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-foreground/50"
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

type BubbleProps = {
  side: "left" | "right";
  mine: boolean;
  children: ReactNode;
};

function Bubble({ side, mine, children }: BubbleProps) {
  // Slides in from the outward direction it settles into (right-side
  // bubbles slide in from further right, left-side from further left).
  const entranceX = side === "right" ? 16 : -16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96, x: entranceX }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxWidth: BUBBLE_MAX_WIDTH_CSS }}
      className={cn(
        "w-fit rounded-2xl px-3.5 py-2",
        mine
          ? "bg-accent-500 text-white shadow-[0_4px_12px_-4px_rgba(249,115,22,0.3)]"
          : "bg-white/[0.07] text-foreground shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] backdrop-blur-sm",
      )}
    >
      {children}
    </motion.div>
  );
}

// "More options" trigger pinned to the top corner of the row (via
// `self-start`, independent of how tall the bubble ends up being) — revealed
// on hover on desktop, or via a long-press elsewhere in the message on touch
// devices (see `longPressedId` in the parent). The dropdown itself is Radix's
// Popper-positioned Content: it has built-in viewport collision detection,
// so near the bottom of the chat it automatically flips to open upward
// instead of spilling off-screen.
function MessageMenu({
  onEdit,
  onDelete,
  onDownload,
  onSave,
  forceVisible,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onSave?: () => void;
  forceVisible: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="گزینه‌های پیام"
          className={cn(
            "flex h-7 w-7 shrink-0 self-start items-center justify-center rounded-full text-foreground/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-foreground group-hover:opacity-100",
            (forceVisible || open) && "opacity-100",
          )}
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 w-36 overflow-hidden rounded-xl border border-white/10 bg-background p-1 shadow-2xl"
        >
          {onDownload && (
            <DropdownMenu.Item
              onSelect={onDownload}
              className="w-full cursor-pointer select-none rounded-lg px-3 py-2 text-right text-xs font-medium text-foreground/80 outline-none transition-colors data-[highlighted]:bg-white/10"
            >
              دانلود
            </DropdownMenu.Item>
          )}
          {onSave && (
            <DropdownMenu.Item
              onSelect={onSave}
              className="w-full cursor-pointer select-none rounded-lg px-3 py-2 text-right text-xs font-medium text-foreground/80 outline-none transition-colors data-[highlighted]:bg-white/10"
            >
              ذخیره در گالری من
            </DropdownMenu.Item>
          )}
          {onEdit && (
            <DropdownMenu.Item
              onSelect={onEdit}
              className="w-full cursor-pointer select-none rounded-lg px-3 py-2 text-right text-xs font-medium text-foreground/80 outline-none transition-colors data-[highlighted]:bg-white/10"
            >
              ویرایش
            </DropdownMenu.Item>
          )}
          {onDelete && (
            <DropdownMenu.Item
              onSelect={onDelete}
              className="w-full cursor-pointer select-none rounded-lg px-3 py-2 text-right text-xs font-medium text-red-400 outline-none transition-colors data-[highlighted]:bg-red-500/10"
            >
              حذف
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default function TicketChat({ ticketId, initialMessages, viewerRole, viewerId, canReply }: TicketChatProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [throttled, setThrottled] = useState(false);
  const lastSendAtRef = useRef(0);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Touch devices have no hover — a long-press on the message itself reveals
  // its (otherwise hidden) options button, same idea as Telegram's mobile UI.
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnce = useRef(false);
  const lastTypingPingRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // autoFocus alone leaves the caret at position 0 in some browsers when the
    // textarea already has a value — jump it to the end instead, since editing
    // almost always means appending, not retyping from the start.
    if (!editingId || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editingId]);

  const handleTouchStart = (messageId: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setLongPressedId((prev) => (prev === messageId ? prev : null));
    longPressTimerRef.current = setTimeout(() => setLongPressedId(messageId), 450);
  };
  const cancelLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const seenEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/seen` : `/api/admin/tickets/${ticketId}/seen`;
  const replyEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/reply` : `/api/admin/tickets/${ticketId}/reply`;
  const typingEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/typing` : `/api/admin/tickets/${ticketId}/typing`;

  useEffect(() => {
    fetch(seenEndpoint, { method: "POST" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    // The account shell's page wrapper (not this message list) ends up being
    // the element that actually overflows on tall threads — its "flex-1"
    // section isn't height-clipped, so it grows to fit every message instead
    // of leaving this list to scroll internally. Walk up to whichever
    // ancestor genuinely has overflow so the fix keeps working whether the
    // chat itself scrolls (fits its box) or the whole page does (doesn't).
    let container: HTMLElement | null = scrollRef.current;
    while (
      container &&
      (container.scrollHeight <= container.clientHeight || getComputedStyle(container).overflowY === "visible")
    ) {
      container = container.parentElement;
    }
    if (!container) return;

    // Jump instantly to the bottom on first load — no animated scroll on open.
    const behavior: ScrollBehavior = hasScrolledOnce.current ? "smooth" : "auto";
    hasScrolledOnce.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior });
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

  const sendMessage = async () => {
    if (!text.trim() && pendingAttachments.length === 0) return;
    // Guards the Enter-key path too, not just the submit button's `disabled`
    // attribute: without this, a slow in-flight request (e.g. the first
    // request in a while — see SEND_COOLDOWN_MS comment) left the textarea's
    // Enter handler free to fire a genuine duplicate send once the 400ms
    // cooldown alone had elapsed but the request was still pending.
    if (sending) return;

    const now = Date.now();
    if (now - lastSendAtRef.current < SEND_COOLDOWN_MS) return;
    lastSendAtRef.current = now;
    setThrottled(true);
    window.setTimeout(() => setThrottled(false), SEND_COOLDOWN_MS);

    setSending(true);

    const res = await fetch(replyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        attachments: pendingAttachments.map((a) => ({
          url: a.url,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
        })),
      }),
    });

    setSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ارسال پیام.", "error");
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
        isReply: true,
        message: reply.message,
        attachments: reply.attachments ?? [],
        createdAt: reply.createdAt,
        seenAt: null,
        editedAt: null,
        deletedAt: null,
      },
    ]);
    setText("");
    setPendingAttachments([]);
    router.refresh();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startEdit = (m: ChatMessage) => {
    setEditingId(m.id);
    setEditingText(m.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (m: ChatMessage) => {
    if (!editingText.trim() && m.attachments.length === 0) return;
    setSavingEdit(true);

    const res = await fetch(`${replyEndpoint}/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: editingText }),
    });

    setSavingEdit(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره ویرایش پیام.", "error");
      return;
    }

    const { reply } = await res.json();
    setMessages((prev) =>
      prev.map((msg) => (msg.id === m.id ? { ...msg, message: reply.message, editedAt: reply.editedAt } : msg)),
    );
    cancelEdit();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    const res = await fetch(`${replyEndpoint}/${deleteTargetId}`, { method: "DELETE" });

    if (res.ok) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === deleteTargetId
            ? { ...msg, message: "", attachments: [], deletedAt: new Date().toISOString() }
            : msg,
        ),
      );
    } else {
      showToast("خطا در حذف پیام.", "error");
    }

    setDeleting(false);
    setDeleteTargetId(null);
  };

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDeleteEndpoint =
    viewerRole === "customer" ? `/api/account/tickets/${ticketId}/reply/bulk-delete` : `/api/admin/tickets/${ticketId}/reply/bulk-delete`;

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);

    const res = await fetch(bulkDeleteEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyIds: Array.from(selectedIds) }),
    });

    setBulkDeleting(false);
    setBulkConfirmOpen(false);

    if (!res.ok) {
      showToast("خطا در حذف پیام‌ها.", "error");
      return;
    }

    const { deletedIds, skippedIds } = await res.json();
    setMessages((prev) =>
      prev.map((msg) =>
        deletedIds.includes(msg.id)
          ? { ...msg, message: "", attachments: [], deletedAt: new Date().toISOString() }
          : msg,
      ),
    );

    if (skippedIds.length > 0) {
      showToast(`${formatNumber(deletedIds.length)} پیام حذف شد، ${formatNumber(skippedIds.length)} مورد رد شد.`, "warning");
    } else {
      showToast(`${formatNumber(deletedIds.length)} پیام حذف شد.`, "success");
    }

    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const hasOwnMessages = messages.some((m) => m.isReply && !m.deletedAt && m.authorId === viewerId);

  const attachmentsEndpointBase =
    viewerRole === "customer" ? `/api/account/tickets/${ticketId}/attachments` : `/api/admin/tickets/${ticketId}/attachments`;

  const downloadAttachments = async (m: ChatMessage) => {
    for (const a of m.attachments) {
      try {
        const res = await fetch(getMediaUrl(a.url));
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = a.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      } catch {
        showToast("خطا در دانلود فایل.", "error");
      }
    }
  };

  const saveAttachmentsToGallery = async (m: ChatMessage) => {
    let savedCount = 0;
    for (const a of m.attachments) {
      const res = await fetch(`${attachmentsEndpointBase}/${a.id}/save`, { method: "POST" });
      if (res.ok) savedCount++;
    }

    if (savedCount === 0) {
      showToast("خطا در ذخیره‌سازی فایل.", "error");
    } else {
      showToast(`${formatNumber(savedCount)} فایل در گالری شما ذخیره شد.`, "success");
    }
  };

  return (
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-black/10">
      {hasOwnMessages && (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 sm:px-6">
          {selectMode ? (
            <>
              <span className="text-xs font-medium text-foreground/60">
                {selectedIds.size > 0 ? `${formatNumber(selectedIds.size)} پیام انتخاب شده` : "پیامی انتخاب نشده"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkConfirmOpen(true)}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                  حذف انتخاب‌شده‌ها
                </button>
                <button
                  type="button"
                  onClick={toggleSelectMode}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/10"
                >
                  <X className="size-3.5" />
                  لغو انتخاب
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSelectMode}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <ListChecks className="size-3.5" />
              انتخاب پیام‌ها
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.map((m, i) => {
          // "Mine" is the viewer's actual identity, not their role — two
          // different SUPPORT agents on the same ticket must each see only
          // their own messages on the right, not every staff message.
          const isMine = m.authorId === viewerId;
          const canModify = m.isReply && !m.deletedAt && m.authorId === viewerId;
          const side: "left" | "right" = isMine ? "right" : "left";
          const isEditing = editingId === m.id;

          const prev = messages[i - 1];
          const next = messages[i + 1];
          const gapFromPrev = prev ? new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
          const gapToNext = next ? new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() : Infinity;
          const isFirstInGroup = !prev || prev.isStaff !== m.isStaff || gapFromPrev > GROUP_GAP_MS;
          const isLastInGroup = !next || next.isStaff !== m.isStaff || gapToNext > GROUP_GAP_MS;

          const bubbleContent = (
            <Bubble side={side} mine={isMine}>
              {isEditing ? (
                <div className="flex min-w-[220px] flex-col gap-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveEdit(m);
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    rows={2}
                    className={cn(
                      "w-full resize-none rounded-lg bg-black/10 px-2 py-1.5 text-sm outline-none",
                      isMine ? "text-white placeholder:text-white/50" : "text-foreground placeholder:text-foreground/40",
                    )}
                  />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button type="button" onClick={cancelEdit} className="opacity-70 hover:opacity-100">
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(m)}
                      disabled={savingEdit}
                      className="rounded-full bg-black/20 px-3 py-1 font-semibold hover:bg-black/30 disabled:opacity-50"
                    >
                      {savingEdit ? "..." : "ذخیره"}
                    </button>
                  </div>
                </div>
              ) : m.deletedAt ? (
                <p className={cn("text-sm italic", isMine ? "text-white/70" : "text-foreground/40")}>
                  این پیام حذف شد
                </p>
              ) : (
                <>
                  {m.message && <p className="whitespace-pre-wrap text-sm leading-6">{m.message}</p>}

                  {(() => {
                    const images = m.attachments.filter((a) => isImageMime(a.mimeType));
                    const files = m.attachments.filter((a) => !isImageMime(a.mimeType));
                    return (
                      <>
                        {images.length > 0 && (
                          <div
                            className={cn(
                              "gap-1",
                              m.message ? "mt-2" : "",
                              images.length === 1 ? "" : "grid grid-cols-2",
                            )}
                          >
                            {images.map((img) => (
                              <a
                                key={img.id}
                                href={getMediaUrl(img.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "relative block overflow-hidden rounded-lg border border-white/10",
                                  images.length === 1
                                    ? "h-[220px] w-[176px] max-w-full sm:h-[400px] sm:w-[320px]"
                                    : "aspect-square w-full",
                                )}
                              >
                                <Image
                                  src={getMediaUrl(img.url)}
                                  alt={img.filename}
                                  fill
                                  sizes="(min-width: 640px) 320px, 220px"
                                  className="object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className={cn("flex flex-col gap-1.5", m.message || images.length > 0 ? "mt-2" : "")}>
                            {files.map((f) => (
                              <a
                                key={f.id}
                                href={getMediaUrl(f.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs hover:border-white/30"
                              >
                                <FileTypeIcon kind={fileKindFromName(f.filename)} />
                                <span className="min-w-0 flex-1 truncate">{f.filename}</span>
                                <span className="shrink-0 opacity-60">{formatFileSize(f.size)}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1.5 text-[10px]",
                      isMine ? "text-white/70" : "text-foreground/40",
                    )}
                  >
                    {m.editedAt && <span>ویرایش شد ·</span>}
                    <span dir="ltr">
                      {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && <SeenTicks seen={!!m.seenAt} onGradient={isMine} />}
                  </div>
                </>
              )}
            </Bubble>
          );

          const hasAttachments = !m.deletedAt && m.attachments.length > 0;

          const menu =
            (canModify || hasAttachments) && !isEditing && !selectMode ? (
              <MessageMenu
                onEdit={canModify ? () => startEdit(m) : undefined}
                onDelete={canModify ? () => setDeleteTargetId(m.id) : undefined}
                onDownload={hasAttachments ? () => downloadAttachments(m) : undefined}
                onSave={hasAttachments ? () => saveAttachmentsToGallery(m) : undefined}
                forceVisible={longPressedId === m.id}
              />
            ) : canModify && selectMode ? (
              <button
                type="button"
                onClick={() => toggleSelected(m.id)}
                aria-label={selectedIds.has(m.id) ? "لغو انتخاب پیام" : "انتخاب پیام"}
                className={cn(
                  "flex h-7 w-7 shrink-0 self-start items-center justify-center rounded-full border transition-colors",
                  selectedIds.has(m.id)
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-white/20 bg-transparent text-transparent hover:border-white/40",
                )}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null;

          return (
            <div
              key={m.id}
              className={cn(
                "group flex",
                JUSTIFY_CLASS[side],
                isFirstInGroup ? (i === 0 ? "mt-0" : "mt-4") : "mt-1",
              )}
              onTouchStart={canModify && !selectMode ? () => handleTouchStart(m.id) : undefined}
              onTouchEnd={canModify && !selectMode ? cancelLongPress : undefined}
              onTouchMove={canModify && !selectMode ? cancelLongPress : undefined}
            >
              <div className="flex items-end gap-1.5">
                {/* Avatar is only ever shown for the other party's messages,
                    which now always render on the left. */}
                {side === "left" && menu}
                {bubbleContent}
                {!isMine && <Avatar isStaff={m.isStaff} visible={isLastInGroup} />}
                {side === "right" && menu}
              </div>
            </div>
          );
        })}

        <AnimatePresence>
          {otherTyping &&
            (() => {
              // The typing indicator is always the OTHER party's, so it
              // always renders on the left, same as their message bubbles.
              const otherIsStaff = viewerRole === "customer";
              return (
                <div className={cn("flex mt-4", JUSTIFY_CLASS.left)}>
                  <div className="flex items-end gap-2">
                    <TypingIndicator />
                    <Avatar isStaff={otherIsStaff} visible />
                  </div>
                </div>
              );
            })()}
        </AnimatePresence>
      </div>

      {canReply ? (
        <form onSubmit={handleSend} className="border-t border-white/10 bg-background/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="mb-2 flex items-center gap-1">
            <EmojiPicker
              onSelect={(emoji) => (editingId ? setEditingText((prev) => prev + emoji) : setText((prev) => prev + emoji))}
            />
            {viewerRole === "staff" && (
              <CannedResponsePicker
                onSelect={(body) =>
                  editingId
                    ? setEditingText((prev) => (prev ? `${prev}\n${body}` : body))
                    : setText((prev) => (prev ? `${prev}\n${body}` : body))
                }
              />
            )}
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

          <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm transition-colors focus-within:border-accent-500/50">
            {pendingAttachments.length > 0 &&
              (() => {
                const images = pendingAttachments.filter((a) => isImageMime(a.mimeType));
                const files = pendingAttachments.filter((a) => !isImageMime(a.mimeType));
                const removeOne = (tempId: string) =>
                  setPendingAttachments((prev) => prev.filter((a) => a.tempId !== tempId));

                return (
                  <div className="flex flex-col gap-1.5 p-1">
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {images.map((img) => (
                          <div
                            key={img.tempId}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10"
                          >
                            <Image src={getMediaUrl(img.url)} alt={img.filename} fill sizes="56px" className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removeOne(img.tempId)}
                              aria-label="حذف تصویر"
                              className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500"
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {files.map((f) => (
                          <div key={f.tempId} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                            <FileTypeIcon kind={fileKindFromName(f.filename)} className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate text-foreground/80">{f.filename}</span>
                            <span className="shrink-0 text-foreground/40">{formatFileSize(f.size)}</span>
                            <button
                              type="button"
                              onClick={() => removeOne(f.tempId)}
                              aria-label="حذف پیوست"
                              className="shrink-0 rounded-full p-1 text-foreground/40 hover:bg-white/10 hover:text-red-400"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim()) pingTyping();
                }}
                onKeyDown={handleTextareaKeyDown}
                rows={2}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-foreground/40"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={sending || throttled || (!text.trim() && pendingAttachments.length === 0)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/25 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="ارسال"
              >
                {sending ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 3L11 13M21 3l-6.5 18-4-8-8-4L21 3z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>

        </form>
      ) : (
        <div className="border-t border-white/10 p-4 text-center text-sm text-foreground/50">
          این تیکت بسته شده است.
        </div>
      )}

      <MediaPickerModal
        open={attachmentPickerOpen}
        onClose={() => setAttachmentPickerOpen(false)}
        kind="all"
        scope="TICKET_ATTACHMENT"
        multiple
        onConfirm={(assets) => {
          setPendingAttachments((prev) => {
            const existingUrls = new Set(prev.map((a) => a.url));
            const additions = assets
              .filter((a) => !existingUrls.has(a.url))
              .map((a) => ({ tempId: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType, size: a.size }));
            return [...prev, ...additions];
          });
        }}
      />

      <ConfirmDialog
        open={!!deleteTargetId}
        title="حذف پیام"
        message="مطمئنید می‌خواهید این پیام را حذف کنید؟ این پیام برای طرف مقابل «حذف شد» نمایش داده می‌شود."
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="حذف پیام‌های انتخاب‌شده"
        message={`مطمئنید می‌خواهید ${formatNumber(selectedIds.size)} پیام انتخاب‌شده را حذف کنید؟ این پیام‌ها برای طرف مقابل «حذف شد» نمایش داده می‌شوند.`}
        confirmLabel="حذف کن"
        danger
        loading={bulkDeleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
