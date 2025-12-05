import { TypoH1, TypoP } from "~/components/typo";

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <TypoH1>Instantly convert CSV to i18n JSON.</TypoH1>
        <TypoP muted className="mt-4 max-w-2xl mx-auto">
          Transform your spreadsheet translations into ready-to-use JSON, YAML, or i18n resource files in seconds.
        </TypoP>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/app"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            🚀 Go to Converter
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-foreground hover:bg-accent"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Editor Preview Section - Placeholder */}
      <section className="py-16">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TypoP muted>Editor Section will be here</TypoP>
        </div>
      </section>

      {/* Testimonials Section - Placeholder */}
      <section className="py-16">
        <TypoH1 className="text-center">Loved by developers worldwide</TypoH1>
        <TypoP muted className="text-center mt-4">
          See what teams are saying about LocalizeKit
        </TypoP>
      </section>

      {/* Features Section - Placeholder */}
      <section className="py-16">
        <TypoH1 className="text-center">Why LocalizeKit?</TypoH1>
      </section>

      {/* CTA Section - Placeholder */}
      <section className="py-16 text-center">
        <TypoH1>Need more than just conversion?</TypoH1>
        <TypoP muted className="mt-4">
          Save your projects, edit in dashboard, and deliver translations via API with LocalizeKit Pro.
        </TypoP>
      </section>
    </div>
  );
}

