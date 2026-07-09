import './style.css';
import { createRowCellEditor } from './app';
import type { AppData } from './types';
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { CDPlayer, CDPermissions, gm_editor } from './gm_editor';

function ID(path: string): string {
  return `io.github.varpeti/${path}`;
}

function show_page(
  app_div: HTMLDivElement,
  data: AppData,
  data_edited_callback: ((data: AppData) => void) | null,
): void {
  const custom_data_div = document.createElement("div") as HTMLDivElement;
  app_div.appendChild(custom_data_div);

  if (data_edited_callback === null) {
    const editor = createRowCellEditor(custom_data_div, { onChange: (_) => { } });
    editor.load(data);
    return;
  }

  const editor = createRowCellEditor(custom_data_div, { onChange: data_edited_callback });
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

async function prepare_data_for_show_page(selection: string[] | undefined, player: CDPlayer): Promise<void> {

  const app_div = document.querySelector<HTMLDivElement>('#app');
  if (!app_div) throw new Error('#app element not found');
  app_div.innerHTML = ``;

  if (!selection || selection.length === 0 || selection.length > 1) {
    return;
  }

  const items: Item[] = await OBR.scene.items.getItems([selection[0]]);
  const item: Item = items[0];

  const item_name = document.createElement("span") as HTMLSpanElement;
  item_name.innerText = (item as any).text?.plainText ?? item.name;
  item_name.className = "item-name";
  app_div.appendChild(item_name);

  let data: AppData | undefined = (item?.metadata[ID("custom_data")]) as AppData;
  if (data === undefined) { data = [] as AppData; }
  const data_edited_callback = (data: AppData) => { update_data_callback(data, item) };
  let permissions: CDPermissions | undefined = (item?.metadata[ID("custom_data_permissions")]) as CDPermissions;
  if (permissions === undefined) { permissions = { view: [], edit: [] } as CDPermissions };

  if (player.role === "GM") {
    show_page(app_div, data, data_edited_callback);

    let players = await OBR.party.getPlayers();
    let cdplayers: CDPlayer[] = [];
    for (let p of players) { cdplayers.push(new CDPlayer(p.id, p.name, p.role)); }
    gm_editor(
      app_div,
      data,
      data_edited_callback,
      permissions,
      (permissions: CDPermissions) => { update_permissions_callback(permissions, item) },
      cdplayers,
      () => { setTimeout(() => { prepare_data_for_show_page(selection, player); }, 200); }
    );
  }
  else if (
    permissions.edit.includes(player.id) ||
    permissions.edit.includes(player.name)
  ) {
    show_page(app_div, data, data_edited_callback);
  } else if (
    permissions.view.includes(player.id) ||
    permissions.view.includes(player.name)
  ) {
    show_page(app_div, data, null);
  }
  else {
    console.log("permissions", permissions, "player", player);
  }
}

async function update_data_callback(data: AppData, item: Item): Promise<void> {
  await OBR.scene.items.updateItems([item], (items) => {
    for (const item of items) {
      item.metadata[ID("custom_data")] = data;
    }
  });
}

async function update_permissions_callback(permissions: CDPermissions, item: Item): Promise<void> {
  await OBR.scene.items.updateItems([item], (items) => {
    for (const item of items) {
      item.metadata[ID("custom_data_permissions")] = permissions;
    }
  });
}

OBR.onReady(async () => {

  const playerdata = new CDPlayer(
    await OBR.player.getId(),
    await OBR.player.getName(),
    await OBR.player.getRole(),
  );

  // Show current selection immediately on load
  OBR.player.getSelection().then(
    (selection) => { prepare_data_for_show_page(selection, playerdata) }
  )

  // Keep it live as selection changes
  OBR.player.onChange((player) => {
    prepare_data_for_show_page(player.selection, playerdata);
  });
});
