import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolProtectPdf() {
  return (
    <SimpleToolPage
      title="Protect PDF"
      description="Add password protection to your PDF."
      apiPath="/protect"
      actionLabel="Protect PDF"
      helperText="Select a single PDF to protect."
    />
  );
}
