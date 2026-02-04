import { useMemo, useState } from "react";
import ToolLayout from "@/components/tools/ToolLayout";
import { triggerDownload, validatePdfa } from "@/lib/pdfApi";

export default function ToolValidatePdfa() {
  const [report, setReport] = useState<unknown>(null);

  const pretty = useMemo(() => {
    if (report == null) return "";
    try {
      return JSON.stringify(report, null, 2);
    } catch {
      return String(report);
    }
  }, [report]);

  return (
    <ToolLayout
      title="Validate PDF/A"
      description="Validate PDF/A compliance and view a detailed report."
      accept="application/pdf"
      multiple={false}
      actionLabel="Validate PDF/A"
      helperText="Select a single PDF to validate."
      onSubmit={async ([file]) => {
        const res = await validatePdfa(file);
        if (res.kind === "download") {
          triggerDownload(res.downloadUrl);
          return;
        }
        setReport(res.report);
      }}
    >
      {({ loading }) => (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Validation report</h2>
          {!pretty && <p className="text-xs text-muted-foreground">Run validation to see the report here.</p>}
          {pretty && (
            <pre className="max-h-[40vh] overflow-auto rounded-2xl border bg-muted p-4 text-xs leading-relaxed">
              {pretty}
            </pre>
          )}
          {loading ? <p className="text-xs text-muted-foreground">Validating…</p> : null}
        </div>
      )}
    </ToolLayout>
  );
}
