import ToolLayout from "@/components/tools/ToolLayout";
import { repairPdf, triggerDownload } from "@/lib/pdfApi";

const ToolRepairPdf = () => {
  return (
    <ToolLayout
      title="Repair PDF"
      description="Try to fix a PDF that won't open, prints incorrectly, or shows errors."
      accept="application/pdf"
      multiple={false}
      actionLabel="Repair PDF"
      helperText="Select a single PDF to repair."
      onSubmit={async ([file]) => {
        const { downloadUrl } = await repairPdf(file);
        triggerDownload(downloadUrl);
      }}
    />
  );
};

export default ToolRepairPdf;
