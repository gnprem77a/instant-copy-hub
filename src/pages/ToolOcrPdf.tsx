import { useState } from "react";

import ToolLayout from "@/components/tools/ToolLayout";
import { ocrPdf, triggerDownload } from "@/lib/pdfApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ToolOcrPdf = () => {
  const [language, setLanguage] = useState("eng");

  return (
    <ToolLayout
      title="OCR PDF"
      description="Make scanned PDFs searchable by recognizing text (OCR)."
      accept="application/pdf"
      multiple={false}
      actionLabel="Run OCR"
      helperText="Select a scanned PDF to make it searchable."
      onSubmit={async ([file]) => {
        const lang = language.trim() || "eng";
        const { downloadUrl } = await ocrPdf(file, { language: lang });
        triggerDownload(downloadUrl);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="ocr-lang">OCR language (optional)</Label>
        <Input
          id="ocr-lang"
          placeholder="eng, deu, spa..."
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Default is <span className="font-medium">eng</span>. Use 3-letter Tesseract language
          codes.
        </p>
      </div>
    </ToolLayout>
  );
};

export default ToolOcrPdf;
