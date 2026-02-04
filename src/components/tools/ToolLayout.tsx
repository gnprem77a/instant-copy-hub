import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { PdfPreviewPage } from "@/lib/pdfApi";
import FileSelectCard from "@/components/tools/FileSelectCard";
import PdfPreviewGrid, { type PdfPreviewState } from "@/components/tools/PdfPreviewGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ToolLayoutProps = {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  actionLabel: string;
  onSubmit: (files: File[]) => Promise<void>;
  /** Workspace layout after file selection. */
  workspaceLayout?: "options-left" | "preview-left";
  /** Make the main action button sticky (bottom) inside the options panel. */
  stickyAction?: boolean;
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
          pages: PdfPreviewPage[];
        };
      }) => React.ReactNode);
  /** Optional override for the Preview panel content. */
  previewRenderer?: (ctx: {
    enabled: boolean;
    loading: boolean;
    error: string | null;
    pages: PdfPreviewPage[];
  }) => React.ReactNode;
  /** Optional per-page renderer for the shared preview grid. */
  previewCardRenderer?: (page: PdfPreviewPage) => React.ReactNode;
  /** Optional override of pages displayed in the preview grid (e.g. Organize reorder/delete). */
  previewPagesOverride?: PdfPreviewPage[];
  /** Called when a single-PDF preview finishes loading successfully. */
  onPreviewLoaded?: (pages: PdfPreviewPage[]) => void;
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
  workspaceLayout = "options-left",
  stickyAction = false,
  helperText,
  children,
  previewRenderer,
  previewCardRenderer,
  previewPagesOverride,
  onPreviewLoaded,
  onFilesChanged,
}: ToolLayoutProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  const [previewState, setPreviewState] = useState<PdfPreviewState>({
    enabled: false,
    loading: false,
    error: null,
    pages: [],
  });

  const previewFile = useMemo(() => {
    if (selectedFiles.length === 0) return null;
    const idx = Math.min(Math.max(previewFileIndex, 0), selectedFiles.length - 1);
    return selectedFiles[idx] ?? null;
  }, [selectedFiles, previewFileIndex]);

  const previewCtx = useMemo(
    () => ({
      enabled: previewState.enabled,
      loading: previewState.loading,
      error: previewState.error,
      pages: previewPagesOverride ?? previewState.pages,
    }),
    [previewState, previewPagesOverride],
  );

  const renderedChildren = useMemo(() => {
    if (!children) return null;
    if (typeof children === "function") {
      return children({ selectedFiles, loading, preview: previewCtx });
    }
    return children;
  }, [children, selectedFiles, loading, previewCtx]);

  const defaultPreview = (
    <div className="space-y-3">
      {selectedFiles.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Preview file</p>
          <Select
            value={String(previewFileIndex)}
            onValueChange={(v) => setPreviewFileIndex(Number(v))}
          >
            <SelectTrigger className="h-9 rounded-2xl">
              <SelectValue placeholder="Choose a file" />
            </SelectTrigger>
            <SelectContent>
              {selectedFiles.map((f, idx) => (
                <SelectItem key={`${f.name}:${f.size}:${f.lastModified}:${idx}`} value={String(idx)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <PdfPreviewGrid
        file={previewFile}
        pages={previewPagesOverride}
        renderCard={previewCardRenderer}
        emptyHint={selectedFiles.length === 0 ? "Select a PDF to see all pages here." : "Select a PDF file to preview."}
          maxHeightClassName="h-[70vh]"
        onStateChange={setPreviewState}
        onLoaded={onPreviewLoaded}
      />
    </div>
  );

  const previewBody = previewRenderer ? previewRenderer(previewCtx) : defaultPreview;

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const applyFiles = (files: File[]) => {
    setSelectedFiles(files);
    setPreviewFileIndex(0);
    onFilesChanged?.(files);
  };

  const handleFilesChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    applyFiles(files);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (loading) return;
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length === 0) return;
    applyFiles(multiple ? files : [files[0]]);
  };

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

  const isEmpty = selectedFiles.length === 0;

  return (
    <main className="bg-background pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container max-w-6xl">
        {isEmpty ? (
          <section
            className="min-h-[62vh]"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (loading) return;
              setIsDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (loading) return;
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-2 text-center">
              <header className="mb-8 space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
                <p className="text-base text-muted-foreground md:text-lg">{description}</p>
              </header>

              <div
                className={
                  "w-full rounded-[2.25rem] border bg-card/40 p-7 shadow-soft-card backdrop-blur md:p-10 " +
                  (isDragOver ? "ring-glow-primary border-primary/45" : "")
                }
              >
                <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                  <Button
                    type="button"
                    size="lg"
                    className="h-14 w-full max-w-md rounded-2xl text-base font-semibold md:h-16 md:text-lg"
                    onClick={handleSelectClick}
                    disabled={loading}
                  >
                    {multiple ? "Select PDF files" : "Select PDF file"}
                  </Button>
                  <p className="text-sm text-muted-foreground">or drop PDF here</p>
                  {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleFilesChange}
              />
            </div>
          </section>
        ) : (
          <>
            <header className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
              <p className="text-sm text-muted-foreground md:text-base">{description}</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
              {/* Desktop (lg+) main two-column workspace */}
              <div className="hidden lg:contents">
                {workspaceLayout === "preview-left" ? (
                  <>
                    <section className="rounded-3xl border bg-card p-4 shadow-soft-card">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Preview</h2>
                        {previewCtx.loading && <span className="text-xs text-muted-foreground">Loading…</span>}
                      </div>
                      {previewBody}
                    </section>

                    <aside className="rounded-3xl border bg-card p-6 shadow-soft-card">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <FileSelectCard
                            selectedCount={selectedFiles.length}
                            disabled={loading}
                            onClick={handleSelectClick}
                            helperText={`${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`}
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

                        <div className={stickyAction ? "sticky bottom-4 pt-2" : "pt-2"}>
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
                    </aside>
                  </>
                ) : (
                  <>
                    <section className="rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <FileSelectCard
                            selectedCount={selectedFiles.length}
                            disabled={loading}
                            onClick={handleSelectClick}
                            helperText={`${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`}
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

                        <div className={stickyAction ? "sticky bottom-4 pt-2" : "pt-2"}>
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

                    <aside className="rounded-3xl border bg-card p-4 shadow-soft-card">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Preview</h2>
                        {previewCtx.loading && <span className="text-xs text-muted-foreground">Loading…</span>}
                      </div>

                      {previewBody}
                    </aside>
                  </>
                )}
              </div>

              {/* Mobile preview (inline). */}
              <section className="lg:hidden rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FileSelectCard
                      selectedCount={selectedFiles.length}
                      disabled={loading}
                      onClick={handleSelectClick}
                      helperText={`${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`}
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

                  <div className={stickyAction ? "sticky bottom-4 pt-2" : "pt-2"}>
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

              <aside className="lg:hidden">
                <div className="rounded-3xl border bg-card p-4 shadow-soft-card">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Preview</h2>
                    {previewCtx.loading && <span className="text-xs text-muted-foreground">Loading…</span>}
                  </div>

                  <div className="max-h-[45vh] overflow-auto pr-1">
                    {previewRenderer ? (
                      previewBody
                    ) : (
                      <PdfPreviewGrid
                        file={previewFile}
                        pages={previewPagesOverride}
                        renderCard={previewCardRenderer}
                        emptyHint={
                          selectedFiles.length === 0 ? "Select a PDF to see all pages here." : "Select a PDF file to preview."
                        }
                        maxHeightClassName="h-[45vh]"
                        onStateChange={setPreviewState}
                        onLoaded={onPreviewLoaded}
                      />
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ToolLayout;
