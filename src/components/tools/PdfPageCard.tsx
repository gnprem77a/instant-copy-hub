import type React from "react";
import { cn } from "@/lib/utils";

type PdfPageCardProps = {
  pageNumber: number;
  imageUrl: string;
  /** Optional overlay content rendered on top of the thumbnail. */
  overlay?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
  /** Optional content on the right side of the footer row. */
  footerRight?: React.ReactNode;
};

export default function PdfPageCard({
  pageNumber,
  imageUrl,
  overlay,
  className,
  imageClassName,
  imageStyle,
  footerRight,
}: PdfPageCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-soft-card", className)}>
      <div className="relative overflow-hidden rounded-[14px] border bg-muted">
        <img
          src={imageUrl}
          alt={`Page ${pageNumber} preview`}
          loading="lazy"
          className={cn("h-auto w-full", imageClassName)}
          style={imageStyle}
        />
        {overlay}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
        {footerRight ? <div className="flex items-center gap-2">{footerRight}</div> : null}
      </div>
    </div>
  );
}
