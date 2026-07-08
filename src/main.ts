import './style.css';
import { createRowCellEditor } from './app';
import type { AppData } from './types';
import OBR, { Item } from "@owlbear-rodeo/sdk";


// --- Entry point of the App ---
function show_page(data: AppData | undefined, _role: "GM" | "PLAYER", edited_callback: (data: AppData) => void): void {
  const app_div = document.querySelector<HTMLDivElement>('#app');
  if (!app_div) throw new Error('#app element not found');

  const editor = createRowCellEditor(app_div, { onChange: edited_callback });

  if (data === undefined) { data = [] as AppData; }
  editor.load(data);

  // Floating "add row" button, bottom middle of the viewport.
  const fab = document.createElement('button');
  fab.id = "fab";
  fab.type = 'button';
  fab.className = 'fab-add-row';
  fab.title = 'Add row';
  fab.textContent = '+';
  fab.addEventListener('click', () => editor.addRow());
  app_div.appendChild(fab);

}

// ### Owlbear Rodeo Integration ###

const PLAYER_ACCESS_TOKEN: string = "$PLAYER$";

function ID(path: string): string {
  return `io.github.varpeti/${path}`;
}

async function show_data(selection: string[] | undefined, role: "GM" | "PLAYER"): Promise<void> {

  const app_div = document.querySelector<HTMLDivElement>('#app');
  if (!app_div) throw new Error('#app element not found');
  app_div.innerHTML = ``;

  if (!selection || selection.length === 0 || selection.length > 1) {
    return;
  }

  const items: Item[] = await OBR.scene.items.getItems([selection[0]]);
  const item: Item = items[0];
  const data: AppData | undefined = (item?.metadata[ID("metadata")]) as AppData;

  if (role === "GM" || data.some(
    (row) =>
      row.sum.some((c) => c.text.includes(PLAYER_ACCESS_TOKEN)) ||
      row.det.some((c) => c.text.includes(PLAYER_ACCESS_TOKEN))
  )) {
    show_page(
      data,
      role,
      (data: AppData) => { update_data_callback(data, item) }
    );
  }
}

async function update_data_callback(data: AppData, item: Item): Promise<void> {
  await OBR.scene.items.updateItems([item], (items) => {
    for (const item of items) {
      item.metadata[ID("metadata")] = data;
    }
  });
}


OBR.onReady(() => {
  // Show current selection immediately on load
  OBR.player.getSelection().then(
    async (selection) => { show_data(selection, await OBR.player.getRole()) }
  )

  // Keep it live as selection changes
  OBR.player.onChange((player) => {
    show_data(player.selection, player.role);
  });
});
