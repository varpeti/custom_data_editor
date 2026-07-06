# Custom Data Editor for Owlbear Rodeo

A vanilla TypeScript + Vite app: a vertical list of draggable rows, each with a always-visible
**sum** (summary) and a click-to-expand **det** (detail), both made of draggable **cells**.
Drag-and-drop is powered by [SortableJS](https://github.com/SortableJS/Sortable).

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## Interactions

- **Toggle a row**: click anywhere on its summary (not the drag handle) to show/hide the detail.
- **Reorder rows**: drag the `⠿` handle on the left of a row.
- **Move/reorder cells**: drag any cell anywhere.
- **Create a row**:  use the floating `+` button at the bottom of the page.
- **Add a cell**: click the small dashed `+` at the end of a summary/detail row.
- **Edit a cell**: right-click it. Commit with `Ctrl/Cmd+Enter` or clicking away, cancel with `Esc`.
- **Delete cell**: clear a cell's text and commit.
- **Delete row**: Remove every cell from a row's summary.

## Integration with Owlbear Rodeo

- **Show**: `function show_page(data: AppData | undefined, edited_callback: (data: AppData) => void): void`
- **Update**: `async function update_data_callback(data: AppData, item: Item): Promise<void>`
