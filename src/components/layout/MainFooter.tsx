const MainFooter = () => {
  return (
    <footer id="pricing" className="border-t bg-background py-8 text-xs text-muted-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p>© {new Date().getFullYear()} InstantPDF. Free PDF tools, built for speed.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">
            Pricing
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
