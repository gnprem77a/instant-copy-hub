import ToolLayout from "@/components/tools/ToolLayout";
import { runSingleFileTool, triggerDownload } from "@/lib/pdfApi";

type SimpleToolPageProps = {
  title: string;
  description: string;
  /** Backend path under /api/pdf, e.g. "/protect" */
  apiPath: string;
  accept?: string;
  actionLabel: string;
  helperText?: string;
};

export default function SimpleToolPage({
  title,
  description,
  apiPath,
  accept = "application/pdf",
  actionLabel,
  helperText,
}: SimpleToolPageProps) {
  return (
    <ToolLayout
      title={title}
      description={description}
      accept={accept}
      multiple={false}
      actionLabel={actionLabel}
      helperText={helperText}
      onSubmit={async ([file]) => {
        const { downloadUrl } = await runSingleFileTool(apiPath, file);
        triggerDownload(downloadUrl);
      }}
    />
  );
}
