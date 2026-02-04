import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPdfToPowerPoint() {
  return (
    <SimpleToolPage
      title="PDF to PowerPoint"
      description="Convert PDF into PowerPoint slides."
      apiPath="/pdf-to-powerpoint"
      actionLabel="Convert to PowerPoint"
      helperText="Select a single PDF to convert."
    />
  );
}
