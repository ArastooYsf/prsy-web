import Skeleton from "react-loading-skeleton";
import TicketChatSkeleton from "@/components/TicketChatSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton width={200} height={20} />
          <Skeleton width={130} height={12} containerClassName="block mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={140} height={40} borderRadius={8} />
          <Skeleton width={40} height={40} borderRadius={9999} />
        </div>
      </div>

      <TicketChatSkeleton />
    </div>
  );
}
