"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle, Navigation } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { buildMapLinks, openMapLink } from "@/lib/map-deep-links";
import { DELIVERY_STAGE } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import SignaturePad from "@/components/courier/SignaturePad";

// Single source of truth for the 4 stage values is DELIVERY_STAGE
// (src/lib/status-labels.tsx) — its key order is the display order too.
const STAGE_ORDER = Object.keys(DELIVERY_STAGE);

type CourierOrder = {
  id: string;
  orderNumber: string;
  itemCount: number;
  customerName: string | null;
  customerPhone: string | null;
  recipientAddress: string | null;
  recipientPostalCode: string | null;
  recipientLat: number | null;
  recipientLng: number | null;
  courierLocationUpdatedAt: string | null;
  deliveryStage: string | null;
  deliveryCodeVerifiedAt: string | null;
};

type Sender = { name: string; phone: string };

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function ContactLine({ label, name, phone }: { label: string; name: string | null; phone: string | null }) {
  return (
    <p className="text-sm text-foreground/70">
      {label}: {name ?? "—"}
      {phone && (
        <>
          {" "}
          —{" "}
          <a href={`tel:${phone}`} dir="ltr" className="text-accent-400 hover:underline">
            {phone}
          </a>
        </>
      )}
    </p>
  );
}

// Deliberately same-tab (no target="_blank") — see the comment on
// openMapLink in map-deep-links.ts for why a new tab breaks the back button
// on iOS once an installed app claims the link. href stays set to the web
// fallback for accessibility/right-click/middle-click; onClick intercepts a
// normal tap to run the platform-aware app-first logic.
function RouteLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
    >
      <Navigation className="size-3.5" />
      {label}
    </a>
  );
}

export default function CourierOrderCard({ order, sender }: { order: CourierOrder; sender: Sender }) {
  const router = useRouter();
  const mapLinks = buildMapLinks({ lat: order.recipientLat, lng: order.recipientLng, address: order.recipientAddress });
  const { showToast } = useToast();
  const [locating, setLocating] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(order.courierLocationUpdatedAt);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [codeVerified, setCodeVerified] = useState(!!order.deliveryCodeVerifiedAt);
  const [stage, setStageState] = useState(order.deliveryStage);
  const [settingStage, setSettingStage] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [delivered, setDelivered] = useState(false);

  const setStage = async (next: string) => {
    setSettingStage(next);
    const res = await fetch("/api/courier/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, stage: next }),
    });
    setSettingStage(null);
    if (!res.ok) {
      showToast("ثبت وضعیت ناموفق بود.", "error");
      return;
    }
    setStageState(next);
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      showToast("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch("/api/courier/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        setLocating(false);
        if (!res.ok) {
          showToast("ثبت موقعیت ناموفق بود.", "error");
          return;
        }
        setLastSentAt(new Date().toISOString());
        showToast("موقعیت شما ثبت شد.");
      },
      () => {
        setLocating(false);
        showToast("دسترسی به موقعیت مکانی ممکن نشد.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const confirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setConfirming(true);
    const res = await fetch("/api/courier/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, code: code.trim() }),
    });
    setConfirming(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "تأیید کد ناموفق بود.", "error");
      return;
    }

    setCodeVerified(true);
    showToast("کد تأیید شد.");
  };

  const finalizeDelivery = async (signature: Blob) => {
    setFinalizing(true);
    const formData = new FormData();
    formData.append("orderId", order.id);
    formData.append("signature", signature, "signature.png");

    const res = await fetch("/api/courier/finalize-delivery", { method: "POST", body: formData });
    setFinalizing(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "ثبت امضا ناموفق بود.", "error");
      return;
    }

    setDelivered(true);
    showToast("سفارش تحویل داده شد.");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 dir="ltr" className="text-sm font-bold">
          {order.orderNumber}
        </h3>
        <span className="text-xs text-foreground/50">{order.itemCount} قلم کالا</span>
      </div>

      <div className="mb-4 space-y-1">
        <ContactLine label="فرستنده" name={sender.name} phone={sender.phone} />
        <ContactLine label="گیرنده" name={order.customerName} phone={order.customerPhone} />
        <p className="text-sm text-foreground/70">
          آدرس:{" "}
          {order.recipientAddress ? (
            <span className="text-foreground">{order.recipientAddress}</span>
          ) : (
            <span className="text-foreground/40">ثبت نشده</span>
          )}
          {order.recipientPostalCode && (
            <span dir="ltr" className="text-foreground/50">
              {" "}
              — کدپستی: {order.recipientPostalCode}
            </span>
          )}
        </p>
        {mapLinks.google && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <RouteLink
              href={mapLinks.google}
              label="گوگل‌مپ"
              onClick={(e) => {
                e.preventDefault();
                openMapLink("google", order.recipientLat, order.recipientLng, mapLinks);
              }}
            />
            {mapLinks.neshan && (
              <RouteLink
                href={mapLinks.neshan}
                label="نشان"
                onClick={(e) => {
                  e.preventDefault();
                  openMapLink("neshan", order.recipientLat, order.recipientLng, mapLinks);
                }}
              />
            )}
            {mapLinks.balad && (
              <RouteLink
                href={mapLinks.balad}
                label="بلد"
                onClick={(e) => {
                  e.preventDefault();
                  openMapLink("balad", order.recipientLat, order.recipientLng, mapLinks);
                }}
              />
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STAGE_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            disabled={settingStage !== null}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed",
              stage === s
                ? DELIVERY_STAGE[s].className
                : "border-foreground/10 text-foreground/60 hover:border-accent-500/40 hover:text-accent-400",
            )}
          >
            {DELIVERY_STAGE[s].icon}
            {DELIVERY_STAGE[s].label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sendLocation}
          disabled={locating}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MapPin className="size-3.5" />
          {locating ? "در حال ارسال موقعیت..." : "ارسال موقعیت من"}
        </button>
        {lastSentAt && (
          <span className="text-[11px] text-foreground/40">آخرین ارسال: {new Date(lastSentAt).toLocaleTimeString("fa-IR")}</span>
        )}
      </div>

      {delivered ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-400">
          تحویل داده شد ✅
        </p>
      ) : codeVerified ? (
        <SignaturePad onSubmit={finalizeDelivery} submitting={finalizing} />
      ) : (
        <form onSubmit={confirmDelivery} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد تحویل مشتری"
            aria-label="کد تحویل مشتری"
            className={`${inputClass} w-40`}
          />
          <button
            type="submit"
            disabled={confirming || !code.trim()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="size-3.5" />
            {confirming ? "در حال تأیید..." : "تأیید کد"}
          </button>
        </form>
      )}
    </div>
  );
}
