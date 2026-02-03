import ToolLayout from "@/components/tools/ToolLayout";
import { triggerDownload, wordToPdf } from "@/lib/pdfApi";

const officeAccept = [
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/html",
].join(",");

const ToolWordToPdf = () => {
  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word, PowerPoint, Excel, or HTML files into reliable PDFs."
      accept={officeAccept}
      multiple={false}
      actionLabel="Convert to PDF"
      helperText="Select a single Word, PowerPoint, Excel, or HTML file."
      onSubmit={async ([file]) => {
        const { downloadUrl } = await wordToPdf(file, {});
        triggerDownload(downloadUrl);
      }}
    />
  );
};

export default ToolWordToPdf;
