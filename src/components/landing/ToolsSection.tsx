import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Lock,
  Unlock,
  Eraser,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
  Images,
  Code,
  GitCompare,
  FileSignature,
  BadgeCheck,
  Sparkles,
  Heading,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type ToolCategory =
  | "Organize PDF"
  | "Optimize PDF"
  | "Convert to PDF"
  | "Convert from PDF"
  | "Edit PDF"
  | "PDF Security"
  | "Advanced Tools";

type ToolCard = {
  name: string;
  description: string;
  Icon: LucideIcon;
  path: string;
  category: ToolCategory;
};

const tools: ToolCard[] = [
  {
    name: "Organize PDF",
    description: "Reorder, delete, and rotate pages before exporting.",
    Icon: Layers,
    path: "/tools/organize",
    category: "Organize PDF",
  },
  {
    name: "Rotate PDF",
    description: "Rotate all pages by 90°, 180°, or 270°.",
    Icon: RotateCw,
    path: "/tools/rotate",
    category: "Organize PDF",
  },
  {
    name: "Crop PDF",
    description: "Crop pages by margins or by an exact box.",
    Icon: Crop,
    path: "/tools/crop",
    category: "Organize PDF",
  },
  {
    name: "Add page numbers",
    description: "Number pages consistently across your document.",
    Icon: Hash,
    path: "/tools/page-numbers",
    category: "Edit PDF",
  },
  {
    name: "Add watermark",
    description: "Add a text watermark on top of each page.",
    Icon: Stamp,
    path: "/tools/watermark",
    category: "Edit PDF",
  },
  {
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    Icon: FileInput,
    path: "/tools/merge",
    category: "Edit PDF",
  },
  {
    name: "Split PDF",
    description: "Separate one PDF into multiple files.",
    Icon: Scissors,
    path: "/tools/split",
    category: "Edit PDF",
  },
  {
    name: "Remove pages",
    description: "Delete specific pages from your PDF.",
    Icon: FileMinus2,
    path: "/tools/remove-pages",
    category: "Edit PDF",
  },
  {
    name: "Extract pages",
    description: "Extract selected pages into a new PDF.",
    Icon: FileOutput,
    path: "/tools/extract",
    category: "Edit PDF",
  },
  {
    name: "Scan to PDF",
    description: "Turn scans into clean, searchable PDFs.",
    Icon: ScanSearch,
    path: "/tools/scan-to-pdf",
    category: "Convert to PDF",
  },
  {
    name: "Compress PDF",
    description: "Reduce file size while keeping quality.",
    Icon: Gauge,
    path: "/tools/compress",
    category: "Optimize PDF",
  },
  {
    name: "Repair PDF",
    description: "Fix corrupted or damaged PDF files.",
    Icon: Wrench,
    path: "/tools/repair",
    category: "Optimize PDF",
  },
  {
    name: "OCR PDF",
    description: "Extract text from scanned documents.",
    Icon: Type,
    path: "/tools/ocr",
    category: "Optimize PDF",
  },
  {
    name: "Image to PDF",
    description: "Convert images into high-quality PDFs.",
    Icon: Image,
    path: "/tools/image-to-pdf",
    category: "Convert to PDF",
  },
  {
    name: "Word to PDF",
    description: "Convert Word documents to PDF.",
    Icon: FileText,
    path: "/tools/word-to-pdf",
    category: "Convert to PDF",
  },

  // === PDF Security ===
  {
    name: "Protect PDF",
    description: "Add password protection to your PDF.",
    Icon: Lock,
    path: "/tools/protect",
    category: "PDF Security",
  },
  {
    name: "Unlock PDF",
    description: "Remove password protection from PDF.",
    Icon: Unlock,
    path: "/tools/unlock",
    category: "PDF Security",
  },
  {
    name: "Redact PDF",
    description: "Permanently remove sensitive information.",
    Icon: Eraser,
    path: "/tools/redact",
    category: "PDF Security",
  },
  {
    name: "Flatten PDF",
    description: "Flatten interactive form fields.",
    Icon: ShieldCheck,
    path: "/tools/flatten",
    category: "PDF Security",
  },

  // === Convert FROM PDF ===
  {
    name: "PDF to Word",
    description: "Convert PDF to editable Word document.",
    Icon: FileText,
    path: "/tools/pdf-to-word",
    category: "Convert from PDF",
  },
  {
    name: "PDF to Excel",
    description: "Extract tables from PDF to Excel.",
    Icon: FileSpreadsheet,
    path: "/tools/pdf-to-excel",
    category: "Convert from PDF",
  },
  {
    name: "PDF to PowerPoint",
    description: "Convert PDF to PowerPoint slides.",
    Icon: Presentation,
    path: "/tools/pdf-to-powerpoint",
    category: "Convert from PDF",
  },
  {
    name: "PDF to JPG",
    description: "Convert PDF pages to JPG images.",
    Icon: Images,
    path: "/tools/pdf-to-jpg",
    category: "Convert from PDF",
  },
  {
    name: "PDF to HTML",
    description: "Convert PDF to HTML format.",
    Icon: Code,
    path: "/tools/pdf-to-html",
    category: "Convert from PDF",
  },
  {
    name: "Extract Text",
    description: "Extract all text from PDF.",
    Icon: Type,
    path: "/tools/extract-text",
    category: "Convert from PDF",
  },
  {
    name: "Extract Images",
    description: "Extract all images from PDF.",
    Icon: Images,
    path: "/tools/extract-images",
    category: "Convert from PDF",
  },

  // === Convert TO PDF (extend existing) ===
  {
    name: "HTML to PDF",
    description: "Convert HTML to PDF.",
    Icon: Code,
    path: "/tools/html-to-pdf",
    category: "Convert to PDF",
  },
  {
    name: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF.",
    Icon: FileSpreadsheet,
    path: "/tools/excel-to-pdf",
    category: "Convert to PDF",
  },
  {
    name: "PowerPoint to PDF",
    description: "Convert PowerPoint slides to PDF.",
    Icon: Presentation,
    path: "/tools/powerpoint-to-pdf",
    category: "Convert to PDF",
  },

  // === Advanced Tools ===
  {
    name: "Compare PDFs",
    description: "Compare two PDFs and find differences.",
    Icon: GitCompare,
    path: "/tools/compare",
    category: "Advanced Tools",
  },
  {
    name: "Digital Signature",
    description: "Add a digital signature to PDF.",
    Icon: FileSignature,
    path: "/tools/digital-signature",
    category: "Advanced Tools",
  },
  {
    name: "Validate PDF/A",
    description: "Validate PDF/A compliance.",
    Icon: BadgeCheck,
    path: "/tools/validate-pdfa",
    category: "Advanced Tools",
  },
  {
    name: "Add Header/Footer",
    description: "Add custom headers and footers.",
    Icon: Heading,
    path: "/tools/header-footer",
    category: "Advanced Tools",
  },
  {
    name: "Preview PDF",
    description: "Generate quick PDF preview.",
    Icon: Sparkles,
    path: "/tools/preview",
    category: "Advanced Tools",
  },
  {
    name: "Convert to PDF/A",
    description: "Convert PDF to archival PDF/A format.",
    Icon: BadgeCheck,
    path: "/tools/convert-to-pdfa",
    category: "Advanced Tools",
  },
];

const ToolsSection = () => {
  const navigate = useNavigate();

  const categories: Array<{ value: "all" | ToolCategory; label: string }> = [
    { value: "all", label: "All" },
    { value: "Organize PDF", label: "Organize PDF" },
    { value: "Optimize PDF", label: "Optimize PDF" },
    { value: "Convert to PDF", label: "Convert to PDF" },
    { value: "Convert from PDF", label: "Convert from PDF" },
    { value: "Edit PDF", label: "Edit PDF" },
    { value: "PDF Security", label: "PDF Security" },
    { value: "Advanced Tools", label: "Advanced Tools" },
  ];

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
        </div>

        <Tabs defaultValue="all" className="mt-8 md:mt-10">
          <div className="mx-auto flex max-w-4xl justify-center">
            <TabsList className="h-auto flex-wrap gap-1 rounded-full border bg-card px-2 py-2">
              {categories.map((c) => (
                <TabsTrigger key={c.value} value={c.value} className="rounded-full px-3 py-1.5 text-xs">
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((c) => {
            const filtered = c.value === "all" ? tools : tools.filter((t) => t.category === c.value);
            return (
              <TabsContent key={c.value} value={c.value} className="mt-10 md:mt-12">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((tool) => (
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
                        <tool.Icon className="h-5 w-5" aria-hidden={true} />
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
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
};

export default ToolsSection;

