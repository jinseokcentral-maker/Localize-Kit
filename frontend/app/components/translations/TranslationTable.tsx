import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Copy, Plus } from "lucide-react";
import { cn } from "~/lib/utils";

// Types
export interface TranslationKey {
  id: string;
  key: string;
  context?: string;
  translations: Record<string, string>;
  status: "translated" | "warning" | "missing";
  tags?: string[];
}

interface TranslationTableProps {
  keys: TranslationKey[];
  sourceLang: string;
  targetLangs: string[];
  selectedKeyId: string | null;
  onSelectKey: (id: string) => void;
  onUpdateTranslation?: (params: {
    id: string;
    lang: string;
    value: string;
  }) => void;
}

export const TranslationTable: React.FC<TranslationTableProps> = ({
  keys,
  sourceLang,
  targetLangs,
  selectedKeyId,
  onSelectKey,
  onUpdateTranslation,
}) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[200px]">Key</TableHead>
            <TableHead className="w-[200px]">
              Source ({sourceLang.toUpperCase()})
            </TableHead>
            {targetLangs.map((lang) => (
              <TableHead key={lang} className="min-w-[200px]">
                {lang.toUpperCase()}
              </TableHead>
            ))}
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
                selectedKeyId === item.id &&
                  "bg-muted/80 border-l-4 border-l-primary"
              )}
              onClick={() => onSelectKey(item.id)}
            >
              <TableCell className="font-medium font-mono text-xs text-muted-foreground align-top py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-foreground">{item.key}</span>
                  {item.context && (
                    <span className="text-[10px] text-muted-foreground/70 italic max-w-[180px] truncate">
                      {item.context}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top py-3">
                <div className="text-sm whitespace-pre-wrap max-h-[120px] overflow-hidden">
                  {item.translations[sourceLang] || (
                    <span className="text-muted-foreground italic">Empty</span>
                  )}
                </div>
              </TableCell>
              {targetLangs.map((lang) => (
                <TableCell key={lang} className="align-top py-3">
                  <Textarea
                    value={item.translations[lang] || ""}
                    onChange={(e) =>
                      onUpdateTranslation?.({
                        id: item.id,
                        lang,
                        value: e.target.value,
                      })
                    }
                    placeholder="Type translation..."
                    className={cn(
                      "min-h-[72px] resize-y text-sm bg-background",
                      !item.translations[lang] &&
                        "placeholder:text-muted-foreground"
                    )}
                  />
                </TableCell>
              ))}
              <TableCell className="align-top py-3">
                {item.status === "translated" && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    Verified
                  </Badge>
                )}
                {item.status === "warning" && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    Warning
                  </Badge>
                )}
                {item.status === "missing" && (
                  <Badge
                    variant="outline"
                    className="border-dashed text-muted-foreground"
                  >
                    Missing
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface TranslationCsvListProps {
  keys: TranslationKey[];
  sourceLang: string;
  activeTargetLang: string;
  onUpdateTranslation: (id: string, value: string) => void;
}

export const TranslationCsvList: React.FC<TranslationCsvListProps> = ({
  keys,
  sourceLang,
  activeTargetLang,
  onUpdateTranslation,
}) => {
  return (
    <div className="flex flex-col divide-y divide-border">
      {keys.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                {item.key}
              </code>
              {item.status === "warning" && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {item.translations[sourceLang] || "Empty"}
            </p>
            {item.context && (
              <p className="text-xs text-muted-foreground/60 italic">
                {item.context}
              </p>
            )}
          </div>

          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute -top-2.5 left-2 bg-background px-1 text-[10px] text-muted-foreground font-medium uppercase">
                {activeTargetLang}
              </span>
              <Input
                className="h-full min-h-[60px] py-2"
                value={item.translations[activeTargetLang] || ""}
                onChange={(e) => onUpdateTranslation(item.id, e.target.value)}
                placeholder="Type translation..."
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 self-center">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
      <div className="p-4">
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add new row
        </Button>
      </div>
    </div>
  );
};

interface TranslationDetailPanelProps {
  selectedKey: TranslationKey | null;
  onClose: () => void;
  targetLangs: string[];
}

export const TranslationDetailPanel: React.FC<TranslationDetailPanelProps> = ({
  selectedKey,
  onClose,
  targetLangs,
}) => {
  if (!selectedKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
        <div className="w-12 h-12 mb-4 opacity-20 rounded-full border border-dashed border-muted" />
        <p>Select a key to view details and edit translations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between bg-muted/10">
        <div className="overflow-hidden pr-2">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-mono font-medium truncate text-sm"
              title={selectedKey.key}
            >
              {selectedKey.key}
            </h3>
            <Badge
              variant={
                selectedKey.status === "translated" ? "default" : "secondary"
              }
              className="text-[10px] px-1.5 h-5 capitalize"
            >
              {selectedKey.status}
            </Badge>
          </div>
          {selectedKey.context && (
            <p className="text-xs text-muted-foreground italic">
              {selectedKey.context}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2 -mt-2"
          onClick={onClose}
        >
          <span className="sr-only">Close panel</span>×
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          {/* Source Language */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Source
            </p>
            <div className="p-3 bg-muted/30 rounded-md border border-border text-sm">
              {selectedKey.translations["en"] || "Empty"}
            </div>
          </div>

          <div className="space-y-4">
            {targetLangs.map((lang) => (
              <div key={lang} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-foreground">
                      {lang.toUpperCase().slice(0, 1)}
                    </span>
                    {lang.toUpperCase()}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedKey.translations[lang] ? "Saved" : "Empty"}
                  </span>
                </div>
                <textarea
                  className="min-h-[80px] w-full resize-y text-sm rounded-md border border-border bg-background p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={`Translation for ${lang}...`}
                  defaultValue={selectedKey.translations[lang] || ""}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Information</div>
            <div>Last updated 2 days ago</div>
            <div>By john.doe@example.com</div>
            <div>Version 3</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center">
        <Button variant="outline" size="sm" className="h-8">
          History
        </Button>
        <Button size="sm" className="h-8">
          Save Changes
        </Button>
      </div>
    </div>
  );
};
