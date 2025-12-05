import { TypoH1, TypoP } from "~/components/typo";

export default function ConverterPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">LocalizeKit</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-muted-foreground hover:text-foreground text-sm">
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 flex">
        {/* Left Panel - CSV Input */}
        <div className="w-1/2 border-r border-border flex flex-col">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <span className="text-muted-foreground">CSV Input</span>
            <button className="text-sm px-3 py-1.5 rounded bg-card border border-border hover:bg-accent">
              Upload
            </button>
          </div>
          <div className="flex-1 p-4">
            <textarea
              className="w-full h-full bg-transparent font-mono text-sm resize-none focus:outline-none"
              placeholder="key,en,ko,ja&#10;hello,Hello,안녕하세요,こんにちは"
            />
          </div>
        </div>

        {/* Right Panel - JSON Output */}
        <div className="w-1/2 flex flex-col">
          <div className="border-b border-border px-4 py-2 flex items-center gap-2">
            <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm">
              EN
            </button>
            <button className="px-3 py-1.5 rounded bg-card text-muted-foreground text-sm hover:bg-accent">
              KO
            </button>
            <button className="px-3 py-1.5 rounded bg-card text-muted-foreground text-sm hover:bg-accent">
              JA
            </button>
          </div>
          <div className="flex-1 p-4 font-mono text-sm">
            <pre className="text-muted-foreground">// en.json</pre>
            <pre>{`{
  "hello": "Hello"
}`}</pre>
          </div>
        </div>
      </main>

      {/* Bottom Toolbar */}
      <footer className="border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output:</span>
            <select className="bg-card border border-border rounded px-2 py-1 text-sm">
              <option>JSON</option>
              <option>YAML</option>
              <option>i18n</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            <span>Nested Keys</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded border border-border text-sm hover:bg-accent">
            Copy
          </button>
          <button className="px-4 py-2 rounded border border-border text-sm hover:bg-accent">
            Download
          </button>
          <button className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90">
            Download All
          </button>
        </div>
      </footer>
    </div>
  );
}

