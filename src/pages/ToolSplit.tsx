import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { splitPdf, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ToolSplit = () => {
  const [ranges, setRanges] = useState("");

  return (
    <ToolLayout
      title="Split PDF"
      description="Split a PDF into multiple smaller documents by page range."
      accept="application/pdf"
      multiple={false}
      actionLabel="Split PDF"
      helperText="Select a single PDF to split."
      onSubmit={async ([file]) => {
        const trimmed = ranges.trim();
        if (trimmed.length > 0) {
          const { downloadUrl } = await splitPdf(file, { mode: "ranges", ranges: trimmed });
          triggerDownload(downloadUrl);
        } else {
          const { downloadUrl } = await splitPdf(file, { mode: "all" });
          triggerDownload(downloadUrl);
        }
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="split-ranges">Page ranges (optional)</Label>
        <Input
          id="split-ranges"
          placeholder="e.g. 1-3,5,8-10 — leave empty to split all pages"
          value={ranges}
          onChange={(event) => setRanges(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          When left empty, each page will become its own PDF inside a ZIP archive.
        </p>
      </div>
    </ToolLayout>
  );
};

export default ToolSplit;
