import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolAddHeaderFooter() {
  return (
    <SimpleToolPage
      title="Add Header/Footer"
      description="Add custom headers and footers to your PDF."
      apiPath="/header-footer"
      actionLabel="Add header/footer"
      helperText="Select a single PDF to continue."
    />
  );
}
