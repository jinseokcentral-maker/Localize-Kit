import { Link } from "react-router";
import { Sparkles, FileDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TypoH1, TypoP } from "~/components/typo";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-8 pt-20 pb-12">
      {/* Heading */}
      <TypoH1 className="text-center">
        Instantly convert CSV to i18n JSON.
      </TypoH1>

      {/* Description */}
      <TypoP muted className="mt-6 text-center max-w-2xl">
        Transform your spreadsheet translations into ready-to-use JSON files in
        seconds.
      </TypoP>

      {/* CTA Buttons */}
      <div className="mt-10 flex items-center gap-4">
        {/* Primary CTA */}
        <Button size="lg" variant="secondary" asChild>
          <Link to="/app">🚀 Convert CSV/Excel now</Link>
        </Button>

        {/* Download sample Excel */}
        <Button size="lg" variant="outline" asChild>
          <a
            href="/example.xlsx"
            download
            className="flex items-center gap-2"
          >
            <FileDown className="size-4" />
            Test with Example Excel
          </a>
        </Button>

        {/* GitHub Link */}
        <Button size="lg" asChild>
          <a
            href="#cta-section"
            className="flex items-center gap-2 font-semibold text-primary-foreground"
          >
            <Sparkles className="size-4 text-primary-foreground" />
            Need more feature
          </a>
        </Button>
      </div>
    </section>
  );
}

export default HeroSection;
