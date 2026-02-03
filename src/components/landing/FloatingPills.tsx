import { FileText, Lock, Sparkles, ShieldCheck, Layers } from "lucide-react";

const pills = [
  { Icon: FileText, top: "18%", left: "12%", delay: "0s" },
  { Icon: Lock, top: "34%", right: "10%", delay: "0.8s" },
  { Icon: Sparkles, top: "62%", left: "6%", delay: "0.4s" },
  { Icon: ShieldCheck, top: "72%", right: "16%", delay: "1.2s" },
  { Icon: Layers, top: "46%", right: "40%", delay: "1.6s" },
];

const FloatingPills = () => {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {pills.map(({ Icon, delay, ...pos }, index) => (
        <div
          key={index}
          className="absolute hidden rounded-3xl bg-card/90 p-3 shadow-soft-card ring-1 ring-primary/10 backdrop-blur-lg md:block"
          style={{
            ...pos,
            animation: `float-soft 7s ease-in-out infinite`,
            animationDelay: delay,
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingPills;
