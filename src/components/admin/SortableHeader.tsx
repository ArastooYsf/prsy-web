"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortableHeaderProps = {
  field: string;
  label: string;
};

export default function SortableHeader({ field, label }: SortableHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentField = searchParams.get("sort");
  const currentDir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const active = currentField === field;

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("dir", active && currentDir === "asc" ? "desc" : "asc");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button type="button" onClick={handleClick} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      <Icon className={`size-3.5 ${active ? "text-accent-400" : "text-foreground/30"}`} />
    </button>
  );
}
