import ToolLayout from "@/components/tools/ToolLayout";
import { mergePdf, triggerDownload } from "@/lib/pdfApi";

const ToolMerge = () => {
  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single, clean document."
      accept="application/pdf"
      multiple
      actionLabel="Merge PDF files"
      helperText="Select two or more PDF files to merge."
      onSubmit={async (files) => {
        const { downloadUrl } = await mergePdf(files);
        triggerDownload(downloadUrl);
      }}
    />
  );
};

export default ToolMerge;
