import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePdfPreviewScrollContext } from "@/components/tools/pdfPreviewScrollContext";

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
  const { scrollRoot, rootMargin } = usePdfPreviewScrollContext();
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [imgError, setImgError] = useState(false);

  const alt = useMemo(() => `Page ${pageNumber} preview`, [pageNumber]);

  useEffect(() => {
    setShouldLoad(false);
    setImgError(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!targetRef.current) return;
    if (shouldLoad) return;

    // If IntersectionObserver isn't available, fall back to eager load.
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const el = targetRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            obs.disconnect();
            break;
          }
        }
      },
      {
        root: scrollRoot ?? null,
        rootMargin,
        threshold: 0.01,
      },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRoot, rootMargin, shouldLoad]);

  return (
    <div className={cn("rounded-2xl border bg-card shadow-soft-card", className)}>
      <div className="relative overflow-hidden rounded-[14px] border bg-muted">
        <div ref={targetRef} className="w-full">
          {shouldLoad && !imgError ? (
            <img
              src={imageUrl}
              alt={alt}
              // Keep native lazy-loading too, but it won't matter because src is injected only on-intersection.
              loading="lazy"
              className={cn("h-auto w-full", imageClassName)}
              style={imageStyle}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="aspect-[3/4] w-full animate-pulse bg-muted" aria-label={alt} />
          )}
        </div>
        {overlay}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
        {footerRight ? <div className="flex items-center gap-2">{footerRight}</div> : null}
      </div>
    </div>
  );
}
