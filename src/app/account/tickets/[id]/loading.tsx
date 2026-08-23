import Skeleton from "react-loading-skeleton";
import TicketChatSkeleton from "@/components/TicketChatSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Skeleton width={200} height={20} />
        <Skeleton width={72} height={22} borderRadius={9999} />
      </div>

      <TicketChatSkeleton />
    </div>
  );
}
