import ToolLayout from "@/components/tools/ToolLayout";
import { imageToPdf, triggerDownload } from "@/lib/pdfApi";

const ToolImageToPdf = () => {
  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert one or more images into a single, high-quality PDF."
      accept="image/*"
      multiple
      actionLabel="Convert images to PDF"
      helperText="Select one or more images to convert."
      onSubmit={async (files) => {
        const { downloadUrl } = await imageToPdf(files);
        triggerDownload(downloadUrl);
      }}
    />
  );
};

export default ToolImageToPdf;
