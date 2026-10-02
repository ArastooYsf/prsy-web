"use client";

import dynamic from "next/dynamic";
import { Truck, Phone } from "lucide-react";

// Leaflet touches `window` at import time — same ssr:false pattern
// SavedContactPicker.tsx uses for AddressMapPicker.
const CourierLocationMap = dynamic(() => import("@/components/account/CourierLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-lg border border-foreground/10 text-xs text-foreground/40">
      در حال بارگذاری نقشه...
    </div>
  ),
});

type ShippingTrackerProps = {
  orderId: string;
  courierName: string | null;
  courierPhone: string | null;
  courierLat: number | null;
  courierLng: number | null;
  courierLocationUpdatedAt: string | null;
  deliveryCode: string | null;
};

export default function ShippingTracker({
  orderId,
  courierName,
  courierPhone,
  courierLat,
  courierLng,
  courierLocationUpdatedAt,
  deliveryCode,
}: ShippingTrackerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Truck className="size-4 text-accent-400" />
        <h3 className="text-sm font-bold">در حال ارسال</h3>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-foreground/70">
          پیک: <span className="font-medium text-foreground">{courierName ?? "—"}</span>
        </p>
        {courierPhone && (
          <a
            href={`tel:${courierPhone}`}
            dir="ltr"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-accent-400 transition-colors hover:border-accent-500/40"
          >
            <Phone className="size-3.5" />
            {courierPhone}
          </a>
        )}
      </div>

      {courierLat != null && courierLng != null && courierLocationUpdatedAt ? (
        <CourierLocationMap
          orderId={orderId}
          initialLat={courierLat}
          initialLng={courierLng}
          initialUpdatedAt={courierLocationUpdatedAt}
        />
      ) : (
        <p className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-xs text-foreground/50">
          موقعیت پیک هنوز ثبت نشده است.
        </p>
      )}

      {deliveryCode && (
        <div className="mt-5 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 text-center">
          <p className="mb-1 text-xs text-foreground/60">کد تحویل</p>
          <p dir="ltr" className="text-2xl font-bold tracking-widest text-accent-400">
            {deliveryCode}
          </p>
          <p className="mt-1 text-[11px] text-foreground/50">این کد را هنگام تحویل به پیک بگویید یا نشان دهید.</p>
        </div>
      )}
    </div>
  );
}
