import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { TypoH1, TypoP } from "~/components/typo";
import { cn } from "~/lib/utils";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "LocalizeKit saved us hours of manual work. We can now deploy translations in minutes instead of days.",
    author: "Sarah Chen",
    role: "Engineering Lead",
    company: "TechCorp",
  },
  {
    quote:
      "The nested keys feature is a game-changer. Our i18n files are now properly structured and maintainable.",
    author: "Marcus Rodriguez",
    role: "Frontend Developer",
    company: "StartupXYZ",
  },
  {
    quote:
      "Clean, simple, and it just works. Exactly what we needed for our localization workflow.",
    author: "Yuki Tanaka",
    role: "Product Manager",
    company: "GlobalApp Inc",
  },
  {
    quote:
      "Realtime preview plus WASM speed lets us iterate with our PMs without waiting for builds.",
    author: "Alex Johnson",
    role: "Localization Engineer",
    company: "MobileOne",
  },
  {
    quote:
      "Separator and nested-key options removed an entire class of bugs for our multilingual apps.",
    author: "Priya Nair",
    role: "Staff Engineer",
    company: "SaaSly",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = TESTIMONIALS.length;

  const next = () => setCurrentIndex((i) => (i + 1) % total);
  const prev = () => setCurrentIndex((i) => (i - 1 + total) % total);

  // autoplay
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(next, 3200);
    return () => clearInterval(id);
  }, [isPaused]);

  // responsive slices
  const visible = useMemo(() => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(max-width: 767px)").matches) return 1;
    if (window.matchMedia("(max-width: 1023px)").matches) return 2;
    return 3;
  }, []);

  const getVisible = () => {
    const arr: Testimonial[] = [];
    for (let i = 0; i < visible; i++) {
      arr.push(TESTIMONIALS[(currentIndex + i) % total]);
    }
    return arr;
  };

  const visibleItems = getVisible();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <TypoH1 className="text-3xl font-bold tracking-tight">
            Loved by developers worldwide
          </TypoH1>
          <TypoP className="text-muted-foreground mt-3">
            See what teams are saying about LocalizeKit
          </TypoP>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Desktop grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item, idx) => (
                <motion.div
                  key={`${currentIndex}-${idx}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <TypoP className="text-muted-foreground mb-6 flex-1 leading-7">
                    “{item.quote}”
                  </TypoP>
                  <div className="border-t border-border pt-4">
                    <p className="text-foreground font-medium">{item.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.role} at {item.company}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tablet grid */}
          <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {visibleItems.slice(0, 2).map((item, idx) => (
                <motion.div
                  key={`${currentIndex}-${idx}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 flex flex-col shadow-sm"
                >
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <TypoP className="text-muted-foreground mb-6 flex-1 leading-7">
                    “{item.quote}”
                  </TypoP>
                  <div className="border-t border-border pt-4">
                    <p className="text-foreground font-medium">{item.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.role} at {item.company}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mobile single */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-lg p-6 flex flex-col shadow-sm"
              >
                <Quote className="w-8 h-8 text-primary mb-4" />
                <TypoP className="text-muted-foreground mb-6 flex-1 leading-7">
                  “{TESTIMONIALS[currentIndex].quote}”
                </TypoP>
                <div className="border-t border-border pt-4">
                  <p className="text-foreground font-medium">
                    {TESTIMONIALS[currentIndex].author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {TESTIMONIALS[currentIndex].role} at{" "}
                    {TESTIMONIALS[currentIndex].company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-background/80 border border-border hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-sm"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-background/80 border border-border hover:bg-accent rounded-full flex items-center justify-center transition-all shadow-sm"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
