import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import CodeMirror from "@uiw/react-codemirror";
import { Upload } from "lucide-react";
import { TypoP } from "~/components/typo";
import { csvRainbowTheme, csvRainbowHighlight } from "./csvHighlight";

interface CsvInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (file: File) => void;
}

export function CsvInputPanel({ value, onChange, onFileUpload }: CsvInputPanelProps) {
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
      className="border-r border-border flex flex-col relative"
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
        <TypoP className="text-muted-foreground">CSV Input</TypoP>
        <button
          onClick={open}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary rounded transition-colors"
        >
          <Upload className="size-4" />
          Upload
        </button>
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

