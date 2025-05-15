import { type ReadRawTextByBuffer, type ReadFileResponse } from '../type';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const fillMergedCells = (sheet: XLSX.WorkSheet) => {
  const merges = sheet['!merges'] || [];
  for (const merge of merges) {
    const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const value = sheet[startCell]?.v ?? '';

    for (let R = merge.s.r; R <= merge.e.r; ++R) {
      for (let C = merge.s.c; C <= merge.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!sheet[cellRef]) {
          sheet[cellRef] = { t: 's', v: value };
        }
      }
    }
  }
};

const removeEmptyColumns = (rows: any[][]): any[][] => {
  if (rows.length === 0) return rows;

  const colCount = Math.max(...rows.map((row) => row.length));
  const emptyCols: number[] = [];

  for (let c = 0; c < colCount; c++) {
    const isEmpty = rows.every((row) => !row[c] || row[c].toString().trim() === '');
    if (isEmpty) emptyCols.push(c);
  }

  return rows.map((row) => row.filter((_, colIndex) => !emptyCols.includes(colIndex)));
};

const sheetToCsvText = (sheet: XLSX.WorkSheet): string => {
  fillMergedCells(sheet);
  const json = XLSX.utils.sheet_to_json(sheet, {
    // header: 1,
    defval: '',
    raw: false
  });

  const cleaned = removeEmptyColumns(json as any[][]);

  return cleaned
    .map((row) =>
      row
        .map((cell) => {
          if (typeof cell === 'string') {
            return cell.replace(/,/g, '，').replace(/\r?\n/g, ' ');
          }
          return cell ?? '';
        })
        .join(',')
    )
    .join('\n');
};

export const readXlsxRawText = async ({
  buffer
}: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const format2Csv = workbook.SheetNames.map((sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    const csvText = sheetToCsvText(sheet);
    return {
      title: `#${sheetName}`,
      csvText
    };
  });

  const rawText = format2Csv.map((item: any) => item.csvText).join('\n\n---\n\n');

  const formatText = format2Csv
    .map((item: any) => {
      const csvArr = Papa.parse(item.csvText).data as string[][];

      // 统一最大列数
      const maxCol = Math.max(...csvArr.map((row) => row.length));

      // 标题行，自动补齐空单元格
      const header = (csvArr[0] || [])
        .map((v) => v || '')
        .concat(Array.from({ length: maxCol - (csvArr[0]?.length || 0) }, () => ''));

      const rowsMd = csvArr.slice(1).map((row) => {
        const normalized = Array.from({ length: maxCol }, (_, i) =>
          (row[i] ?? '').toString().replace(/\n/g, '\\n')
        );
        return `| ${normalized.join(' | ')} |`;
      });

      return `## ${item.title.replace(/^#/, '')}\n\n| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n${rowsMd.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return {
    rawText,
    formatText
  };
};
