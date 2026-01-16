import { CUSTOM_SPLIT_SIGN } from '@fastgpt/global/common/string/textSplitter';
import { type ReadRawTextByBuffer, type ReadFileResponse } from '../type';
import * as XLSX from 'xlsx';
import xlsx from 'node-xlsx';

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

// 日期格式化
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// 将 xlsx 转换为 node-xlsx 风格
function convertWorkbookToNodeXlsxStyle(workbook: XLSX.WorkBook) {
  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    // ✅ 空 sheet 兜底
    if (!worksheet || !worksheet['!ref']) {
      return {
        name: sheetName,
        data: []
      };
    }

    if (worksheet['!merges']?.length) {
      fillMergedCells(worksheet);
    }

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: ''
    }) as any[][];

    if (!rawData.length) {
      return {
        name: sheetName,
        data: []
      };
    }

    const cleaned = removeEmptyColumns(rawData);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const maxCols = Math.max(range.e.c + 1, ...cleaned.map((r) => r.length));

    return {
      name: sheetName,
      data: cleaned.map((row) =>
        Array.from({ length: maxCols }, (_, i) => {
          const cell = row[i];
          if (cell instanceof Date) return formatDate(cell);
          return cell ?? '';
        })
      )
    };
  });
}

export const readXlsxRawText = async ({
  buffer
}: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
  // const temp = xlsx.parse(buffer, { skipHidden: false, defval: '' });
  // 使用 xlsx 官方库解析 Excel
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: true });

  // 转成 node-xlsx 风格
  const result = convertWorkbookToNodeXlsxStyle(workbook);

  // 生成 CSV 文本
  const format2Csv = result.map(({ name, data }) => ({
    title: `#${name}`,
    csvText: data.map((row) => row.join(',')).join('\n')
  }));
  const rawText = format2Csv.map((item) => item.csvText).join('\n');

  const formatText = result
    .map(({ data }) => {
      const header = data[0];
      if (!header) return;

      const table = `| ${header.join(' | ')} |
| ${header.map(() => '---').join(' | ')} |
${data
  .slice(1)
  .map((row) => `| ${row.map((cell) => String(cell).replace(/\n/g, '\\n')).join(' | ')} |`)
  .join('\n')}`;

      return table;
    })
    .filter(Boolean)
    .join(CUSTOM_SPLIT_SIGN);

  const snExcelData = result
    .map(({ data, name }) => {
      const header = data[0];
      if (!header) return;

      const table = `| ${header.join(' | ')} |
| ${header.map(() => '---').join(' | ')} |
${data
  .slice(1)
  .map((row) => `| ${row.map((cell) => String(cell).replace(/\n/g, '\\n')).join(' | ')} |`)
  .join('\n')}`;

      return `-----SN-${name}-SN-----${table}`;
    })
    .filter(Boolean)
    .join(CUSTOM_SPLIT_SIGN);

  return {
    rawText,
    formatText,
    snExcelData
  };
};
