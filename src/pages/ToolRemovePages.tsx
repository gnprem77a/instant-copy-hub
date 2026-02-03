import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { removePages, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const ToolRemovePages = () => {
  const [pages, setPages] = useState("");

  return (
    <ToolLayout
      title="Remove pages"
      description="Delete specific pages from your PDF and download a cleaned-up version."
      accept="application/pdf"
      multiple={false}
      actionLabel="Remove pages"
      helperText="Select a single PDF and specify which pages to remove."
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
      <div className="space-y-1">
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
