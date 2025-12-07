import { Button } from "~/components/ui/button";
import { TypoH1, TypoP } from "~/components/typo";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <TypoH1 className="mb-4">Need more than just conversion?</TypoH1>

        <TypoP className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Save your projects, edit in dashboard, and deliver translations via API
          with LocalizeKit Pro.
        </TypoP>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button size="lg">Get Started Free</Button>
          <Button size="lg" variant="outline">
            View Pricing
          </Button>
        </div>
      </div>
    </section>
  );
}

