import dayjs from "dayjs";
import { Globe } from "lucide-react";
import { TypoP, TypoSmall } from "~/components/typo";

const links = {
  product: [
    { label: "Converter", href: "/app" },
    { label: "Dashboard", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "API", href: "#" },
  ],
  resources: [
    { label: "Docs", href: "#" },
    { label: "Blog", href: "#" },
    { label: "GitHub", href: "https://github.com/jinseokcentral-maker/Localize-Kit" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Twitter", href: "#" },
  ],
};

export function Footer() {
  const year = dayjs().year();

  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Copyright */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-foreground">
              <Globe className="w-5 h-5 text-primary" />
              <TypoSmall className="font-semibold">LocalizeKit</TypoSmall>
            </div>
            <TypoSmall className="text-muted-foreground">
              © {year} LocalizeKit
            </TypoSmall>
          </div>

          <FooterColumn title="Product" items={links.product} />
          <FooterColumn title="Resources" items={links.resources} />
          <FooterColumn title="Company" items={links.company} />
        </div>
      </div>
    </footer>
  );
}

type FooterItem = { label: string; href: string };

function FooterColumn({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <TypoSmall className="mb-3 font-semibold text-foreground">{title}</TypoSmall>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

