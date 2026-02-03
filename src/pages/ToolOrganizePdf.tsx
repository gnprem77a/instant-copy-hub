import { useMemo, useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import PdfPageCard from "@/components/tools/PdfPageCard";
import { Button } from "@/components/ui/button";
import { organizePdf, triggerDownload, type OrganizeRotation } from "@/lib/pdfApi";
import { toast } from "@/components/ui/use-toast";

type PageState = {
  pageNumber: number;
  imageUrl: string;
  deleted: boolean;
  rotation: 0 | 90 | 180 | 270;
};

function clampRotation(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((value % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

const ToolOrganizePdf = () => {
  const [pages, setPages] = useState<PageState[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [fileSig, setFileSig] = useState<string>("");

  const rotationPayload: OrganizeRotation[] = useMemo(() => {
    return pages
      .filter((p) => !p.deleted && p.rotation !== 0)
      .map((p) => ({ pageNumber: p.pageNumber, degrees: p.rotation }));
  }, [pages]);

  const orderPayload = useMemo(() => {
    return pages
      .filter((p) => !p.deleted)
      .map((p) => p.pageNumber)
      .join(",");
  }, [pages]);

  return (
    <ToolLayout
      title="Organize PDF"
      description="Reorder, delete, and rotate pages before exporting a cleaned-up PDF."
      accept="application/pdf"
      multiple={false}
      actionLabel="Export organized PDF"
      helperText="Select a single PDF to organize."
      onFilesChanged={(files) => {
        const f = files[0];
        const nextSig = f ? `${f.name}:${f.size}:${f.lastModified}` : "";
        if (nextSig !== fileSig) {
          setFileSig(nextSig);
          setPages([]);
        }
      }}
      onPreviewLoaded={(previewPages) => {
        // Only hydrate once per selected file.
        setPages((prev) => {
          if (prev.length > 0) return prev;
          return previewPages.map((p) => ({
            pageNumber: p.pageNumber,
            imageUrl: p.imageUrl,
            deleted: false,
            rotation: 0,
          }));
        });
      }}
      previewRenderer={(preview) => {
        if (!preview.enabled) {
          return <p className="text-xs text-muted-foreground">Select a single PDF to see all pages here.</p>;
        }
        if (preview.error) {
          return <p className="text-xs text-destructive">{preview.error}</p>;
        }
        if (preview.loading) {
          return <p className="text-xs text-muted-foreground">Rendering preview…</p>;
        }
        if (preview.pages.length === 0) {
          return <p className="text-xs text-muted-foreground">No pages found.</p>;
        }

        return (
          <div className="space-y-3">
            {pages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Drag pages to reorder. Use rotate or delete per page.
              </p>
            )}
            <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
              {pages.map((p) => (
                <div
                  key={p.pageNumber}
                  draggable
                  onDragStart={() => setDragging(p.pageNumber)}
                  onDragEnd={() => setDragging(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragging == null || dragging === p.pageNumber) return;
                    setPages((prev) => {
                      const fromIdx = prev.findIndex((x) => x.pageNumber === dragging);
                      const toIdx = prev.findIndex((x) => x.pageNumber === p.pageNumber);
                      if (fromIdx < 0 || toIdx < 0) return prev;
                      const next = [...prev];
                      const [moved] = next.splice(fromIdx, 1);
                      next.splice(toIdx, 0, moved);
                      return next;
                    });
                  }}
                  className="rounded-2xl border bg-background/30 p-2"
                >
                  <PdfPageCard
                    pageNumber={p.pageNumber}
                    imageUrl={p.imageUrl}
                    className={p.deleted ? "opacity-45" : "opacity-100"}
                    imageStyle={{ transform: `rotate(${p.rotation}deg)` }}
                    footerRight={
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() =>
                            setPages((prev) =>
                              prev.map((x) =>
                                x.pageNumber === p.pageNumber
                                  ? { ...x, rotation: clampRotation(x.rotation - 90) }
                                  : x,
                              ),
                            )
                          }
                        >
                          ⟲
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() =>
                            setPages((prev) =>
                              prev.map((x) =>
                                x.pageNumber === p.pageNumber
                                  ? { ...x, rotation: clampRotation(x.rotation + 90) }
                                  : x,
                              ),
                            )
                          }
                        >
                          ⟳
                        </Button>
                        <Button
                          type="button"
                          variant={p.deleted ? "secondary" : "outline"}
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() =>
                            setPages((prev) =>
                              prev.map((x) =>
                                x.pageNumber === p.pageNumber ? { ...x, deleted: !x.deleted } : x,
                              ),
                            )
                          }
                        >
                          {p.deleted ? "Restore" : "Delete"}
                        </Button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }}
      onSubmit={async ([file]) => {
        if (pages.length === 0) {
          toast({
            title: "Select a PDF",
            description: "Choose a PDF first so we can load its pages.",
            variant: "destructive",
          });
          throw new Error("No pages loaded");
        }
        if (!orderPayload) {
          toast({
            title: "No pages selected",
            description: "You deleted every page. Restore at least one page to export.",
            variant: "destructive",
          });
          throw new Error("No pages selected");
        }
        const { downloadUrl } = await organizePdf(file, { order: orderPayload, rotations: rotationPayload });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Preview and controls are on the right. Reorder pages by dragging, rotate per page, or delete pages.
        </p>

        {pages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {pages.filter((p) => !p.deleted).length} page(s) will be exported
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setPages((prev) => prev.map((p) => ({ ...p, deleted: false, rotation: 0 })))}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ToolOrganizePdf;
