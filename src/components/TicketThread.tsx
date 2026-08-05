type ThreadMessage = {
  id: string;
  authorLabel: string;
  isStaff: boolean;
  message: string;
  createdAt: Date;
};

export default function TicketThread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl border p-5 ${
            m.isStaff
              ? "border-accent-500/20 bg-accent-500/5"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className={`text-sm font-semibold ${m.isStaff ? "text-accent-400" : "text-foreground"}`}>
              {m.authorLabel}
            </span>
            <span dir="ltr" className="text-xs text-foreground/50">
              {m.createdAt.toLocaleString("fa-IR")}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
