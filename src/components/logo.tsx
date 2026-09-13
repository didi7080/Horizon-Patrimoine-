import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2 3 7v2h18V7l-9-5Zm-7 9v8H4v2h16v-2h-1v-8h-2v8h-3v-6H10v6H7v-8H5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-[17px] text-foreground">
        Artisan<span className="text-brand">RDV</span>
      </span>
    </span>
  );
}
