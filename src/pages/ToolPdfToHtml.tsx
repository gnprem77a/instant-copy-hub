import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPdfToHtml() {
  return (
    <SimpleToolPage
      title="PDF to HTML"
      description="Convert PDF into HTML format."
      apiPath="/pdf-to-html"
      actionLabel="Convert to HTML"
      helperText="Select a single PDF to convert."
    />
  );
}
