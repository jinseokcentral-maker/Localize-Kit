import {
  ArrowRight,
  Code,
  Server,
  TableProperties,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { TypoH1, TypoP } from "~/components/typo";

const features = [
  {
    icon: <Code className="w-6 h-6" />,
    title: "Code Snippets",
    description: "Get copy-paste ready code snippets for your specific framework instantly.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Conversion",
    description: "Experience zero-latency conversion from CSV/Excel to i18n JSON.",
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: "API Serving",
    description: "Serve translations directly to your production app via our high-performance API.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Collaborate",
    description: "Invite team members to view, edit, and manage translations together.",
  },
  {
    icon: <TableProperties className="w-6 h-6" />,
    title: "Google Sheets Sync",
    description: "Keep your data perfectly synchronized with Google Sheets in real-time.",
  },
];

export function CTASection() {
  return (
    <section
      id="cta-section"
      className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <TypoH1 className="text-3xl md:text-4xl font-bold mb-4">
            Why Upgrade to <span className="text-primary">Pro</span>?
          </TypoH1>
          <TypoP className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of LocalizeKit with features designed for professional workflows.
          </TypoP>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}

          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col justify-center items-center text-center">
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Ready to start?
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Join thousands of developers building faster.
            </p>
            <Button className="w-full" size="lg">
              <span className="flex items-center justify-center gap-2">
                View Pricing <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>

        <div className="flex justify-center pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Need basic features only?
            <Button variant="link" className="p-0 h-auto text-primary font-medium">
              Get Started Free
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
}

