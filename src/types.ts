export interface CellData {
  id: string;
  text: string;
}

export interface RowData {
  id: string;
  /** Always-visible summary cells */
  sum: CellData[];
  /** Cells hidden until the row is expanded */
  det: CellData[];
}

export type AppData = RowData[];

export interface RowCellEditor {
  /** Replace all current rows with the given data (used to load data from a host app) */
  load(data: AppData): void;
  /** Read the current state straight from the DOM */
  getData(): AppData;
  /** Register (or replace) the callback fired after every mutation */
  setOnChange(cb: (data: AppData) => void): void;
  /** Create a new row with default values, same as the [+] button / right-click */
  addRow(): void;
}
