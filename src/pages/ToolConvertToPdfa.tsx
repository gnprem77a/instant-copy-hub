import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolConvertToPdfa() {
  return (
    <SimpleToolPage
      title="Convert to PDF/A"
      description="Convert a PDF into archival PDF/A format."
      apiPath="/convert-to-pdfa"
      actionLabel="Convert to PDF/A"
      helperText="Select a single PDF to convert."
    />
  );
}
