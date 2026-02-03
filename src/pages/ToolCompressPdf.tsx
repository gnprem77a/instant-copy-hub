import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { compressPdf, triggerDownload } from "@/lib/pdfApi";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ToolCompressPdf = () => {
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce your PDF file size while keeping it readable and sharable."
      accept="application/pdf"
      multiple={false}
      actionLabel="Compress PDF"
      helperText="Select a single PDF to compress."
      onSubmit={async ([file]) => {
        const { downloadUrl } = await compressPdf(file, { level });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-2">
        <Label>Compression level</Label>
        <RadioGroup
          value={level}
          onValueChange={(value) => setLevel(value as typeof level)}
          className="grid gap-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="low" />
            <span className="text-sm">Low (best quality)</span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="medium" />
            <span className="text-sm">Medium (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="high" />
            <span className="text-sm">High (smallest file)</span>
          </label>
        </RadioGroup>
      </div>
    </ToolLayout>
  );
};

export default ToolCompressPdf;
