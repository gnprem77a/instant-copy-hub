import { useMemo, useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { splitPdf, triggerDownload } from "@/lib/pdfApi";
import type { PdfPreviewPage } from "@/lib/pdfApi";
import PdfPageCard from "@/components/tools/PdfPageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

type RangeRow = {
  id: string;
  from: number;
  to: number;
};

function clampPage(value: number, max: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), Math.max(max, 1));
}

const ToolSplit = () => {
  const [pages, setPages] = useState<PdfPreviewPage[]>([]);
  const pageCount = pages.length;

  const [tab, setTab] = useState<"range" | "pages" | "size">("range");
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [mergeAllRanges, setMergeAllRanges] = useState(false);

  const [rangeRows, setRangeRows] = useState<RangeRow[]>([{ id: "range-1", from: 1, to: 3 }]);

  const rangesString = useMemo(() => {
    // Build a backend-compatible comma-separated range string: "1-3,5-7".
    const max = Math.max(pageCount, 1);
    const parts = rangeRows
      .map((r) => {
        const f = clampPage(r.from, max);
        const t = clampPage(r.to, max);
        const from = Math.min(f, t);
        const to = Math.max(f, t);
        return from === to ? String(from) : `${from}-${to}`;
      })
      .filter(Boolean);
    return parts.join(",");
  }, [rangeRows, pageCount]);

  const previewRenderer = useMemo(() => {
    if (tab !== "range") return undefined;
    if (pages.length === 0) return undefined;

    const max = Math.max(pageCount, 1);
    const first = rangeRows[0] ?? { from: 1, to: 1 };
    const from = clampPage(first.from, max);
    const to = clampPage(first.to, max);

    const fromPage = pages.find((p) => p.pageNumber === from);
    const toPage = pages.find((p) => p.pageNumber === to);

    if (!fromPage || !toPage) return undefined;

    return () => (
      <div className="rounded-2xl border border-dashed bg-background/20 p-5">
        <div className="text-center text-sm text-muted-foreground">Range 1</div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)] items-center gap-4">
          <PdfPageCard pageNumber={fromPage.pageNumber} imageUrl={fromPage.imageUrl} className="bg-card/60" />
          <div className="px-2 text-2xl leading-none text-muted-foreground">…</div>
          <PdfPageCard pageNumber={toPage.pageNumber} imageUrl={toPage.imageUrl} className="bg-card/60" />
        </div>
      </div>
    );
  }, [tab, pages, pageCount, rangeRows]);

  return (
    <ToolLayout
      title="Split PDF"
      description="Split a PDF into multiple smaller documents by page range."
      accept="application/pdf"
      multiple={false}
      actionLabel="Split PDF"
      helperText="Select a single PDF to split."
      workspaceLayout="preview-left"
      stickyAction
      onPreviewLoaded={(previewPages) => {
        setPages(previewPages);
        // Reset default range to 1-3 (or 1-last if small doc)
        const max = previewPages.length;
        setRangeRows((prev) => {
          if (prev.length > 0 && prev[0]?.id === "range-1") {
            const first = prev[0];
            return [
              {
                ...first,
                from: 1,
                to: max >= 3 ? 3 : Math.max(max, 1),
              },
              ...prev.slice(1),
            ];
          }
          return [{ id: "range-1", from: 1, to: max >= 3 ? 3 : Math.max(max, 1) }];
        });
      }}
      previewRenderer={previewRenderer}
      onSubmit={async ([file]) => {
        // Tabs other than Range are UI placeholders for now.
        if (tab === "range") {
          const trimmed = rangesString.trim();
          if (trimmed.length > 0) {
            const { downloadUrl } = await splitPdf(file, {
              mode: "ranges",
              ranges: trimmed,
              mergeAllRanges,
            });
            triggerDownload(downloadUrl);
            return;
          }
        }

        const { downloadUrl } = await splitPdf(file, { mode: "all" });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-4">
        <div className="text-center text-2xl font-semibold">Split</div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid h-12 w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="range" className="rounded-xl">
              Range
            </TabsTrigger>
            <TabsTrigger value="pages" className="rounded-xl" disabled>
              Pages
            </TabsTrigger>
            <TabsTrigger value="size" className="rounded-xl" disabled>
              Size
            </TabsTrigger>
          </TabsList>

          <TabsContent value="range" className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Range mode:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={rangeMode === "custom" ? "default" : "secondary"}
                  className="h-11 rounded-2xl"
                  onClick={() => setRangeMode("custom")}
                >
                  Custom ranges
                </Button>
                <Button
                  type="button"
                  variant={rangeMode === "fixed" ? "default" : "secondary"}
                  className="h-11 rounded-2xl"
                  onClick={() => setRangeMode("fixed")}
                  disabled
                >
                  Fixed ranges
                </Button>
              </div>
              {rangeMode === "fixed" && (
                <p className="text-xs text-muted-foreground">Fixed ranges are coming soon.</p>
              )}
            </div>

            <div className="space-y-3">
              {rangeRows.map((r, idx) => (
                <div key={r.id} className="rounded-2xl border bg-background/20">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-semibold">Range {idx + 1}</span>
                    {rangeRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 rounded-xl px-2 text-xs"
                        onClick={() => setRangeRows((prev) => prev.filter((x) => x.id !== r.id))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr,auto,1fr] items-end gap-3 p-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">from page</Label>
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(pageCount, 1)}
                        value={r.from}
                        onChange={(e) =>
                          setRangeRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, from: Number(e.target.value || 1) } : x,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="pb-2 text-xs text-muted-foreground">to</div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">to page</Label>
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(pageCount, 1)}
                        value={r.to}
                        onChange={(e) =>
                          setRangeRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, to: Number(e.target.value || 1) } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-2xl"
                  onClick={() =>
                    setRangeRows((prev) => {
                      const nextIndex = prev.length + 1;
                      const max = Math.max(pageCount, 1);
                      const last = prev[prev.length - 1] ?? { from: 1, to: 1 };
                      const start = clampPage(Math.max(last.from, last.to) + 1, max);
                      const end = clampPage(start + 2, max);
                      return [...prev, { id: `range-${nextIndex}-${Date.now()}`, from: start, to: end }];
                    })
                  }
                >
                  + Add Range
                </Button>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="merge-ranges"
                  checked={mergeAllRanges}
                  onCheckedChange={(v) => setMergeAllRanges(Boolean(v))}
                />
                <div className="space-y-1">
                  <Label htmlFor="merge-ranges" className="text-sm">
                    Merge all ranges in one PDF file.
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, output will be a single PDF (not a ZIP).
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/20 p-4">
              <Label className="text-xs text-muted-foreground">Ranges string (backend)</Label>
              <div className="mt-2 font-mono text-xs text-muted-foreground">{rangesString || "(empty)"}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                If you leave it empty, each page becomes its own PDF inside a ZIP archive.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <p className="text-sm text-muted-foreground">Pages mode is coming soon.</p>
          </TabsContent>

          <TabsContent value="size" className="mt-4">
            <p className="text-sm text-muted-foreground">Size mode is coming soon.</p>
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
};

export default ToolSplit;
