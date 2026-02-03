import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  FileInput,
  Layers,
  RotateCw,
  Crop,
  Hash,
  Stamp,
  Scissors,
  FileMinus2,
  FileOutput,
  ScanSearch,
  Gauge,
  Wrench,
  Type,
  Image,
  FileText,
} from "lucide-react";

const tools = [
  {
    name: "Organize PDF",
    description: "Reorder, delete, and rotate pages before exporting.",
    Icon: Layers,
    path: "/tools/organize",
  },
  {
    name: "Rotate PDF",
    description: "Rotate all pages by 90°, 180°, or 270°.",
    Icon: RotateCw,
    path: "/tools/rotate",
  },
  {
    name: "Crop PDF",
    description: "Crop pages by margins or by an exact box.",
    Icon: Crop,
    path: "/tools/crop",
  },
  {
    name: "Add page numbers",
    description: "Number pages consistently across your document.",
    Icon: Hash,
    path: "/tools/page-numbers",
  },
  {
    name: "Add watermark",
    description: "Add a text watermark on top of each page.",
    Icon: Stamp,
    path: "/tools/watermark",
  },
  {
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    Icon: FileInput,
    path: "/tools/merge",
  },
  {
    name: "Split PDF",
    description: "Separate one PDF into multiple files.",
    Icon: Scissors,
    path: "/tools/split",
  },
  {
    name: "Remove pages",
    description: "Delete specific pages from your PDF.",
    Icon: FileMinus2,
    path: "/tools/remove-pages",
  },
  {
    name: "Extract pages",
    description: "Extract selected pages into a new PDF.",
    Icon: FileOutput,
    path: "/tools/extract",
  },
  {
    name: "Scan to PDF",
    description: "Turn scans into clean, searchable PDFs.",
    Icon: ScanSearch,
    path: "/tools/scan-to-pdf",
  },
  {
    name: "Compress PDF",
    description: "Reduce file size while keeping quality.",
    Icon: Gauge,
    path: "/tools/compress",
  },
  {
    name: "Repair PDF",
    description: "Fix corrupted or damaged PDF files.",
    Icon: Wrench,
    path: "/tools/repair",
  },
  {
    name: "OCR PDF",
    description: "Extract text from scanned documents.",
    Icon: Type,
    path: "/tools/ocr",
  },
  {
    name: "Image to PDF",
    description: "Convert images into high-quality PDFs.",
    Icon: Image,
    path: "/tools/image-to-pdf",
  },
  {
    name: "Word to PDF",
    description: "Convert Word documents to PDF.",
    Icon: FileText,
    path: "/tools/word-to-pdf",
  },
];

const ToolsSection = () => {
  const navigate = useNavigate();

  return (
    <section id="tools" className="relative overflow-hidden bg-background pb-20 pt-10 md:pb-28 md:pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="aurora-layer aurora-layer--3 opacity-35" />
        <div className="bg-grain absolute inset-0" />
      </div>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-3xl font-semibold tracking-tight md:text-4xl">All the PDF tools</h2>
          <p className="mb-6 text-sm text-muted-foreground md:text-base">
            Pick a tool, upload a file, download the result. Built for speed.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-2 py-1 text-xs text-muted-foreground">
            <button className="chip-muted rounded-full px-3 py-1 text-xs font-medium">All</button>
            <button className="rounded-full px-3 py-1 hover:bg-muted">Organize PDF</button>
            <button className="rounded-full px-3 py-1 hover:bg-muted">Optimize PDF</button>
            <button className="rounded-full px-3 py-1 hover:bg-muted">Convert PDF</button>
            <button className="rounded-full px-3 py-1 hover:bg-muted">Edit PDF</button>
            <button className="rounded-full px-3 py-1 hover:bg-muted">PDF Security</button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <article
              key={tool.name}
              className="group flex cursor-pointer flex-col rounded-3xl border bg-card/55 p-5 shadow-editorial backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:bg-card/75"
              role="link"
              tabIndex={0}
              onClick={(event) => {
                const target = event.target as HTMLElement | null;
                // Don't hijack clicks on interactive children.
                if (target?.closest("a,button,input,select,textarea")) return;
                navigate(tool.path);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(tool.path);
                }
              }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <tool.Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mb-1 text-sm font-semibold md:text-base">{tool.name}</h3>
              <p className="mb-4 text-xs text-muted-foreground md:text-sm">{tool.description}</p>
              <div className="mt-auto">
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-full border-dashed px-3 text-xs font-medium text-primary group-hover:border-primary/60 group-hover:bg-primary/5"
                >
                  <Link to={tool.path}>Use tool →</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
