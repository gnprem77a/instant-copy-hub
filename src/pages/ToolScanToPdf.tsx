import ToolLayout from "@/components/tools/ToolLayout";
import { scanToPdf, triggerDownload } from "@/lib/pdfApi";

const ToolScanToPdf = () => {
  return (
    <ToolLayout
      title="Scan to PDF"
      description="Turn photos or scans of documents into a clean, searchable PDF."
      accept="image/*"
      multiple
      actionLabel="Create PDF from scans"
      helperText="Select one or more images of your document pages."
      onSubmit={async (files) => {
        const { downloadUrl } = await scanToPdf(files, { deskew: true });
        triggerDownload(downloadUrl);
      }}
    />
  );
};

export default ToolScanToPdf;
