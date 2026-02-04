import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPdfToExcel() {
  return (
    <SimpleToolPage
      title="PDF to Excel"
      description="Extract tables from PDF into an Excel spreadsheet."
      apiPath="/pdf-to-excel"
      actionLabel="Convert to Excel"
      helperText="Select a single PDF to convert."
    />
  );
}
