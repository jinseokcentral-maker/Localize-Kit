import {
  DataEditor,
  GridCellKind,
  type GridColumn,
  type Item,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";

interface ExcelViewProps {
  csvText: string;
  onChangeCsv: (csv: string) => void;
}

/**
 * Convert CSV string to 2D array
 * @param csv - CSV content string
 * @returns 2D array of strings (rows x columns)
 */
export function csvTo2D(csv: string): string[][] {
  if (!csv.trim()) return [];
  const lines = csv.replace(/\r\n/g, "\n").split("\n");
  return lines
    .filter((l, i) => l.trim().length > 0 || i === 0)
    .map((line) => line.split(","));
}

/**
 * Parse CSV into headers and rows
 */
export function parseCsvData(csv: string): {
  headers: string[];
  rows: string[][];
} {
  const twoD = csvTo2D(csv);
  const headers = twoD[0] ?? [];
  const rows = twoD.slice(1);
  return { headers, rows };
}

/**
 * Create grid columns from headers
 */
export function createGridColumns(headers: string[]): GridColumn[] {
  return headers.map((h) => ({
    title: h,
    width: 200,
    grow: 1,
  }));
}

export function ExcelView({ csvText }: ExcelViewProps) {
  const parsed = parseCsvData(csvText);
  const columns = createGridColumns(parsed.headers);

  function getCellContent([col, row]: Item) {
    const value = parsed.rows[row]?.[col] ?? "";
    return {
      kind: GridCellKind.Text as const,
      data: value,
      displayData: value,
      allowOverlay: false, // 편집 비활성화 (Pro 기능)
      readonly: true,
    };
  }

  const rowCount = Math.max(1, parsed.rows.length);

  return (
    <div className="w-full h-full min-h-[300px]">
      <DataEditor
        columns={columns}
        rows={rowCount}
        getCellContent={getCellContent}
        rowMarkers="number"
        smoothScrollX
        smoothScrollY
        width="100%"
        height="100%"
        getCellsForSelection={true}
      />
    </div>
  );
}
