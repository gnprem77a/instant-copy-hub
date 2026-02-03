import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { previewPdf } from "@/lib/pdfApi";
import FileSelectCard from "@/components/tools/FileSelectCard";
import PdfPageCard from "@/components/tools/PdfPageCard";

type ToolLayoutProps = {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  actionLabel: string;
  onSubmit: (files: File[]) => Promise<void>;
  /** Optional small helper text under the file selector. */
  helperText?: string;
  /** Optional extra controls (page ranges, options, etc.). */
  children?:
    | React.ReactNode
    | ((ctx: {
        selectedFiles: File[];
        loading: boolean;
        preview: {
          enabled: boolean;
          loading: boolean;
          error: string | null;
          pages: Array<{ pageNumber: number; imageUrl: string }>;
        };
      }) => React.ReactNode);
  /** Optional override for the Preview panel content. */
  previewRenderer?: (ctx: {
    enabled: boolean;
    loading: boolean;
    error: string | null;
    pages: Array<{ pageNumber: number; imageUrl: string }>;
  }) => React.ReactNode;
  /** Called when a single-PDF preview finishes loading successfully. */
  onPreviewLoaded?: (pages: Array<{ pageNumber: number; imageUrl: string }>) => void;
  /** Called whenever the user selects new files. */
  onFilesChanged?: (files: File[]) => void;
};

const ToolLayout = ({
  title,
  description,
  accept,
  multiple,
  actionLabel,
  onSubmit,
  helperText,
  children,
  previewRenderer,
  onPreviewLoaded,
  onFilesChanged,
}: ToolLayoutProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState<Array<{ pageNumber: number; imageUrl: string }>>([]);

  const canPreviewPdf = useMemo(() => {
    // Only preview when a single PDF is selected.
    return selectedFiles.length === 1 && selectedFiles[0]?.type === "application/pdf";
  }, [selectedFiles]);

  const previewCtx = useMemo(
    () => ({
      enabled: canPreviewPdf,
      loading: previewLoading,
      error: previewError,
      pages: previewPages,
    }),
    [canPreviewPdf, previewLoading, previewError, previewPages],
  );

  const renderedChildren = useMemo(() => {
    if (!children) return null;
    if (typeof children === "function") {
      return children({ selectedFiles, loading, preview: previewCtx });
    }
    return children;
  }, [children, selectedFiles, loading, previewCtx]);

  const defaultPreview = (
    <>
      {!previewCtx.enabled && <p className="text-xs text-muted-foreground">Select a single PDF to see all pages here.</p>}

      {previewCtx.error && <p className="text-xs text-destructive">{previewCtx.error}</p>}

      {previewCtx.enabled && !previewCtx.loading && !previewCtx.error && previewCtx.pages.length > 0 && (
        <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
          {previewCtx.pages.map((p) => (
            <PdfPageCard key={p.pageNumber} pageNumber={p.pageNumber} imageUrl={p.imageUrl} />
          ))}
        </div>
      )}
    </>
  );

  const previewBody = previewRenderer ? previewRenderer(previewCtx) : defaultPreview;

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    onFilesChanged?.(files);
  };

  useEffect(() => {
    if (!canPreviewPdf) {
      setPreviewPages([]);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);

    previewPdf(selectedFiles[0], { signal: controller.signal })
      .then((res) => {
        setPreviewPages(res.pages);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setPreviewPages([]);
        setPreviewError(err instanceof Error ? err.message : "Failed to load preview");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setPreviewLoading(false);
      });

    return () => controller.abort();
  }, [canPreviewPdf, selectedFiles]);

  useEffect(() => {
    if (!onPreviewLoaded) return;
    if (!canPreviewPdf) return;
    if (previewLoading) return;
    if (previewError) return;
    if (previewPages.length === 0) return;
    onPreviewLoaded(previewPages);
  }, [onPreviewLoaded, canPreviewPdf, previewLoading, previewError, previewPages]);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No file selected",
        description: "Please choose at least one file to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await onSubmit(selectedFiles);
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: "We couldn't process your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container max-w-6xl">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground md:text-base">{description}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <section className="rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                 <FileSelectCard
                   selectedCount={selectedFiles.length}
                   disabled={loading}
                   onClick={handleSelectClick}
                   helperText={
                     selectedFiles.length === 0
                       ? helperText || "Choose files from your device to get started."
                       : `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                   }
                 />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  className="hidden"
                  onChange={handleFilesChange}
                />
              </div>

              {renderedChildren && <div className="space-y-3">{renderedChildren}</div>}

              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full rounded-2xl text-sm font-semibold md:text-base"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Processing…" : actionLabel}
                </Button>
              </div>
            </div>
          </section>

          {/* Mobile preview (inline). Desktop stays as a side panel. */}
          <aside className="lg:hidden">
            <div className="rounded-3xl border bg-card p-4 shadow-soft-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Preview</h2>
                {previewLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
              </div>

              <div className="max-h-[45vh] overflow-auto pr-1">{previewBody}</div>
            </div>
          </aside>

          <aside className="hidden lg:block">
            <div className="rounded-3xl border bg-card p-4 shadow-soft-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Preview</h2>
                {previewLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
              </div>

              {previewBody}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default ToolLayout;
