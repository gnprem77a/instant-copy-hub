import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ToolMerge from "./pages/ToolMerge";
import ToolSplit from "./pages/ToolSplit";
import ToolRemovePages from "./pages/ToolRemovePages";
import ToolExtractPages from "./pages/ToolExtractPages";
import ToolScanToPdf from "./pages/ToolScanToPdf";
import ToolImageToPdf from "./pages/ToolImageToPdf";
import ToolWordToPdf from "./pages/ToolWordToPdf";
import ToolCompressPdf from "./pages/ToolCompressPdf";
import ToolRepairPdf from "./pages/ToolRepairPdf";
import ToolOcrPdf from "./pages/ToolOcrPdf";
import ToolOrganizePdf from "./pages/ToolOrganizePdf";
import ToolRotatePdf from "./pages/ToolRotatePdf";
import ToolCropPdf from "./pages/ToolCropPdf";
import ToolPageNumbersPdf from "./pages/ToolPageNumbersPdf";
import ToolWatermarkPdf from "./pages/ToolWatermarkPdf";
import ToolProtectPdf from "./pages/ToolProtectPdf";
import ToolUnlockPdf from "./pages/ToolUnlockPdf";
import ToolRedactPdf from "./pages/ToolRedactPdf";
import ToolFlattenPdf from "./pages/ToolFlattenPdf";
import ToolPdfToWord from "./pages/ToolPdfToWord";
import ToolPdfToExcel from "./pages/ToolPdfToExcel";
import ToolPdfToPowerPoint from "./pages/ToolPdfToPowerPoint";
import ToolPdfToJpg from "./pages/ToolPdfToJpg";
import ToolPdfToHtml from "./pages/ToolPdfToHtml";
import ToolExtractText from "./pages/ToolExtractText";
import ToolExtractImages from "./pages/ToolExtractImages";
import ToolHtmlToPdf from "./pages/ToolHtmlToPdf";
import ToolExcelToPdf from "./pages/ToolExcelToPdf";
import ToolPowerPointToPdf from "./pages/ToolPowerPointToPdf";
import ToolComparePdfs from "./pages/ToolComparePdfs";
import ToolDigitalSignature from "./pages/ToolDigitalSignature";
import ToolValidatePdfa from "./pages/ToolValidatePdfa";
import ToolAddHeaderFooter from "./pages/ToolAddHeaderFooter";
import ToolPreviewPdf from "./pages/ToolPreviewPdf";
import ToolConvertToPdfa from "./pages/ToolConvertToPdfa";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/merge" element={<ToolMerge />} />
          <Route path="/tools/split" element={<ToolSplit />} />
          <Route path="/tools/remove-pages" element={<ToolRemovePages />} />
          <Route path="/tools/extract" element={<ToolExtractPages />} />
          <Route path="/tools/scan-to-pdf" element={<ToolScanToPdf />} />
          <Route path="/tools/image-to-pdf" element={<ToolImageToPdf />} />
          <Route path="/tools/word-to-pdf" element={<ToolWordToPdf />} />
          <Route path="/tools/compress" element={<ToolCompressPdf />} />
          <Route path="/tools/repair" element={<ToolRepairPdf />} />
          <Route path="/tools/ocr" element={<ToolOcrPdf />} />
          <Route path="/tools/organize" element={<ToolOrganizePdf />} />
          <Route path="/tools/rotate" element={<ToolRotatePdf />} />
          <Route path="/tools/crop" element={<ToolCropPdf />} />
          <Route path="/tools/page-numbers" element={<ToolPageNumbersPdf />} />
          <Route path="/tools/watermark" element={<ToolWatermarkPdf />} />
          <Route path="/tools/protect" element={<ToolProtectPdf />} />
          <Route path="/tools/unlock" element={<ToolUnlockPdf />} />
          <Route path="/tools/redact" element={<ToolRedactPdf />} />
          <Route path="/tools/flatten" element={<ToolFlattenPdf />} />
          <Route path="/tools/pdf-to-word" element={<ToolPdfToWord />} />
          <Route path="/tools/pdf-to-excel" element={<ToolPdfToExcel />} />
          <Route path="/tools/pdf-to-powerpoint" element={<ToolPdfToPowerPoint />} />
          <Route path="/tools/pdf-to-jpg" element={<ToolPdfToJpg />} />
          <Route path="/tools/pdf-to-html" element={<ToolPdfToHtml />} />
          <Route path="/tools/extract-text" element={<ToolExtractText />} />
          <Route path="/tools/extract-images" element={<ToolExtractImages />} />
          <Route path="/tools/html-to-pdf" element={<ToolHtmlToPdf />} />
          <Route path="/tools/excel-to-pdf" element={<ToolExcelToPdf />} />
          <Route path="/tools/powerpoint-to-pdf" element={<ToolPowerPointToPdf />} />
          <Route path="/tools/compare" element={<ToolComparePdfs />} />
          <Route path="/tools/digital-signature" element={<ToolDigitalSignature />} />
          <Route path="/tools/validate-pdfa" element={<ToolValidatePdfa />} />
          <Route path="/tools/header-footer" element={<ToolAddHeaderFooter />} />
          <Route path="/tools/preview" element={<ToolPreviewPdf />} />
          <Route path="/tools/convert-to-pdfa" element={<ToolConvertToPdfa />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
