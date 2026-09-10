import Spinner from "@/components/ui/Spinner";

// Generic loading.tsx fallback for routes that don't have a dedicated
// Skeleton yet — a centered branded spinner instead of an unstyled blank
// gap during the server round-trip. Each such loading.tsx just re-exports
// this.
export default function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
