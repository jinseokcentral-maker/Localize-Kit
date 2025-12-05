import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { GithubIcon } from "~/components/icons/GithubIcon";
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
        Transform your spreadsheet translations into ready-to-use JSON, YAML, or
        i18n resource files in seconds.
      </TypoP>

      {/* CTA Buttons */}
      <div className="mt-10 flex items-center gap-4">
        {/* Primary CTA */}
        <Button size="lg" asChild>
          <Link to="/app">🚀 Go to Converter</Link>
        </Button>

        {/* GitHub Link */}
        <Button variant="outline" size="lg" asChild>
          <a
            href="https://github.com/jinseokcentral-maker/Localize-Kit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <GithubIcon className="size-4" />
            View on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}

export default HeroSection;
