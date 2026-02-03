import { cn } from "@/lib/utils";

type FileSelectCardProps = {
  selectedCount: number;
  helperText: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

const FileSelectCard = ({
  selectedCount,
  helperText,
  disabled,
  onClick,
  className,
}: FileSelectCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group w-full rounded-3xl border bg-card/55 p-5 text-left shadow-editorial backdrop-blur transition",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0",
        className,
      )}
      aria-label={selectedCount > 0 ? "Change selected files" : "Select files"}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold md:text-base">
            {selectedCount > 0 ? "Change file(s)" : "Select file(s)"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">{helperText}</p>
        </div>
        <span className="shrink-0 rounded-full border border-dashed bg-background px-3 py-1 text-xs font-medium text-primary transition group-hover:border-primary/60 group-hover:bg-primary/5">
          {selectedCount > 0 ? `${selectedCount} selected` : "Browse"}
        </span>
      </div>
    </button>
  );
};

export default FileSelectCard;
