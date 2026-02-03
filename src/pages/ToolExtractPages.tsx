import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { extractPages, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ToolExtractPages = () => {
  const [ranges, setRanges] = useState("");

  return (
    <ToolLayout
      title="Extract pages"
      description="Pull out specific pages or ranges into a new PDF, or download every page as separate files."
      accept="application/pdf"
      multiple={false}
      actionLabel="Extract pages"
      helperText="Select a single PDF to extract from."
      onSubmit={async ([file]) => {
        const trimmed = ranges.trim();
        if (trimmed.length > 0) {
          const { downloadUrl } = await extractPages(file, { mode: "ranges", ranges: trimmed });
          triggerDownload(downloadUrl);
        } else {
          const { downloadUrl } = await extractPages(file, { mode: "all" });
          triggerDownload(downloadUrl);
        }
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="extract-ranges">Page ranges (optional)</Label>
        <Input
          id="extract-ranges"
          placeholder="e.g. 1-3,5 — leave empty to extract ALL pages as a ZIP"
          value={ranges}
          onChange={(event) => setRanges(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          When you specify ranges, the result is a single PDF. When left empty, each page is exported
          and bundled into a ZIP.
        </p>
      </div>
    </ToolLayout>
  );
};

export default ToolExtractPages;
