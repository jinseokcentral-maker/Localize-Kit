import { parseAsBoolean, useQueryState } from "nuqs";
import { Link } from "react-router";
import { Check, X, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PricingFeatureProps {
  included: boolean;
  text: string;
  info?: string;
}

function PricingFeature({ included, text, info }: PricingFeatureProps) {
  return (
    <div
      className={`flex items-start gap-3 ${
        included ? "text-foreground" : "text-muted-foreground/40"
      }`}
    >
      {included ? (
        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      ) : (
        <X className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <span className="text-sm leading-6 flex-1 text-left">
        {text}
        {info && (
          <span className="text-muted-foreground text-xs block mt-0.5">
            {info}
          </span>
        )}
      </span>
    </div>
  );
}

export function Pricing() {
  const [isAnnual, setIsAnnual] = useQueryState(
    "annual",
    parseAsBoolean.withDefault(true)
  );

  return (
    <section
      className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative"
      id="pricing"
    >
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Start with our free tier and upgrade as you grow.
            <br />
            Optimized for JSON-first workflows.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${
                !isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isAnnual ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              Yearly
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col hover:border-border/80 transition-colors relative overflow-hidden group">
            <div className="mb-6 relative z-10">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                Perfect for hobby projects and prototypes.
              </p>
            </div>

            <Button
              className="w-full mb-8"
              variant="secondary"
              asChild
              size="lg"
            >
              <Link to="/app">Get Started</Link>
            </Button>

            <div className="space-y-4 flex-1">
              <PricingFeature included text="1 Project" />
              <PricingFeature included text="Unlimited Languages" />
              <PricingFeature included text="Manual Import" info="CSV, Excel" />
              <PricingFeature included text="JSON Download" />
              <PricingFeature included text="Read-only Table View" />
              <PricingFeature included={false} text="Dashboard Editing" />
              <PricingFeature included={false} text="Delivery API" />
              <PricingFeature included={false} text="Auto Sync" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)] md:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3" /> MOST POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-primary">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {isAnnual ? "12" : "19"}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                For professional developers and shipping apps.
              </p>
            </div>

            <Button className="w-full mb-8" size="lg" asChild>
              <Link to="/login">Upgrade to Pro</Link>
            </Button>

            <div className="space-y-4 flex-1">
              <PricingFeature included text="10 Projects" />
              <PricingFeature included text="Unlimited Languages" />
              <PricingFeature included text="Dashboard Editing" />
              <PricingFeature included text="Delivery API" info="50K req/month" />
              <PricingFeature
                included
                text="Auto Google Sheet Sync"
                info="5-10 min polling"
              />
              <PricingFeature included text="Code Snippets" info="React, Next.js, RN" />
              <PricingFeature included text="Webhooks" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col hover:border-border/80 transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Team</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {isAnnual ? "39" : "49"}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                For scaling teams with advanced needs.
              </p>
            </div>

            <Button className="w-full mb-8" size="lg" asChild>
              <Link to="/login">Upgrade to Team</Link>
            </Button>

            <div className="space-y-4 flex-1">
              <PricingFeature included text="Everything in Pro" />
              <PricingFeature included text="Unlimited Projects" />
              <PricingFeature
                included
                text="3 Members Included"
                info="+$5/user/month"
              />
              <PricingFeature
                included
                text="Webhook-based Auto Sync"
              />
              <PricingFeature
                included
                text="High-volume API"
                info="200K req/month"
              />
              <PricingFeature
                included
                text="Role-based Access"
                info="Admin, Dev, Translator"
              />
              <PricingFeature included text="Audit Logs" />
              <PricingFeature included text="Team Billing" />
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <h3 className="text-xl font-bold mb-6 text-center">
            Accelerate Your Global Growth
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <strong className="text-foreground block mb-2">
                Faster Time-to-Market
              </strong>
              Launch new markets in days, not months. Automate the handoff between
              design, code, and translation.
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <strong className="text-foreground block mb-2">
                Reduce Operational Costs
              </strong>
              Stop wasting engineering hours on manual file management. Let your team
              focus on building features.
            </div>
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <strong className="text-foreground block mb-2">
                Seamless Collaboration
              </strong>
              Bridge the gap between developers, translators, and product managers
              with a single source of truth.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

