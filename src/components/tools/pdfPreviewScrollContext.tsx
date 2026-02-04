import { createContext, useContext } from "react";

type PdfPreviewScrollContextValue = {
  /** The scroll container used by the preview grid (so IntersectionObserver can use it as root). */
  scrollRoot: HTMLElement | null;
  /** Preload distance around viewport (px) before an item becomes visible. */
  rootMargin: string;
};

const PdfPreviewScrollContext = createContext<PdfPreviewScrollContextValue>({
  scrollRoot: null,
  rootMargin: "300px 0px",
});

export function PdfPreviewScrollProvider({
  value,
  children,
}: {
  value: PdfPreviewScrollContextValue;
  children: React.ReactNode;
}) {
  return <PdfPreviewScrollContext.Provider value={value}>{children}</PdfPreviewScrollContext.Provider>;
}

export function usePdfPreviewScrollContext() {
  return useContext(PdfPreviewScrollContext);
}
