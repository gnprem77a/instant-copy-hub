import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolPdfToJpg() {
  return (
    <SimpleToolPage
      title="PDF to JPG"
      description="Convert PDF pages into JPG images."
      apiPath="/pdf-to-jpg"
      actionLabel="Convert to JPG"
      helperText="Select a single PDF to convert."
    />
  );
}
