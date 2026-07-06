import Sortable from 'sortablejs';
import type { AppData, RowCellEditor, RowData } from './types';
import { buildRowElement, type RowHost } from './row';
import { serialize } from './serialize';
import { uid } from './utils';

const ROW_GROUP = 'rows';

function defaultRow(): RowData {
  return {
    id: uid(),
    sum: [{ id: uid(), text: 'New' }],
    det: [],
  };
}

const instances = new WeakMap<HTMLElement, RowCellEditor>();

export function createRowCellEditor(
  mountEl: HTMLElement,
  opts?: { onChange?: (data: AppData) => void },
): RowCellEditor {
  const existing = instances.get(mountEl);
  if (existing) {
    if (opts?.onChange) existing.setOnChange(opts.onChange);
    return existing;
  }

  let onChangeCb = opts?.onChange;

  mountEl.classList.add('row-cell-list');

  // Suppresses the "click to expand" toggle for the brief moment right after a drag,
  // since a drag ends with a click event firing on whatever is underneath the pointer.
  let suppressToggle = false;
  const markDragging = () => {
    suppressToggle = true;
  };
  const unmarkDraggingSoon = () => {
    setTimeout(() => {
      suppressToggle = false;
    }, 60);
  };

  function exportData(): void {
    onChangeCb?.(serialize(mountEl));
  }

  function cleanupEmptyRows(): void {
    const rows = Array.from(mountEl.querySelectorAll<HTMLElement>(':scope > .row'));
    for (const rowEl of rows) {
      const sumContainer = rowEl.querySelector('.row-sum');
      const hasSumCells = !!sumContainer?.querySelector(':scope > .cell');
      if (!hasSumCells) {
        rowEl.remove();
      }
    }
  }

  const rowHost: RowHost = {
    onCellSettled() {
      cleanupEmptyRows();
      exportData();
    },
    onCellsChanged() {
      unmarkDraggingSoon();
      cleanupEmptyRows();
      exportData();
    },
  };

  function mountRow(row: RowData, atStart = false): HTMLElement {
    const rowEl = buildRowElement(row, rowHost);
    if (atStart) {
      mountEl.prepend(rowEl);
    } else {
      mountEl.appendChild(rowEl);
    }
    return rowEl;
  }

  function addRow(): void {
    const rowEl = mountRow(defaultRow());
    exportData();
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Row-level drag and drop (reordering rows in the vertical list) ---
  new Sortable(mountEl, {
    group: ROW_GROUP,
    animation: 150,
    handle: '.row-handle',
    draggable: '.row',
    ghostClass: 'row-ghost',
    dragClass: 'row-dragging',
    onStart: markDragging,
    onEnd: () => {
      unmarkDraggingSoon();
      exportData();
    },
  });

  // --- Click on a row's summary toggles its detail visibility ---
  mountEl.addEventListener('click', (e) => {
    if (suppressToggle) return;
    const target = e.target as HTMLElement;
    if (target.closest('.row-handle')) return;
    if (target.closest('.add-cell-btn')) return;
    if (target.closest('.cell.editing')) return;
    if (target.closest('.row-det-wrap')) return; // interacting with detail cells shouldn't collapse it
    const rowEl = target.closest('.row') as HTMLElement | null;
    if (!rowEl) return;
    rowEl.classList.toggle('expanded');
  });

  function load(data: AppData): void {
    mountEl.innerHTML = '';
    data.forEach((row) => mountRow(row));
  }

  const instance: RowCellEditor = {
    load,
    getData: () => serialize(mountEl),
    setOnChange: (cb) => {
      onChangeCb = cb;
    },
    addRow,
  };
  instances.set(mountEl, instance);
  return instance;
}
