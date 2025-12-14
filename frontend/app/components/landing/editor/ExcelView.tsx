import {
  DataEditor,
  GridCellKind,
  type GridColumn,
  type Item,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { parseCsvData } from "./utils/editorUtils";

interface ExcelViewProps {
  csvText: string;
  onChangeCsv: (csv: string) => void;
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
