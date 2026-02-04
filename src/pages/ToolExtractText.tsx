import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolExtractText() {
  return (
    <SimpleToolPage
      title="Extract Text"
      description="Extract all text from your PDF."
      apiPath="/extract-text"
      actionLabel="Extract text"
      helperText="Select a single PDF to extract text from."
    />
  );
}
