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

## GM Editor

- List of all players - draggable
- List of Editors/Viewers - draggable, right-click to remove
- Copy/Paste - Copy the json data to save it, paste to load it
  - It is not synchronized with the main editor, reselect the item to update before copy
  - It re-renders the whole editor after commit with `Ctrl/Cmd+Enter` or clicking away, but it can be buggy
