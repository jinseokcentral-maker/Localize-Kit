import { Copy, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { TypoSmall } from "~/components/typo";
import type { OutputFormat } from "./EditorSection";

interface EditorControlsProps {
  outputFormat: OutputFormat;
  onOutputFormatChange: (format: OutputFormat) => void;
  nestedKeys: boolean;
  onNestedKeysChange: (checked: boolean) => void;
  onCopy: () => void;
  onDownload: () => void;
  onDownloadAll: () => void;
}

export function EditorControls({
  outputFormat,
  onOutputFormatChange,
  nestedKeys,
  onNestedKeysChange,
  onCopy,
  onDownload,
  onDownloadAll,
}: EditorControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-border">
      {/* Left: Output format & Nested Keys */}
      <div className="flex items-center gap-6">
        {/* Output Format Dropdown */}
        <div className="flex items-center gap-2">
          <TypoSmall className="text-muted-foreground">Output:</TypoSmall>
          <Select
            value={outputFormat}
            onValueChange={(value) =>
              onOutputFormatChange(value as OutputFormat)
            }
          >
            <SelectTrigger className="w-[100px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nested Keys Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="nested-keys"
            checked={nestedKeys}
            onCheckedChange={(checked) => onNestedKeysChange(checked === true)}
          />
          <Label
            htmlFor="nested-keys"
            className="text-sm text-foreground cursor-pointer"
          >
            Nested Keys
          </Label>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-9" onClick={onCopy}>
          <Copy className="size-4 mr-2" />
          Copy
        </Button>
        <Button variant="outline" className="h-9" onClick={onDownload}>
          <Download className="size-4 mr-2" />
          Download
        </Button>
        <Button className="h-9" onClick={onDownloadAll}>
          <Download className="size-4 mr-2" />
          Download All
        </Button>
      </div>
    </div>
  );
}
