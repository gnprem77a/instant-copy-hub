import { useEffect, useMemo, useRef, useState } from "react";

import PdfPageCard from "@/components/tools/PdfPageCard";
import { previewPdf, type PdfPreviewPage } from "@/lib/pdfApi";
import { PdfPreviewScrollProvider } from "@/components/tools/pdfPreviewScrollContext";

export type PdfPreviewState = {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  pages: PdfPreviewPage[];
};

type PdfPreviewGridProps = {
  /** When provided, the grid will fetch pages via POST /api/pdf/preview. */
  file: File | null;
  /** Optional pages override (useful for tools that reorder/delete/rotate). */
  pages?: PdfPreviewPage[];
  /** Optional custom card renderer per page. */
  renderCard?: (page: PdfPreviewPage) => React.ReactNode;
  /** Optional hint shown when there is no previewable PDF. */
  emptyHint?: string;
  /** Control scroll height per container (mobile vs desktop). */
  maxHeightClassName?: string;
  /** Notifies parent of current preview state (enabled/loading/error/pages). */
  onStateChange?: (state: PdfPreviewState) => void;
  /** Fires when the preview fetch returns successfully (pages from backend). */
  onLoaded?: (pages: PdfPreviewPage[]) => void;
};

const DEFAULT_EMPTY_HINT = "Select a PDF to see all pages here.";

export default function PdfPreviewGrid({
  file,
  pages: pagesOverride,
  renderCard,
  emptyHint = DEFAULT_EMPTY_HINT,
  maxHeightClassName = "max-h-[70vh]",
  onStateChange,
  onLoaded,
}: PdfPreviewGridProps) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPreviewPage[]>([]);

  const enabled = useMemo(() => !!file && file.type === "application/pdf", [file]);

  const displayPages = pagesOverride ?? pages;

  useEffect(() => {
    onStateChange?.({ enabled, loading, error, pages: displayPages });
  }, [enabled, loading, error, displayPages, onStateChange]);

  useEffect(() => {
    if (!enabled || !file) {
      setPages([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    previewPdf(file, { signal: controller.signal })
      .then((res) => {
        setPages(res.pages);
        onLoaded?.(res.pages);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setPages([]);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, file, onLoaded]);

  if (!enabled) {
    return <p className="text-xs text-muted-foreground">{emptyHint}</p>;
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground">Rendering preview…</p>;
  }

  if (displayPages.length === 0) {
    return <p className="text-xs text-muted-foreground">No pages found.</p>;
  }

  return (
    <PdfPreviewScrollProvider value={{ scrollRoot: scrollRootRef.current, rootMargin: "320px 0px" }}>
      <div ref={scrollRootRef} className={`${maxHeightClassName} overflow-auto pr-1`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {displayPages.map((p) => (
            <div key={p.pageNumber} className="min-w-0">
              {renderCard ? renderCard(p) : <PdfPageCard pageNumber={p.pageNumber} imageUrl={p.imageUrl} />}
            </div>
          ))}
        </div>
      </div>
    </PdfPreviewScrollProvider>
  );
}
