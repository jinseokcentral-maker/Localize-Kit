import { useCallback, useMemo } from "react";
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

function csvTo2D(csv: string): string[][] {
  const lines = csv.replace(/\r\n/g, "\n").split("\n");
  return lines
    .filter((l, i) => l.trim().length > 0 || i === 0)
    .map((line) => line.split(","));
}

export function ExcelView({ csvText }: ExcelViewProps) {
  // CSV 파싱
  const parsed = useMemo(() => {
    const twoD = csvTo2D(csvText);
    const headers = twoD[0] ?? [];
    const rows = twoD.slice(1);
    return { headers, rows };
  }, [csvText]);

  // 컬럼 정의
  const columns: GridColumn[] = useMemo(
    () =>
      parsed.headers.map((h) => ({
        title: h,
        width: 200,
        grow: 1,
      })),
    [parsed.headers]
  );

  // 셀 데이터 제공 (읽기 전용)
  const getCellContent = useCallback(
    ([col, row]: Item) => {
      const value = parsed.rows[row]?.[col] ?? "";
      return {
        kind: GridCellKind.Text as const,
        data: value,
        displayData: value,
        allowOverlay: false, // 편집 비활성화 (Pro 기능)
        readonly: true,
      };
    },
    [parsed.rows]
  );

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
