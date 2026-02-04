import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolHtmlToPdf() {
  return (
    <SimpleToolPage
      title="HTML to PDF"
      description="Convert an HTML file or web page export into PDF."
      apiPath="/html-to-pdf"
      accept="text/html,.html"
      actionLabel="Convert to PDF"
      helperText="Select an HTML file to convert."
    />
  );
}
