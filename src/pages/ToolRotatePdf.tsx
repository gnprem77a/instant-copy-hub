import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { rotatePdf, triggerDownload } from "@/lib/pdfApi";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ToolRotatePdf = () => {
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90);

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate all pages in your PDF by 90°, 180°, or 270°."
      accept="application/pdf"
      multiple={false}
      actionLabel="Rotate PDF"
      helperText="Select a single PDF to rotate."
      onSubmit={async ([file]) => {
        const { downloadUrl } = await rotatePdf(file, { degrees });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-2">
        <Label>Rotation</Label>
        <Select value={String(degrees)} onValueChange={(v) => setDegrees(Number(v) as 90 | 180 | 270)}>
          <SelectTrigger>
            <SelectValue placeholder="Select rotation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90">90° clockwise</SelectItem>
            <SelectItem value="180">180°</SelectItem>
            <SelectItem value="270">270° clockwise</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ToolLayout>
  );
};

export default ToolRotatePdf;
