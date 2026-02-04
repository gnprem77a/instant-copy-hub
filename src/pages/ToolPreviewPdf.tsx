import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import FileSelectCard from "@/components/tools/FileSelectCard";
import PdfPageCard from "@/components/tools/PdfPageCard";
import { previewPdf } from "@/lib/pdfApi";

export default function ToolPreviewPdf() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<Array<{ pageNumber: number; imageUrl: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    previewPdf(file)
      .then((res) => {
        if (cancelled) return;
        setPages(res.pages);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setPages([]);
        toast({
          title: "Preview failed",
          description: "We couldn't generate a preview for this PDF.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <main className="bg-background pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container max-w-6xl">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Preview PDF</h1>
          <p className="text-sm text-muted-foreground md:text-base">Generate a quick preview of all PDF pages.</p>
        </header>

        <section className="rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <FileSelectCard
                selectedCount={file ? 1 : 0}
                disabled={loading}
                onClick={() => fileRef.current?.click()}
                helperText={file ? file.name : "Select a single PDF to preview."}
              />
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {loading && <p className="text-xs text-muted-foreground">Generating preview…</p>}

            {pages.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map((p) => (
                  <PdfPageCard key={p.pageNumber} pageNumber={p.pageNumber} imageUrl={p.imageUrl} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
