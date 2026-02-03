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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
