import Sortable from 'sortablejs';
import type { RowData, CellData } from './types';
import { buildCellElement, startEditCell, type CellHost } from './cell';
import { uid } from './utils';

export interface RowHost extends CellHost {
  onCellsChanged(): void;
}

const CELL_GROUP = 'cells';

function createAddCellButton(container: HTMLElement, host: RowHost): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'add-cell-btn';
  btn.textContent = '+';
  btn.title = 'Add cell';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cell: CellData = { id: uid(), text: '' };
    const cellEl = buildCellElement(cell, host);
    container.appendChild(cellEl);
    startEditCell(cellEl, host);
  });
  return btn;
}

function attachCellSortable(container: HTMLElement, host: RowHost): void {
  new Sortable(container, {
    group: CELL_GROUP,
    animation: 150,
    draggable: '.cell',
    ghostClass: 'cell-ghost',
    dragClass: 'cell-dragging',
    onEnd: () => host.onCellsChanged(),
  });
}

function buildCellContainer(
  role: 'sum' | 'det',
  cells: CellData[],
  host: RowHost,
): { wrap: HTMLElement; container: HTMLElement } {
  const wrap = document.createElement('div');
  wrap.className = `row-${role}-wrap`;

  const container = document.createElement('div');
  container.className = `row-${role} cell-container`;
  container.dataset.role = role;
  cells.forEach((c) => container.appendChild(buildCellElement(c, host)));

  const addBtn = createAddCellButton(container, host);
  wrap.append(container, addBtn);
  attachCellSortable(container, host);

  return { wrap, container };
}

export function buildRowElement(row: RowData, host: RowHost): HTMLElement {
  const rowEl = document.createElement('div');
  rowEl.className = 'row';
  rowEl.dataset.rowId = row.id;

  const main = document.createElement('div');
  main.className = 'row-main';

  const handle = document.createElement('div');
  handle.className = 'row-handle';
  handle.title = 'Drag to reorder row';
  handle.textContent = '⠿';

  const body = document.createElement('div');
  body.className = 'row-body';

  const { wrap: sumWrap } = buildCellContainer('sum', row.sum, host);
  const { wrap: detWrap } = buildCellContainer('det', row.det, host);
  detWrap.classList.add('row-det-wrap');
  sumWrap.classList.add('row-sum-wrap');

  body.append(sumWrap, detWrap);
  main.append(handle, body);
  rowEl.append(main);

  return rowEl;
}
