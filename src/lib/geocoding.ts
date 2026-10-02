export type ReverseGeocodeResult = {
  province: string;
  city: string;
  street: string;
  postalCode: string;
};

// OpenStreetMap's Nominatim — no API key, usable today. Its usage policy
// (operations.osmfoundation.org/policies/nominatim) caps the public
// instance at 1 request/second and explicitly discourages relying on it
// for commercial production traffic without self-hosting; accepted
// knowingly for now since the alternative (Neshan, the Iran market
// standard) needs an API key only the site owner can obtain by signing up
// at platform.neshan.org. This is the one function to change if/when that
// happens — Neshan's reverse endpoint is `GET api.neshan.org/v5/reverse`
// (header `Api-Key`, params `lat`/`lng`), with response fields `state`
// (province), `city`, `route_name` (street), and no postal code at all.
//
// Called directly from the browser rather than proxied through our own
// API — the browser's own Referer header satisfies Nominatim's
// identification requirement, and proxying would mean reimplementing their
// rate-limit/caching requirements ourselves for no benefit here.
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fa`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const address = data?.address;
  if (!address) return null;

  return {
    province: address.state ?? "",
    // Small towns/villages don't get the `city` key from Nominatim — fall
    // back through the next-closest equivalents it does use.
    city: address.city ?? address.town ?? address.village ?? "",
    street: address.road ?? "",
    postalCode: address.postcode ?? "",
  };
}
