import type { CellData } from './types';

export interface CellHost {
  /** Called whenever a cell's text is committed, removed, or otherwise changed */
  onCellSettled(): void;
}

export function buildCellElement(cell: CellData, host: CellHost): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cell';
  el.dataset.cellId = cell.id;
  setCellText(el, cell.text);

  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation(); // don't let this bubble up to the "create new row" handler
    startEditCell(el, host);
  });

  return el;
}

function setCellText(el: HTMLElement, text: string): void {
  el.dataset.text = text;
  el.textContent = text;
}

/** Swaps a cell's rendered text for an <input> or <textarea>, and wires up commit/cancel */
export function startEditCell(cellEl: HTMLElement, host: CellHost): void {
  if (cellEl.classList.contains('editing')) return;

  const originalText = cellEl.dataset.text ?? '';

  cellEl.classList.add('editing');
  cellEl.textContent = '';

  const input = document.createElement("textarea") as HTMLTextAreaElement;
  input.className = 'cell-edit-input';
  input.value = originalText;
  cellEl.appendChild(input);
  input.focus();
  input.select();

  let settled = false;

  const finish = (finalText: string | null) => {
    if (settled) return;
    settled = true;
    cellEl.classList.remove('editing');

    const textToUse = finalText ?? originalText;
    if (textToUse.trim().length === 0) {
      // Empty cell -> deleted
      cellEl.remove();
    } else {
      setCellText(cellEl, textToUse);
    }
    host.onCellSettled();
  };

  const commit = () => finish(input.value);
  const cancel = () => finish(originalText);

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', ((ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      commit();
    }
  }) as EventListener);
}
