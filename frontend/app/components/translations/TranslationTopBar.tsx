import React from "react";
import {
  ChevronRight,
  Upload,
  Download,
  Plus,
  Code,
  Search,
  Filter,
  ArrowUpDown,
  Table as TableIcon,
  List,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";

interface TranslationTopBarProps {
  projectName: string;
  sourceLang: string;
  targetLangs: string[];
  progress: number;
  onExport: () => void;
  onImport: () => void;
  onPreview: () => void;
}

export const TranslationTopBar: React.FC<TranslationTopBarProps> = ({
  projectName,
  sourceLang,
  targetLangs,
  progress,
  onExport,
  onImport,
  onPreview,
}) => {
  return (
    <div className="sticky top-0 z-30 w-full bg-background border-b border-border">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Projects</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-foreground">{projectName}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{projectName}</h1>
            <Badge variant="outline" className="gap-1 font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
              <span className="font-medium">{sourceLang.toUpperCase()}</span>
              <span>→</span>
              <span className="font-medium">
                {targetLangs.map((l) => l.toUpperCase()).join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Code className="w-4 h-4 mr-2" />
            Preview JSON
          </Button>
          <Separator orientation="vertical" className="h-8 mx-1 hidden md:block" />
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Key
          </Button>
        </div>
      </div>

      {/* Sub-header Metrics */}
      <div className="px-4 pb-4 flex items-center gap-6 text-sm overflow-x-auto">
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-muted-foreground font-medium">
            {progress}% translated
          </span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">25 missing</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Last synced 2h ago</span>
        </div>
      </div>
    </div>
  );
};

interface TranslationFiltersProps {
  viewMode: "excel" | "csv";
  onViewModeChange: (mode: "excel" | "csv") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TranslationFilters: React.FC<TranslationFiltersProps> = ({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="sticky top-[125px] z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-2 px-4 flex flex-col md:flex-row gap-3 items-center justify-between">
      <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search keys or translations..."
            className="pl-9 h-9 bg-background"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="w-[130px] h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="newest">
          <SelectTrigger className="w-[130px] h-9">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
            <SelectItem value="updated">Last Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
        <button
          onClick={() => onViewModeChange("excel")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === "excel"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          Table
        </button>
        <button
          onClick={() => onViewModeChange("csv")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === "csv"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          List
        </button>
      </div>
    </div>
  );
};


