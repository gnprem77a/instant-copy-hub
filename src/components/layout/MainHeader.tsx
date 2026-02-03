import { Button } from "@/components/ui/button";
import { FileText, SunMedium } from "lucide-react";

const MainHeader = () => {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight">InstantPDF</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#tools" className="hover:text-foreground">
            Tools
          </a>
          <a href="#batch" className="hover:text-foreground">
            Batch process
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            <SunMedium className="h-4 w-4" aria-hidden="true" />
          </button>
          <Button variant="ghost" className="hidden text-sm font-medium md:inline-flex">
            Log in
          </Button>
          <Button className="rounded-full px-4 text-sm font-semibold">Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
