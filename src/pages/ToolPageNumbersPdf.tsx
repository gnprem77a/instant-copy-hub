import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { addPageNumbersPdf, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PdfPageCard from "@/components/tools/PdfPageCard";

function overlayClassForPosition(pos: string) {
  // Matches the 6-position selector (tl/tc/tr/bl/bc/br) used by the backend.
  switch (pos) {
    case "tl":
      return "top-2 left-2";
    case "tc":
      return "top-2 left-1/2 -translate-x-1/2";
    case "tr":
      return "top-2 right-2";
    case "bl":
      return "bottom-2 left-2";
    case "br":
      return "bottom-2 right-2";
    case "bc":
    default:
      return "bottom-2 left-1/2 -translate-x-1/2";
  }
}

const ToolPageNumbersPdf = () => {
  const [position, setPosition] = useState("bc");
  const [fontSize, setFontSize] = useState(10);
  const [opacity, setOpacity] = useState(0.95);
  const [startAt, setStartAt] = useState(1);

  return (
    <ToolLayout
      title="Add page numbers"
      description="Add consistent page numbers to every page."
      accept="application/pdf"
      multiple={false}
      actionLabel="Add page numbers"
      helperText="Select a single PDF to add numbering."
      onSubmit={async ([file]) => {
        const { downloadUrl } = await addPageNumbersPdf(file, { position, fontSize, opacity, startAt });
        triggerDownload(downloadUrl);
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
          <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
            {preview.pages.map((p) => {
              const label = String(startAt + (p.pageNumber - 1));
              return (
                <PdfPageCard
                  key={p.pageNumber}
                  pageNumber={p.pageNumber}
                  imageUrl={p.imageUrl}
                  overlay={
                    <div
                      className={
                        "pointer-events-none absolute " +
                        overlayClassForPosition(position) +
                        " rounded-md bg-background/70 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur"
                      }
                      style={{ opacity }}
                    >
                      <span style={{ fontSize: Math.max(10, Math.min(20, fontSize)) }}>{label}</span>
                    </div>
                  }
                />
              );
            })}
          </div>
        );
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("tl")}
        >
          Header left
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("tc")}
        >
          Header center
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("tr")}
        >
          Header right
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("bl")}
        >
          Footer left
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("bc")}
        >
          Footer center
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          onClick={() => setPosition("br")}
        >
          Footer right
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bc">Bottom center</SelectItem>
              <SelectItem value="bl">Bottom left</SelectItem>
              <SelectItem value="br">Bottom right</SelectItem>
              <SelectItem value="tc">Top center</SelectItem>
              <SelectItem value="tl">Top left</SelectItem>
              <SelectItem value="tr">Top right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-start">Start at</Label>
          <Input
            id="pn-start"
            type="number"
            value={startAt}
            onChange={(e) => setStartAt(Number(e.target.value))}
            min={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-size">Font size</Label>
          <Input
            id="pn-size"
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            min={6}
            max={48}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-op">Opacity (0–1)</Label>
          <Input
            id="pn-op"
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

export default ToolPageNumbersPdf;
