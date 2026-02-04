import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolFlattenPdf() {
  return (
    <SimpleToolPage
      title="Flatten PDF"
      description="Flatten interactive form fields into a static PDF."
      apiPath="/flatten"
      actionLabel="Flatten PDF"
      helperText="Select a single PDF to flatten."
    />
  );
}
