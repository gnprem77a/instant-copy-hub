import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolRedactPdf() {
  return (
    <SimpleToolPage
      title="Redact PDF"
      description="Permanently remove sensitive information from your PDF."
      apiPath="/redact"
      actionLabel="Redact PDF"
      helperText="Select a single PDF to redact."
    />
  );
}
