import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPdfToWord() {
  return (
    <SimpleToolPage
      title="PDF to Word"
      description="Convert PDF to an editable Word document."
      apiPath="/pdf-to-word"
      actionLabel="Convert to Word"
      helperText="Select a single PDF to convert."
    />
  );
}
