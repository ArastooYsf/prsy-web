import Spinner from "@/components/ui/Spinner";

// Generic fallback for routes that don't have a dedicated Skeleton yet (see
// e.g. account/admin/orders/loading.tsx for the richer version) — better
// than an unstyled blank gap during the server round-trip.
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
