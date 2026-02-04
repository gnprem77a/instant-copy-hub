import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { comparePdfs, previewPdf, triggerDownload } from "@/lib/pdfApi";
import FileSelectCard from "@/components/tools/FileSelectCard";
import PdfPageCard from "@/components/tools/PdfPageCard";

export default function ToolComparePdfs() {
  const leftRef = useRef<HTMLInputElement | null>(null);
  const rightRef = useRef<HTMLInputElement | null>(null);

  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [leftPages, setLeftPages] = useState<Array<{ pageNumber: number; imageUrl: string }>>([]);
  const [rightPages, setRightPages] = useState<Array<{ pageNumber: number; imageUrl: string }>>([]);

  const canSubmit = useMemo(() => Boolean(left && right), [left, right]);

  useEffect(() => {
    let cancelled = false;
    if (!left) {
      setLeftPages([]);
      return;
    }
    previewPdf(left)
      .then((res) => {
        if (cancelled) return;
        setLeftPages(res.pages);
      })
      .catch(() => {
        if (cancelled) return;
        setLeftPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [left]);

  useEffect(() => {
    let cancelled = false;
    if (!right) {
      setRightPages([]);
      return;
    }
    previewPdf(right)
      .then((res) => {
        if (cancelled) return;
        setRightPages(res.pages);
      })
      .catch(() => {
        if (cancelled) return;
        setRightPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [right]);

  const submit = async () => {
    if (!left || !right) {
      toast({
        title: "Select two PDFs",
        description: "Please choose a left PDF and a right PDF to compare.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { downloadUrl } = await comparePdfs(left, right);
      triggerDownload(downloadUrl);
    } catch (e) {
      console.error(e);
      toast({
        title: "Comparison failed",
        description: "We couldn't compare your PDFs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="container max-w-6xl">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Compare PDFs</h1>
          <p className="text-sm text-muted-foreground md:text-base">Compare two PDFs and find differences.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <section className="rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <FileSelectCard
                    selectedCount={left ? 1 : 0}
                    disabled={loading}
                    onClick={() => leftRef.current?.click()}
                    helperText={left ? left.name : "Select the left PDF"}
                  />
                  <input
                    ref={leftRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setLeft(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <FileSelectCard
                    selectedCount={right ? 1 : 0}
                    disabled={loading}
                    onClick={() => rightRef.current?.click()}
                    helperText={right ? right.name : "Select the right PDF"}
                  />
                  <input
                    ref={rightRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setRight(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full rounded-2xl text-sm font-semibold md:text-base"
                  onClick={submit}
                  disabled={loading || !canSubmit}
                >
                  {loading ? "Processing…" : "Compare PDFs"}
                </Button>
              </div>
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="rounded-3xl border bg-card p-4 shadow-soft-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Preview</h2>
              </div>
              <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-auto pr-1">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Left</p>
                  {leftPages.map((p) => (
                    <PdfPageCard key={`l-${p.pageNumber}`} pageNumber={p.pageNumber} imageUrl={p.imageUrl} />
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Right</p>
                  {rightPages.map((p) => (
                    <PdfPageCard key={`r-${p.pageNumber}`} pageNumber={p.pageNumber} imageUrl={p.imageUrl} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
