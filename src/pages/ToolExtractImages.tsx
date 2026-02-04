import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolExtractImages() {
  return (
    <SimpleToolPage
      title="Extract Images"
      description="Extract all images from your PDF."
      apiPath="/extract-images"
      actionLabel="Extract images"
      helperText="Select a single PDF to extract images from."
    />
  );
}
