import L from "leaflet";

// Next.js's bundler breaks Leaflet's default marker icon asset paths (a
// long-standing, widely-documented react-leaflet/webpack interaction) —
// point them at unpkg instead of the broken relative paths. `_getIconUrl`
// isn't in Leaflet's own public types, hence the cast. Shared by every
// Leaflet map in the app (AddressMapPicker, CourierLocationMap) — import
// this module once per map component, client-side only.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
