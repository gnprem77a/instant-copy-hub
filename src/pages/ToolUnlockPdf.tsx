import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolUnlockPdf() {
  return (
    <SimpleToolPage
      title="Unlock PDF"
      description="Remove password protection from a PDF."
      apiPath="/unlock"
      actionLabel="Unlock PDF"
      helperText="Select a single PDF to unlock."
    />
  );
}
