import { Languages, Globe, Zap, AlertCircle } from "lucide-react";
import type { ComponentType } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
  warning?: boolean;
}

export function StatsCard({
  title,
  value,
  label,
  icon: Icon,
  trend,
  trendUp,
  warning,
}: StatsCardProps) {
  return (
    <div className="bg-card dark:bg-slate-900 border border-border p-5 rounded-xl shadow-sm flex items-start justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          <span className="text-sm text-muted-foreground font-medium">
            {label}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            warning
              ? "text-amber-500"
              : trendUp
              ? "text-emerald-500"
              : "text-muted-foreground"
          }`}
        >
          {warning ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                trendUp ? "bg-emerald-500" : "bg-slate-400"
              }`}
            ></div>
          )}
          {trend}
        </div>
      </div>
      <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
