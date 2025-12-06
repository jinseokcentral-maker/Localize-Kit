import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Zap, TrendingUp, Timer } from "lucide-react";
import { TypoH1, TypoP, TypoSmall } from "~/components/typo";

const benchmarkData = [
  { name: "Small (1k)", wasm: 18, js: 90 },
  { name: "Medium (5k)", wasm: 42, js: 210 },
  { name: "Large (10k)", wasm: 80, js: 400 },
  { name: "XL (20k)", wasm: 160, js: 780 },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const [wasm, js] = payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <TypoSmall className="font-semibold">{wasm?.payload?.name}</TypoSmall>
      <div className="mt-1 space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-primary" />
          <span>LocalizeKit (WASM): {wasm?.value} ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-muted-foreground/60" />
          <span>Standard JS: {js?.value} ms</span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content & Stats */}
          <div>
            <div className="flex items-center gap-2 text-primary mb-4 font-medium">
              <Zap className="w-5 h-5" />
              <span>Blazingly Fast Performance</span>
            </div>
            <TypoH1 className="text-3xl sm:text-4xl mb-6 leading-tight">
              Powered by Rust &amp;
              <br className="hidden lg:block" />
              WebAssembly
            </TypoH1>
            <TypoP className="text-lg mb-8 leading-relaxed">
              LocalizeKit utilizes a high-performance WASM engine to parse and
              transform your files. Experience real-time previews even with
              large datasets.
            </TypoP>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Speed"
                value="5x"
                helper="Faster than JS"
              />
              <StatCard
                icon={<Timer className="w-5 h-5" />}
                label="Latency"
                value="~80ms"
                helper="For 10k rows"
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                label="Engine"
                value="Rust"
                helper="WASM Core"
              />
            </div>
          </div>

          {/* Right: Chart */}
          <div className="bg-card/50 border border-border rounded-xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <div className="relative z-10">
              <div className="mb-6">
                <h3 className="font-semibold text-lg">
                  Parsing Performance (ms)
                </h3>
                <p className="text-sm text-muted-foreground">Lower is better</p>
              </div>
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={benchmarkData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    barSize={20}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal
                      vertical={false}
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground ml-1">
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="wasm"
                      name="LocalizeKit (WASM)"
                      fill="var(--primary)"
                      radius={[0, 4, 4, 0]}
                      animationDuration={1200}
                    />
                    <Bar
                      dataKey="js"
                      name="Standard JS (SheetJS, PapaParse)"
                      fill="var(--muted-foreground)"
                      radius={[0, 4, 4, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
