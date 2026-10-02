"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-setup";
import { Crosshair } from "lucide-react";
import { reverseGeocode, type ReverseGeocodeResult } from "@/lib/geocoding";
import { useToast } from "@/components/ToastProvider";

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

export type LocateResult = { lat: number; lng: number } & ReverseGeocodeResult;

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer's center/zoom props only apply on first render (react-leaflet
// is uncontrolled past that) — re-centering on a later pick needs the map
// instance directly, via this child-of-MapContainer hook.
function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

// Owns only the map/marker/GPS button — reports the picked point and its
// reverse-geocoded address back to the parent via onLocate. The parent
// (SavedContactPicker) owns the actual form fields, pre-filling them from
// this but leaving them editable, per spec.
export default function AddressMapPicker({ onLocate }: { onLocate: (result: LocateResult) => void }) {
  const { showToast } = useToast();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handlePick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setGeocoding(true);
    const result = await reverseGeocode(lat, lng);
    setGeocoding(false);
    onLocate({
      lat,
      lng,
      province: result?.province ?? "",
      city: result?.city ?? "",
      street: result?.street ?? "",
      postalCode: result?.postalCode ?? "",
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handlePick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        showToast("دسترسی به موقعیت مکانی ممکن نشد. می‌توانید مستقیماً روی نقشه کلیک کنید.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-foreground/10">
        <MapContainer center={TEHRAN_CENTER} zoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onPick={handlePick} />
          <FlyTo position={position} />
          {position && <Marker position={position} />}
        </MapContainer>
        {geocoding && (
          <div className="absolute inset-x-0 bottom-0 bg-background/90 px-3 py-1.5 text-center text-[11px] text-foreground/60">
            در حال یافتن آدرس...
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="flex items-center gap-1.5 text-xs font-semibold text-accent-400 transition-colors hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Crosshair className="size-3.5" />
        {locating ? "در حال یافتن موقعیت..." : "استفاده از موقعیت من"}
      </button>
      <p className="text-[11px] text-foreground/40">یا مستقیماً روی نقشه کلیک کنید.</p>
    </div>
  );
}
