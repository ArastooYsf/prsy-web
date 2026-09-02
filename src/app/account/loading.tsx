import Spinner from "@/components/ui/Spinner";

// Generic fallback for the account dashboard route — no dedicated Skeleton
// here yet, so a branded spinner beats an unstyled blank gap.
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
