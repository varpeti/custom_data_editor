import type { AppData, CellData, RowData } from './types';

function readCells(container: Element): CellData[] {
  return Array.from(container.querySelectorAll<HTMLElement>(':scope > .cell')).map((cellEl) => ({
    id: cellEl.dataset.cellId ?? '',
    text: cellEl.dataset.text ?? '',
  }));
}

/** Walks the live DOM and rebuilds the plain data structure from it. */
export function serialize(listEl: HTMLElement): AppData {
  const rows = Array.from(listEl.querySelectorAll<HTMLElement>(':scope > .row'));
  return rows.map((rowEl): RowData => {
    const sumContainer = rowEl.querySelector('.row-sum')!;
    const detContainer = rowEl.querySelector('.row-det')!;
    return {
      id: rowEl.dataset.rowId ?? '',
      sum: readCells(sumContainer),
      det: readCells(detContainer),
    };
  });
}
