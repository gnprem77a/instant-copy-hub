import SimpleToolPage from "@/components/tools/SimpleToolPage";

export default function ToolExcelToPdf() {
  return (
    <SimpleToolPage
      title="Excel to PDF"
      description="Convert Excel spreadsheets into a PDF."
      apiPath="/excel-to-pdf"
      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      actionLabel="Convert to PDF"
      helperText="Select an Excel file to convert."
    />
  );
}
