const BatchSection = () => {
  return (
    <section id="batch" className="relative overflow-hidden bg-muted/20 py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="aurora-layer aurora-layer--1 opacity-35" />
        <div className="aurora-layer aurora-layer--2 opacity-25" />
        <div className="bg-grain absolute inset-0" />
      </div>
      <div className="container grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
        <div>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight md:text-3xl">
            Batch process hundreds of PDFs at once
          </h2>
          <p className="mb-4 text-sm text-muted-foreground md:text-base">
            Drag-and-drop whole folders, apply the same operation to every file, and download them in
            a single bundled archive. Perfect for busy teams and recurring workflows.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Queue and process jobs in the background</li>
            <li>• Email notifications when your batch is ready</li>
            <li>• Built for privacy — files are cleaned up automatically</li>
          </ul>
        </div>
        <div className="rounded-3xl border bg-card/55 p-4 shadow-editorial backdrop-blur">
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Batch queue</span>
            <span>Processing 4 of 128 files…</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="rounded-2xl bg-muted/80 p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Annual-report.pdf</span>
                <span className="text-primary">Compressing…</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
            </div>
            <div className="rounded-2xl bg-muted/60 p-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Invoices-q1.pdf</span>
                <span className="text-muted-foreground">Queued</span>
              </div>
            </div>
            <div className="rounded-2xl bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Scans-office.zip</span>
                <span className="text-muted-foreground">Queued</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BatchSection;
