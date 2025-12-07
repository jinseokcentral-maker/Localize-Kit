import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import CodeMirror from "@uiw/react-codemirror";
import { Upload, Maximize2, X } from "lucide-react";
import { TypoP, TypoSmall } from "~/components/typo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { csvRainbowTheme, csvRainbowHighlight } from "./csvHighlight";
import type { Separator } from "./EditorSection";

interface CsvInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  separator: Separator;
  onSeparatorChange: (separator: Separator | null) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function CsvInputPanel({ 
  value, 
  onChange, 
  onFileUpload,
  separator,
  onSeparatorChange,
  isFullscreen = false,
  onToggleFullscreen,
}: CsvInputPanelProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className="border-r border-border flex flex-col relative h-full min-h-0"
    >
      <input {...getInputProps()} />

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-10 flex items-center justify-center">
          <TypoP className="text-primary font-medium">Drop your CSV or Excel file here</TypoP>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <div className="flex items-center gap-3">
          <TypoP className="text-muted-foreground">CSV Input</TypoP>
          {/* Separator Select */}
          <div className="flex items-center gap-1.5">
            <TypoSmall className="text-muted-foreground">Sep:</TypoSmall>
            <Select
              value={separator}
              onValueChange={(value) => onSeparatorChange(value as Separator)}
            >
              <SelectTrigger className="w-24 h-7 text-xs px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".">. (dot)</SelectItem>
                <SelectItem value="/">/ (slash)</SelectItem>
                <SelectItem value="-">- (dash)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={open}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary rounded transition-colors"
          >
            <Upload className="size-4" />
            Upload
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <X className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={csvRainbowTheme}
          extensions={[csvRainbowHighlight()]}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightSelectionMatches: false,
          }}
          className="h-full font-mono text-sm"
          style={{
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}

