import { Button } from "@/components/ui/button";
import FloatingPills from "./FloatingPills";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-hero-surface pb-14 pt-14 md:pb-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
        <div className="aurora-layer aurora-layer--1 opacity-70" />
        <div className="aurora-layer aurora-layer--2 opacity-45" />
        <div className="aurora-layer aurora-layer--3 opacity-55" />
        <div className="bg-grain absolute inset-0" />
      </div>

      <FloatingPills />

      <div className="container relative grid items-center gap-10 md:grid-cols-[1.05fr,0.95fr] md:gap-12">
        <div className="text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1 text-xs font-medium text-muted-foreground shadow-editorial backdrop-blur">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent">
              ✨
            </span>
            <span>Free PDF tools, no signup required</span>
          </div>

          <h1 className="animate-fade-up-soft mb-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Fast PDF tools,
            <span className="block text-hero-gradient">built for real work</span>
          </h1>
          <p className="animate-fade-up-soft mb-8 max-w-xl text-balance text-base text-muted-foreground [animation-delay:120ms] md:text-lg">
            Merge, split, compress, convert, rotate, unlock and watermark PDFs in seconds.
            Clean results, private processing.
          </p>

          <div className="animate-fade-up-soft flex flex-col items-start gap-3 [animation-delay:200ms] sm:flex-row sm:items-center sm:gap-4">
            <Button className="ring-glow-primary rounded-full px-6 text-sm font-semibold shadow-editorial">
              Explore all tools
            </Button>
            <Button variant="outline" className="rounded-full px-5 text-sm font-medium">
              Learn more
            </Button>
          </div>
        </div>

        <div className="animate-enter relative [animation-delay:160ms]">
          <div className="rounded-[2rem] border bg-card/60 p-4 shadow-editorial backdrop-blur md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-2.5 w-24 rounded-full bg-muted" />
                <div className="h-2 w-40 rounded-full bg-muted/70" />
              </div>
              <div className="h-8 w-24 rounded-full bg-primary/15" />
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border bg-background/30 p-4">
                <div className="mb-2 h-2.5 w-32 rounded-full bg-muted" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-xl bg-muted/60" />
                  <div className="h-16 rounded-xl bg-muted/60" />
                  <div className="h-16 rounded-xl bg-muted/60" />
                </div>
              </div>
              <div className="rounded-2xl border bg-background/25 p-4">
                <div className="mb-2 h-2.5 w-28 rounded-full bg-muted" />
                <div className="h-9 rounded-xl bg-primary/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
