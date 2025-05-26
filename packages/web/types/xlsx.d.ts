// xlsx.d.ts

declare module 'xlsx' {
  export type CellObject = {
    t: string; // type: 's', 'n', 'b', 'd', etc.
    v: any; // value
  };

  export interface Range {
    s: { r: number; c: number }; // start row/col
    e: { r: number; c: number }; // end row/col
  }

  export interface WorkSheet {
    [cell: string]: CellObject | any;
    '!ref'?: string;
    '!merges'?: Range[];
  }

  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheetName: string]: WorkSheet };
  }

  export function read(data: any, options?: { type: string; cellDates?: boolean }): WorkBook;

  export const utils: {
    encode_cell(cell: { r: number; c: number }): string;
    sheet_to_json(
      sheet: WorkSheet,
      options?: {
        header?: number | string[];
        defval?: any;
        raw?: boolean;
      }
    ): any[];
  };
}
