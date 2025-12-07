import { TypoH1, TypoP } from "~/components/typo";
import { HeroSection } from "~/components/landing/HeroSection";
import { EditorSection } from "~/components/landing/editor";
import { PerformanceSection } from "~/components/landing/PerformanceSection";
import { TestimonialsSection } from "~/components/landing/TestimonialsSection";
import { CTASection } from "~/components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSection />

      {/* Editor Preview Section */}
      <EditorSection heightClass="h-[600px] md:h-[720px]" />

      {/* Performance Section */}
      <PerformanceSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}
