import { convertContent } from './blocks';
import type { PosterElement, BlockContent, BlockKind } from './posterTypes';
import { readLocalImage } from './images';
export function BlockProperties({
  element: e,
  update,
  onReplaceContent,
  onMessage,
}: {
  element: PosterElement;
  update: (p: Partial<PosterElement>) => void;
  onReplaceContent: () => void;
  onMessage: (message: string) => void;
}) {
  const b = e.block!;
  const patch = (value: Partial<BlockContent>) => {
    const next = { ...b, ...value };
    update({
      block: next,
      text: next.kind === 'qr' ? next.body : next.title || next.body || next.label,
    });
  };
  const text = (label: string, key: 'title' | 'subtitle' | 'body' | 'label') => (
    <label>
      {label}
      <textarea
        aria-label={label}
        value={b[key]}
        onChange={(event) => patch({ [key]: event.target.value })}
      />
    </label>
  );
  const image = ['hero', 'image'].includes(b.kind),
    table = ['table', 'schedule'].includes(b.kind),
    list = ['list', 'checklist'].includes(b.kind);
  return (
    <div className="block-properties">
      <h3>{b.label}</h3>
      <label>
        Section name
        <input value={b.label} onChange={(event) => patch({ label: event.target.value })} />
      </label>
      {image ? (
        <>
          <label className="button upload-button">
            Replace Image
            <input
              aria-label="Replace Image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file)
                  try {
                    update({ src: await readLocalImage(file), imageError: false });
                    onMessage('Image replaced. Your image stays in this browser.');
                  } catch (error) {
                    onMessage((error as Error).message);
                  }
              }}
            />
          </label>
          <label>
            Fit mode
            <select
              value={b.fitMode}
              onChange={(event) =>
                patch({ fitMode: event.target.value as BlockContent['fitMode'] })
              }
            >
              {['cover', 'contain', 'fill'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {(['zoom', 'offsetX', 'offsetY', 'overlay'] as const).map((key, i) => (
            <label key={key}>
              {['Image zoom', 'Horizontal position', 'Vertical position', 'Overlay opacity'][i]}
              <input
                aria-label={
                  ['Image zoom', 'Horizontal position', 'Vertical position', 'Overlay opacity'][i]
                }
                type="range"
                min={key === 'zoom' ? 1 : key === 'overlay' ? 0 : -1}
                max={key === 'zoom' ? 5 : 1}
                step={0.05}
                value={b[key]}
                onChange={(event) => patch({ [key]: Number(event.target.value) })}
              />
            </label>
          ))}
          <label>
            Overlay colour
            <input
              type="color"
              value={b.overlayColor}
              onChange={(event) => patch({ overlayColor: event.target.value })}
            />
          </label>
        </>
      ) : (
        <>
          {['info', 'highlight', 'list', 'checklist', 'table', 'schedule'].includes(b.kind) && (
            <>
              <button onClick={onReplaceContent}>Replace Content</button>
              <label>
                Content mode
                <select
                  value={b.kind}
                  onChange={(event) => patch(convertContent(b, event.target.value as BlockKind))}
                >
                  {[
                    ['info', 'Info Card'],
                    ['highlight', 'Highlight Card'],
                    ['list', 'Bullet List'],
                    ['checklist', 'Checklist'],
                    ['table', 'Table / Key-Value'],
                    ['schedule', 'Schedule'],
                  ].map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {!['divider', 'qr'].includes(b.kind) && (
            <>
              {['title', 'greeting', 'text', 'footer'].includes(b.kind) ? (
                <>
                  {b.kind === 'text' && b.title && text('Section title', 'title')}
                  {text('Editable text', b.kind === 'title' ? 'title' : 'body')}
                </>
              ) : (
                <>
                  {text('Section title', 'title')}
                  {text('Subtitle', 'subtitle')}
                  {!table && !list && text('Body', 'body')}
                </>
              )}
              {b.kind !== 'title' && (
                <label>
                  Icon
                  <select value={b.icon} onChange={(event) => patch({ icon: event.target.value })}>
                    {['', '★', '⌂', '✓', '♡', '→', '!', '↗'].map((v) => (
                      <option key={v} value={v}>
                        {v || 'None'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          {b.kind === 'qr' && text('QR destination URL', 'body')}
          {b.kind === 'title' && (
            <label>
              Banner style
              <select
                value={b.bannerStyle}
                onChange={(event) =>
                  patch({ bannerStyle: event.target.value as BlockContent['bannerStyle'] })
                }
              >
                {['solid', 'brush', 'underline'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
          {list && (
            <div className="list-properties">
              {b.items.map((item, i) => (
                <div key={i}>
                  <input
                    aria-label={`Item ${i + 1}`}
                    value={item}
                    onChange={(event) =>
                      patch({ items: b.items.map((v, j) => (j === i ? event.target.value : v)) })
                    }
                  />
                  <button
                    aria-label={`Move item ${i + 1} up`}
                    disabled={i === 0}
                    onClick={() => {
                      const items = [...b.items];
                      [items[i - 1], items[i]] = [items[i], items[i - 1]];
                      patch({ items });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Remove item ${i + 1}`}
                    onClick={() => patch({ items: b.items.filter((_, j) => j !== i) })}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => patch({ items: [...b.items, 'New item'] })}>Add Item</button>
            </div>
          )}
          {table && (
            <div className="table-properties">
              <h4>Columns</h4>
              {b.columns.map((c, i) => (
                <div className="column-property" key={i}>
                  <input
                    aria-label={`Column ${i + 1}`}
                    value={c}
                    onChange={(event) =>
                      patch({
                        columns: b.columns.map((v, j) => (j === i ? event.target.value : v)),
                      })
                    }
                  />
                  <select
                    aria-label={`Column ${i + 1} alignment`}
                    value={b.columnAlign[i] || 'left'}
                    onChange={(event) =>
                      patch({
                        columnAlign: b.columns.map((_, j) =>
                          j === i ? (event.target.value as 'left') : b.columnAlign[j] || 'left',
                        ),
                      })
                    }
                  >
                    {['left', 'center', 'right'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <button
                    aria-label={`Delete column ${i + 1}`}
                    disabled={b.columns.length === 1}
                    onClick={() =>
                      patch({
                        columns: b.columns.filter((_, j) => j !== i),
                        rows: b.rows.map((r) => r.filter((_, j) => j !== i)),
                        columnAlign: b.columnAlign.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                disabled={b.columns.length >= 6}
                onClick={() =>
                  patch({
                    columns: [...b.columns, 'Column'],
                    rows: b.rows.map((r) => [...r, '']),
                    columnAlign: [...b.columnAlign, 'left'],
                  })
                }
              >
                Add Column
              </button>
              <h4>Rows</h4>
              {b.rows.map((row, i) => (
                <fieldset key={i}>
                  <legend>Row {i + 1}</legend>
                  {row.map((cell, j) => (
                    <label key={j}>
                      {b.columns[j]}
                      <input
                        aria-label={`Row ${i + 1} ${b.columns[j]}`}
                        value={cell}
                        onChange={(event) =>
                          patch({
                            rows: b.rows.map((r, k) =>
                              k === i ? r.map((v, l) => (l === j ? event.target.value : v)) : r,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <button
                    aria-label={`Delete row ${i + 1}`}
                    onClick={() => patch({ rows: b.rows.filter((_, j) => j !== i) })}
                  >
                    Delete Row
                  </button>
                </fieldset>
              ))}
              <button onClick={() => patch({ rows: [...b.rows, b.columns.map(() => '')] })}>
                Add Row
              </button>
            </div>
          )}
        </>
      )}
      <div className="property-grid">
        {(table
          ? (['accentColor', 'headerColor', 'rowColor'] as const)
          : (['accentColor'] as const)
        ).map((key, i) => (
          <label key={key}>
            {['Accent colour', 'Table header', 'Table stripe'][i]}
            <input
              type="color"
              value={b[key]}
              onChange={(event) => patch({ [key]: event.target.value })}
            />
          </label>
        ))}
        <label>
          Radius
          <input
            type="number"
            min={0}
            max={100}
            value={b.radius}
            onChange={(event) => patch({ radius: Math.max(0, Number(event.target.value)) })}
          />
        </label>
      </div>
      {e.provenance && (
        <details className="source-metadata">
          <summary>Source metadata</summary>
          {e.provenance.map((p) => (
            <p key={p.id}>
              <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                {p.title} ↗
              </a>
              <br />
              {p.lastVerified
                ? `Last verified ${p.lastVerified}`
                : 'Unverified — check official source'}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
