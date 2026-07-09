import './style.css';
import type { AppData } from './types';
import Sortable from 'sortablejs';

export class CDPlayer {
  id: string;
  name: string;
  role: "GM" | "PLAYER";

  constructor(id: string, name: string, role: "GM" | "PLAYER") {
    this.id = id;
    this.name = name;
    this.role = role;
  }
}

export interface CDPermissions {
  /** List of id or name who can View the AppData*/
  view: string[];
  /** List of id or name who can Edit the AppData*/
  edit: string[];
}

export function gm_editor(
  app_div: HTMLDivElement,
  data: AppData,
  data_edited_callback: ((data: AppData) => void),
  permissions: CDPermissions,
  permissions_edited_callback: ((permissions: CDPermissions) => void),
  players: CDPlayer[],
  retrigger_callback: () => void,
): void {

  const gm_editor_div = document.createElement('div') as HTMLDivElement;
  app_div.appendChild(gm_editor_div);

  gm_editor_div.classList.add("gm-editor");

  function displayNameFor(idOrName: string): string {
    const p = players.find((pl) => pl.id === idOrName || pl.name === idOrName);
    return p ? p.name : idOrName;
  }

  function makeSection(title: string): { row: HTMLDivElement; list: HTMLDivElement } {
    const row = document.createElement("div");
    row.className = "row";

    const rowMain = document.createElement("div");
    rowMain.className = "row-main";
    row.appendChild(rowMain);

    const handle = document.createElement("div");
    handle.className = "row-title";
    handle.textContent = title;
    rowMain.appendChild(handle);

    const rowBody = document.createElement("div");
    rowBody.className = "row-body";
    rowMain.appendChild(rowBody);

    const rowSumWrap = document.createElement("div");
    rowSumWrap.className = "row-sum-wrap";
    rowBody.appendChild(rowSumWrap);

    const list = document.createElement("div");
    list.className = "row-sum cell-container";
    rowSumWrap.appendChild(list);

    gm_editor_div.appendChild(row);
    return { row, list };
  }

  function attachRemoveOnRightClick(cell: HTMLSpanElement, onRemove: () => void): void {
    cell.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      cell.remove();
      onRemove();
    });
  }

  function makeListItem(idOrName: string, removable: boolean, onRemove?: () => void): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = "cell";
    span.dataset.id = idOrName;
    span.textContent = displayNameFor(idOrName);

    if (removable && onRemove) {
      span.title = "Right-click to remove";
      attachRemoveOnRightClick(span, onRemove);
    }

    return span;
  }

  function readListIds(list: HTMLDivElement): string[] {
    return Array.from(list.querySelectorAll<HTMLSpanElement>(".cell")).map(
      (cell) => cell.dataset.id as string,
    );
  }

  // ---- 1) All players list (drag source; clone so the master list stays intact) ----
  const { list: playersList } = makeSection("All Players");
  for (const p of players) {
    playersList.appendChild(makeListItem(p.id, false));
  }

  // ---- 2) Editors list ----
  const { list: editorsList } = makeSection("Editors");
  for (const idOrName of permissions.edit) {
    editorsList.appendChild(makeListItem(idOrName, true, emitPermissionsChange));
  }

  // ---- 3) Viewers list ----
  const { list: viewersList } = makeSection("Viewers");
  for (const idOrName of permissions.view) {
    viewersList.appendChild(makeListItem(idOrName, true, emitPermissionsChange));
  }

  function emitPermissionsChange(): void {
    const newPermissions: CDPermissions = {
      edit: readListIds(editorsList),
      view: readListIds(viewersList),
    };
    permissions.edit = newPermissions.edit;
    permissions.view = newPermissions.view;
    if (permissions_edited_callback) {
      permissions_edited_callback(newPermissions);
    }
  }

  // ---- Sortable wiring: drag from "All Players" into Editors/Viewers, ----
  // ---- and drag between Editors/Viewers to move someone's role.       ----
  Sortable.create(playersList, {
    group: { name: "gm-players", pull: "clone", put: false },
    sort: false,
    animation: 150,
    ghostClass: "cell-ghost",
    dragClass: "cell-dragging",
  });

  function wireTargetList(list: HTMLDivElement): void {
    Sortable.create(list, {
      group: { name: "gm-players", pull: true, put: ["gm-players"] },
      animation: 150,
      ghostClass: "cell-ghost",
      dragClass: "cell-dragging",
      onAdd: (evt: any) => {
        const item = evt.item as HTMLSpanElement;
        item.title = "Right-click to remove";
        attachRemoveOnRightClick(item, emitPermissionsChange);
        emitPermissionsChange();
      },
      onRemove: emitPermissionsChange,
      onUpdate: emitPermissionsChange,
    });
  }

  wireTargetList(editorsList);
  wireTargetList(viewersList);

  // ---- 4) Data JSON copy/paste (row > details/summary, no row-main/row-title/row-body) ----
  const dataRow = document.createElement("div");
  dataRow.className = "row";
  gm_editor_div.appendChild(dataRow);

  const details = document.createElement("details");
  dataRow.appendChild(details);

  const summary = document.createElement("summary");
  summary.textContent = "Copy/Paste";
  details.appendChild(summary);

  const textarea = document.createElement("textarea");
  textarea.className = "cell-edit-input";
  textarea.rows = 15;
  textarea.value = JSON.stringify(data, null, 2);
  details.appendChild(textarea);

  const errorMsg = document.createElement("div");
  errorMsg.style.color = "var(--shadow)";
  errorMsg.style.padding = "0 0.5rem 0.5rem";
  details.appendChild(errorMsg);

  function commit(): void {
    try {
      const parsed = JSON.parse(textarea.value);
      errorMsg.textContent = "";
      if (data_edited_callback) {
        data_edited_callback(parsed);
        retrigger_callback();
      }
    } catch (e) {
      errorMsg.textContent = "Invalid JSON: " + (e as Error).message;
    }
  }

  function cancel(): void {
    textarea.value = JSON.stringify(data, null, 2);
    errorMsg.textContent = "";
    textarea.blur();
  }

  textarea.addEventListener('blur', commit);
  textarea.addEventListener('keydown', ((ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      commit();
    }
  }) as EventListener);
}
