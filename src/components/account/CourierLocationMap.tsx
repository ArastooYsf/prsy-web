"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-setup";
import { timeAgoFa } from "@/lib/format-number";

const POLL_INTERVAL_MS = 20000;

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position);
  }, [position, map]);
  return null;
}

export default function CourierLocationMap({
  orderId,
  initialLat,
  initialLng,
  initialUpdatedAt,
}: {
  orderId: string;
  initialLat: number;
  initialLng: number;
  initialUpdatedAt: string;
}) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/account/orders/${orderId}/courier-location`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status !== "SHIPPED") {
        clearInterval(interval);
        return;
      }
      if (typeof data.lat === "number" && typeof data.lng === "number") {
        setPosition([data.lat, data.lng]);
        setUpdatedAt(data.updatedAt);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="space-y-1.5">
      <div className="h-56 w-full overflow-hidden rounded-lg border border-foreground/10">
        <MapContainer center={position} zoom={14} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo position={position} />
          <Marker position={position} />
        </MapContainer>
      </div>
      <p className="text-[11px] text-foreground/40">آخرین به‌روزرسانی موقعیت: {timeAgoFa(updatedAt)}</p>
    </div>
  );
}
