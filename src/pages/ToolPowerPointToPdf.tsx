import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPowerPointToPdf() {
  return (
    <SimpleToolPage
      title="PowerPoint to PDF"
      description="Convert PowerPoint slides into a PDF."
      apiPath="/powerpoint-to-pdf"
      accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
      actionLabel="Convert to PDF"
      helperText="Select a PowerPoint file to convert."
    />
  );
}
