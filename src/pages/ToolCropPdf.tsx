import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { cropPdf, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ToolCropPdf = () => {
  const [unit, setUnit] = useState<"pt" | "mm" | "cm" | "in">("pt");
  const [description, setDescription] = useState("100");

  return (
    <ToolLayout
      title="Crop PDF"
      description="Crop pages by margins or by a precise box configuration."
      accept="application/pdf"
      multiple={false}
      actionLabel="Crop PDF"
      helperText="Select a single PDF to crop."
      workspaceLayout="preview-left"
      stickyAction
      onSubmit={async ([file]) => {
        const { downloadUrl } = await cropPdf(file, { description: description.trim(), unit });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="grid gap-3 md:grid-cols-[140px,1fr]">
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">pt</SelectItem>
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="in">in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crop-desc">Crop description</Label>
          <Input
            id="crop-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Examples: "100" or "15 10 15" or "[0 0 200 200]"'
          />
          <p className="text-xs text-muted-foreground">
            This maps directly to <span className="font-medium">pdfcpu crop</span>.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ToolCropPdf;
