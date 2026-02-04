import { useMemo, useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { removePages, triggerDownload, type PdfPreviewPage } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import PdfPageCard from "@/components/tools/PdfPageCard";

function buildRangesString(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }

    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = current;
    prev = current;
  }

  parts.push(start === prev ? String(start) : `${start}-${prev}`);
  return parts.join(",");
}

const ToolRemovePages = () => {
  const [pages, setPages] = useState("");
  const [previewPages, setPreviewPages] = useState<PdfPreviewPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  const selectedSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  const handleTogglePage = (pageNumber: number, extendRange: boolean) => {
    setSelectedPages((prev) => {
      let next = new Set(prev);

      if (extendRange && lastClicked != null) {
        const from = Math.min(lastClicked, pageNumber);
        const to = Math.max(lastClicked, pageNumber);
        for (let p = from; p <= to; p += 1) {
          next.add(p);
        }
      } else {
        if (next.has(pageNumber)) {
          next.delete(pageNumber);
        } else {
          next.add(pageNumber);
        }
      }

      const asArray = Array.from(next);
      setPages(buildRangesString(asArray));
      return asArray;
    });
    setLastClicked(pageNumber);
  };

  return (
    <ToolLayout
      title="Remove pages"
      description="Delete specific pages from your PDF and download a cleaned-up version."
      accept="application/pdf"
      multiple={false}
      actionLabel="Remove pages"
      helperText="Select a single PDF and click on pages to remove them."
      workspaceLayout="preview-left"
      stickyAction
      onPreviewLoaded={(loadedPages) => {
        setPreviewPages(loadedPages);
      }}
      previewCardRenderer={(page) => {
        const isSelected = selectedSet.has(page.pageNumber);
        return (
          <button
            type="button"
            onClick={(e) => handleTogglePage(page.pageNumber, e.shiftKey)}
            className="block w-full text-left"
          >
            <PdfPageCard
              pageNumber={page.pageNumber}
              imageUrl={page.imageUrl}
              className={
                "transition-colors " +
                (isSelected
                  ? "border-destructive/70 bg-destructive/5"
                  : "hover:border-primary/40 hover:bg-primary/5")
              }
            />
          </button>
        );
      }}
      onSubmit={async ([file]) => {
        const trimmed = pages.trim();
        if (!trimmed) {
          toast({
            title: "Pages required",
            description: "Enter the pages you want to remove (for example 1-3,5).",
            variant: "destructive",
          });
          throw new Error("Pages not provided");
        }
        const { downloadUrl } = await removePages(file, trimmed);
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-3">
        {previewPages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Click on pages in the preview to mark them for removal. Total pages: {previewPages.length}.
          </p>
        )}

        <Label htmlFor="remove-pages">Pages to remove</Label>
        <Input
          id="remove-pages"
          placeholder="e.g. 1-3,5"
          value={pages}
          onChange={(event) => setPages(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use commas and ranges. For example, "1-3,5" removes pages 1, 2, 3, and 5.
        </p>
      </div>
    </ToolLayout>
  );
};

export default ToolRemovePages;
