import { useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { digitalSignature, triggerDownload } from "@/lib/pdfApi";
import FileSelectCard from "@/components/tools/FileSelectCard";

export default function ToolDigitalSignature() {
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [position, setPosition] = useState<string>("");
  const [page, setPage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => Boolean(file && signatureImage), [file, signatureImage]);

  const submit = async () => {
    if (!file || !signatureImage) {
      toast({
        title: "Missing files",
        description: "Please select a PDF and a signature image.",
        variant: "destructive",
      });
      return;
    }

    const pageNum = page.trim().length > 0 ? Number(page) : undefined;
    if (pageNum !== undefined && (!Number.isFinite(pageNum) || pageNum <= 0)) {
      toast({
        title: "Invalid page",
        description: "Page must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { downloadUrl } = await digitalSignature(file, signatureImage, {
        position: position.trim() || undefined,
        page: pageNum,
      });
      triggerDownload(downloadUrl);
    } catch (e) {
      console.error(e);
      toast({
        title: "Signing failed",
        description: "We couldn't apply the signature. Please try again.",
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
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Digital Signature</h1>
          <p className="text-sm text-muted-foreground md:text-base">Add a digital signature image to your PDF.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <section className="rounded-3xl border bg-card p-6 shadow-soft-card md:p-8">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <FileSelectCard
                    selectedCount={file ? 1 : 0}
                    disabled={loading}
                    onClick={() => pdfRef.current?.click()}
                    helperText={file ? file.name : "Select the PDF to sign"}
                  />
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <FileSelectCard
                    selectedCount={signatureImage ? 1 : 0}
                    disabled={loading}
                    onClick={() => imgRef.current?.click()}
                    helperText={signatureImage ? signatureImage.name : "Select signature image (PNG/JPG)"}
                  />
                  <input
                    ref={imgRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => setSignatureImage(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Position (optional)</label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder='e.g. "bottom-right"'
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Page (optional)</label>
                  <Input
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g. 1"
                    disabled={loading}
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
                  {loading ? "Processing…" : "Apply signature"}
                </Button>
              </div>
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="rounded-3xl border bg-card p-4 shadow-soft-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Notes</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PDF plus a signature image. If your backend supports it, you can also specify page and position.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
