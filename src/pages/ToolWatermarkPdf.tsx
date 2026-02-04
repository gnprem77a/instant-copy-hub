import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { triggerDownload, watermarkPdf } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PdfPageCard from "@/components/tools/PdfPageCard";

function markerPositionClass(pos: string) {
  switch (pos) {
    case "tc":
      return "top-3 left-1/2 -translate-x-1/2";
    case "bc":
      return "bottom-3 left-1/2 -translate-x-1/2";
    case "tr":
      return "top-3 right-3";
    case "tl":
      return "top-3 left-3";
    case "br":
      return "bottom-3 right-3";
    case "bl":
      return "bottom-3 left-3";
    case "c":
    default:
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  }
}

const ToolWatermarkPdf = () => {
  const [text, setText] = useState("CONFIDENTIAL");
  const [position, setPosition] = useState("c");
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);

  return (
    <ToolLayout
      title="Add watermark"
      description="Add a text watermark on top of each page (works even for scanned PDFs)."
      accept="application/pdf"
      multiple={false}
      actionLabel="Add watermark"
      helperText="Select a single PDF to watermark."
      workspaceLayout="preview-left"
      stickyAction
      showFileCard={false}
      previewCardRenderer={(p) => (
        <PdfPageCard
          pageNumber={p.pageNumber}
          imageUrl={p.imageUrl}
          overlay={
            <div
              className={`pointer-events-none absolute ${markerPositionClass(
                position,
              )} flex h-5 w-5 items-center justify-center rounded-full bg-destructive shadow-soft-card`}
            />
          }
        />
      )}
      onSubmit={async ([file]) => {
        const { downloadUrl } = await watermarkPdf(file, { text, position, rotation, fontSize, opacity });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="wm-text">Watermark text</Label>
          <Input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c">Center</SelectItem>
              <SelectItem value="tc">Top center</SelectItem>
              <SelectItem value="bc">Bottom center</SelectItem>
              <SelectItem value="tr">Top right</SelectItem>
              <SelectItem value="tl">Top left</SelectItem>
              <SelectItem value="br">Bottom right</SelectItem>
              <SelectItem value="bl">Bottom left</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wm-rot">Rotation (deg)</Label>
          <Input id="wm-rot" type="number" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wm-size">Font size</Label>
          <Input id="wm-size" type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wm-op">Opacity (0–1)</Label>
          <Input
            id="wm-op"
            type="number"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            min={0}
            max={1}
          />
        </div>
      </div>
    </ToolLayout>
  );
};

export default ToolWatermarkPdf;
