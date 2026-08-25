import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HREF = "/consultation";

export function ConsultationCtaButton({
  size,
  className,
  fullWidth,
  onNavigate,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
  fullWidth?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Button size={size} className={cn(fullWidth && "w-full", className)} asChild>
      <Link href={HREF} onClick={onNavigate}>
        درخواست مشاوره
      </Link>
    </Button>
  );
}
