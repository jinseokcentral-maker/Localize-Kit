import { TypoH1, TypoP } from "~/components/typo";
import { HeroSection } from "~/components/landing/HeroSection";

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSection />

      {/* Editor Preview Section - Placeholder */}
      <section className="px-8 py-12">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TypoP className="text-muted-foreground">
            Editor Section will be here
          </TypoP>
        </div>
      </section>

      {/* Testimonials Section - Placeholder */}
      <section className="px-8 py-16">
        <TypoH1 className="text-center">Loved by developers worldwide</TypoH1>
        <TypoP className="text-muted-foreground text-center mt-4">
          See what teams are saying about LocalizeKit
        </TypoP>
      </section>

      {/* Features Section - Placeholder */}
      <section className="px-8 py-16">
        <TypoH1 className="text-center">Why LocalizeKit?</TypoH1>
      </section>

      {/* CTA Section - Placeholder */}
      <section className="px-8 py-16 text-center">
        <TypoH1>Need more than just conversion?</TypoH1>
        <TypoP className="text-muted-foreground mt-4">
          Save your projects, edit in dashboard, and deliver translations via
          API with LocalizeKit Pro.
        </TypoP>
      </section>
    </div>
  );
}
