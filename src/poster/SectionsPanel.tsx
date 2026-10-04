import { useState } from 'react';
import { usePosterStore } from '../store/posterStore';
import { blockNames, makeBlock } from './blocks';
import type { BlockKind } from './posterTypes';
export function SectionsPanel() {
  const s = usePosterStore();
  const [kind, setKind] = useState<BlockKind>('info');
  const [dragged, setDragged] = useState<string | null>(null);
  const sections = [...s.document.elements]
    .filter(
      (e) =>
        e.block || ['resource', 'text', 'image', 'footer', 'qrcode', 'divider'].includes(e.type),
    )
    .sort((a, b) => a.zIndex - b.zIndex);
  const move = (id: string, to: string) => {
    const list = [...s.document.elements].sort((a, b) => a.zIndex - b.zIndex),
      i = list.findIndex((e) => e.id === id),
      j = list.findIndex((e) => e.id === to);
    if (i < 0 || j < 0 || list[i].locked || list[j].locked) return;
    const [item] = list.splice(i, 1);
    list.splice(j, 0, item);
    const a = s.document.elements.find((e) => e.id === id)!,
      b = s.document.elements.find((e) => e.id === to)!;
    s.change({
      ...s.document,
      elements: list.map((e, zIndex) => ({
        ...e,
        zIndex,
        ...(e.id === id
          ? { x: b.x, y: b.y, width: b.width, height: b.height }
          : e.id === to
            ? { x: a.x, y: a.y, width: a.width, height: a.height }
            : {}),
      })),
    });
  };
  return (
    <>
      <h2 className="sidebar-title">Sections</h2>
      <div className="section-add">
        <select
          aria-label="New section type"
          value={kind}
          onChange={(e) => setKind(e.target.value as BlockKind)}
        >
          {Object.entries(blockNames).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => s.add(makeBlock(kind, {}, { x: 32, y: 360 }))}>+ Add Section</button>
      </div>
      <ol className="section-list">
        {sections.map((e, i) => {
          const label = e.block?.label || e.text.slice(0, 25) || e.type;
          return (
            <li
              key={e.id}
              data-section-id={e.id}
              draggable={!e.locked}
              onDragStart={() => setDragged(e.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged) move(dragged, e.id);
                setDragged(null);
              }}
              className={s.selected === e.id ? 'selected' : ''}
            >
              <button
                className="section-select"
                aria-pressed={s.selected === e.id}
                onClick={() => s.select(e.id)}
              >
                ☰ {label}
              </button>
              <div className="section-row-actions">
                <button
                  aria-label={`${e.visible ? 'Hide' : 'Show'} section ${label}`}
                  onClick={() => s.update(e.id, { visible: !e.visible })}
                >
                  {e.visible ? '◉' : '○'}
                </button>
                <button
                  aria-label={`Move section ${label} up`}
                  disabled={i === 0 || e.locked}
                  onClick={() => move(e.id, sections[i - 1].id)}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move section ${label} down`}
                  disabled={i === sections.length - 1 || e.locked}
                  onClick={() => move(e.id, sections[i + 1].id)}
                >
                  ↓
                </button>
                <button aria-label={`Duplicate section ${label}`} onClick={() => s.duplicate(e.id)}>
                  ⧉
                </button>
                <button
                  aria-label={`Delete section ${label}`}
                  disabled={e.locked}
                  onClick={() => s.remove(e.id)}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="muted">Drag to reorder, or use ↑ / ↓.</p>
    </>
  );
}
