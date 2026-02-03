import MainHeader from "@/components/layout/MainHeader";
import Hero from "@/components/landing/Hero";
import ToolsSection from "@/components/landing/ToolsSection";
import BatchSection from "@/components/landing/BatchSection";
import MainFooter from "@/components/layout/MainFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <main>
        <Hero />
        <ToolsSection />
        <BatchSection />
      </main>
      <MainFooter />
    </div>
  );
};

export default Index;

