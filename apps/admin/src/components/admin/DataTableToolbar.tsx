import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  count?: number;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  search,
  onSearch,
  placeholder = "Search…",
  count,
  children,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-[280px] pl-8"
        />
      </div>
      {children}
      {typeof count === "number" && (
        <span className="ml-auto text-xs text-muted-foreground">
          {count} {count === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
}
