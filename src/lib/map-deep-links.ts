// URL formats verified against real sources, not guessed:
// - Google: documented universal cross-platform directions URL.
// - Neshan: nshn.ir destination= (lat,lng) per Neshan's own map-launcher
//   integration (github.com/mattermoran/map_launcher, lib/src/maps/neshan.dart).
// - Balad: balad.ir/directions/driving?destination= (lng,lat — confirmed by
//   matching a real city's known coordinates against Balad's own indexed URL).
// All three are plain https:// universal links (open the installed app via
// Android/iOS app-link handling, fall back to the website otherwise) rather
// than custom URI schemes that fail silently with no app installed.

export type MapLinks = {
  google: string;
  neshan: string | null;
  balad: string | null;
};

export function buildMapLinks({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}): MapLinks {
  if (lat == null || lng == null) {
    return {
      google: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "",
      neshan: null,
      balad: null,
    };
  }

  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    neshan: `https://nshn.ir/?destination=${lat},${lng}`,
    balad: `https://balad.ir/directions/driving?destination=${lng},${lat}`,
  };
}
