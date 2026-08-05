"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMediaUrl } from "@/lib/media";
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

function isImageUrl(url: string) {
  return IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
}

function SenderArrow({ isStaff }: { isStaff: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0 text-current">
      {isStaff ? (
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function SeenTicks({ seen }: { seen: boolean }) {
  return (
    <svg width="16" height="10" viewBox="0 0 20 12" fill="none" className={seen ? "text-accent-400" : "text-current opacity-60"}>
      <path d="M1 6l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {seen && <path d="M8 6l3.5 3.5L18 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const seenEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/seen` : `/api/admin/tickets/${ticketId}/seen`;
  const replyEndpoint = viewerRole === "customer" ? `/api/account/tickets/${ticketId}/reply` : `/api/admin/tickets/${ticketId}/reply`;

  useEffect(() => {
    fetch(seenEndpoint, { method: "POST" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

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
    <div className="flex h-[calc(100vh-16rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isStaff ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 sm:max-w-[65%] ${
                m.isStaff
                  ? "border border-accent-500/25 bg-accent-500/15 text-foreground"
                  : "border border-white/10 bg-white/[0.06] text-foreground"
              }`}
            >
              <p className={`mb-1 text-xs font-semibold ${m.isStaff ? "text-accent-400" : "text-foreground/70"}`}>
                {m.authorLabel}
              </p>

              {m.message && <p className="whitespace-pre-wrap text-sm leading-7">{m.message}</p>}

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
                    className={`flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs hover:border-accent-500/40 ${m.message ? "mt-2" : ""}`}
                  >
                    <FileTypeIcon kind={fileKindFromName(m.attachmentUrl)} />
                    <span className="truncate">{m.attachmentName ?? "فایل پیوست"}</span>
                  </a>
                ))}

              <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${m.isStaff ? "text-accent-400/70" : "text-foreground/40"}`}>
                <SenderArrow isStaff={m.isStaff} />
                <span dir="ltr">{new Date(m.createdAt).toLocaleString("fa-IR")}</span>
                <SeenTicks seen={!!m.seenAt} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {canReply ? (
        <form onSubmit={handleSend} className="border-t border-white/10 bg-background p-3 sm:p-4">
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

          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50"
            />
            <button
              type="submit"
              disabled={sending || (!text.trim() && !pendingAttachment)}
              className="shrink-0 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ارسال
            </button>
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
