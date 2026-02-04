import { useEffect, useMemo, useRef, useState } from "react";

import PdfPageCard from "@/components/tools/PdfPageCard";
import { previewPdf, type PdfPreviewPage } from "@/lib/pdfApi";
import { PdfPreviewScrollProvider } from "@/components/tools/pdfPreviewScrollContext";
import { cn } from "@/lib/utils";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { Grid, useGridCallbackRef } from "react-window";

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

const CELL_GAP = 16; // px, matches Tailwind gap-4
const MIN_COL_WIDTH = 180; // px, iLovePDF-like density
const MAX_COLS = 5;
const FOOTER_HEIGHT = 40; // px, page label row

export default function PdfPreviewGrid({
  file,
  pages: pagesOverride,
  renderCard,
  emptyHint = DEFAULT_EMPTY_HINT,
  maxHeightClassName = "h-[70vh]",
  onStateChange,
  onLoaded,
}: PdfPreviewGridProps) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [gridApi, setGridApi] = useGridCallbackRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPreviewPage[]>([]);

  const enabled = useMemo(() => {
    if (!file) return false;
    // Some browsers/OSes provide an empty or generic MIME type for PDFs.
    // iLovePDF-style UX should still preview based on filename.
    const t = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    return t.includes("pdf") || name.endsWith(".pdf");
  }, [file]);

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
        console.error("Preview failed", err);
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

  // Keep scrollRootRef in sync with the virtualization scroller element.
  // react-window v2 provides an imperative API with `element` getter.
  scrollRootRef.current = gridApi?.element ?? null;

  type CellProps = {
    pages: PdfPreviewPage[];
    columnCount: number;
    renderCard?: (page: PdfPreviewPage) => React.ReactNode;
    thumbHeight: number;
  };

  const Cell = (
    props: {
      ariaAttributes: { "aria-colindex": number; role: "gridcell" };
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    } & CellProps,
  ): React.ReactElement | null => {
    const { columnIndex, rowIndex, style, pages: cellPages, columnCount, renderCard: cellRenderCard, thumbHeight } = props;
    const idx = rowIndex * columnCount + columnIndex;
    const page = cellPages[idx];
    if (!page) return null;

    // Apply gap by shrinking the rendered cell within the grid's layout.
    const cellStyle: React.CSSProperties = {
      ...style,
      width: (style.width as number) - CELL_GAP,
      height: (style.height as number) - CELL_GAP,
      left: (style.left as number) + CELL_GAP * columnIndex,
      top: (style.top as number) + CELL_GAP * rowIndex,
    };

    return (
      <div style={cellStyle} className="min-w-0">
        {cellRenderCard ? (
          cellRenderCard(page)
        ) : (
          <PdfPageCard
            pageNumber={page.pageNumber}
            imageUrl={page.imageUrl}
            imageStyle={{ height: thumbHeight, objectFit: "cover" }}
          />
        )}
      </div>
    );
  };

  return (
    <PdfPreviewScrollProvider value={{ scrollRoot: scrollRootRef.current, rootMargin: "320px 0px" }}>
      {/*
        Virtualized, iLovePDF-style preview:
        - We still fetch the full page list once via /api/pdf/preview.
        - We do NOT request /previews/* images in bulk: only mounted cells create <img src>,
          so network requests happen progressively while scrolling.
      */}
      <div className={cn("w-full overflow-hidden", maxHeightClassName)}>
        <AutoSizer
          renderProp={({ width, height }) => {
            if (!width || !height) return null;
            const safeWidth = Math.max(1, width);
            const columnCount = Math.min(
              MAX_COLS,
              Math.max(2, Math.floor((safeWidth + CELL_GAP) / (MIN_COL_WIDTH + CELL_GAP))),
            );

            // Compute cell width so columns fill the available width while preserving gap.
            const cellWidth = Math.floor((safeWidth - CELL_GAP * (columnCount - 1)) / columnCount);
            const thumbHeight = Math.round(cellWidth * (4 / 3)); // 3:4 aspect
            const rowHeight = thumbHeight + FOOTER_HEIGHT;
            const rowCount = Math.ceil(displayPages.length / columnCount);

            return (
              <Grid
                gridRef={setGridApi}
                columnCount={columnCount}
                columnWidth={cellWidth + CELL_GAP}
                rowCount={rowCount}
                rowHeight={rowHeight + CELL_GAP}
                cellComponent={Cell}
                cellProps={{ pages: displayPages, columnCount, renderCard, thumbHeight }}
                style={{ height, width: safeWidth }}
                overscanCount={3}
              />
            );
          }}
        />
      </div>
    </PdfPreviewScrollProvider>
  );
}
