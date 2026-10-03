import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Undo2,
  Redo2,
  Download,
  Type,
  Shapes,
  ImagePlus,
  QrCode,
  Lock,
  EyeOff,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Star,
} from 'lucide-react';
import type Konva from 'konva';
import { usePosterStore } from '../store/posterStore';
import { usePosterBasket } from '../store/posterBasketStore';
import { makeElement, posterSizes, type PosterElement } from '../poster/posterTypes';
import { PosterCanvas } from '../poster/PosterCanvas';
import { exportPoster } from '../poster/exportPoster';
import { contrastRatio } from '../poster/contrast';
import { templates } from '../poster/templates';
import { resources } from '../data/resources';
import { Modal } from '../components/ui/Modal';

export default function Poster() {
  const s = usePosterStore(),
    basket = usePosterBasket();
  const stage = useRef<Konva.Stage>(null);
  const canvasArea = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(540);
  const [tab, setTab] = useState('Resources');
  const [quality, setQuality] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('https://www.sfu.ca/');
  const [pendingTemplate, setPendingTemplate] = useState('');
  const [resourceQuery, setResourceQuery] = useState('');
  const size = posterSizes[s.document.size];
  const selected = s.document.elements.find((e) => e.id === s.selected);
  const scale = Math.min(0.72, (areaWidth - 48) / size.width);
  const update = (patch: Partial<PosterElement>) => {
    if (selected && !selected.locked) s.update(selected.id, patch);
  };
  useEffect(() => {
    usePosterStore.getState().importResources(basket.items);
  }, [basket.items]);
  useEffect(() => {
    const el = canvasArea.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setAreaWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
        return;
      const state = usePosterStore.getState();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        state.redo();
        return;
      }
      const e = state.document.elements.find((e) => e.id === state.selected);
      if (!e || e.locked) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        state.remove(e.id);
      }
      const delta = event.shiftKey ? 10 : 1;
      const offsets: Record<string, [number, number]> = {
        ArrowLeft: [-delta, 0],
        ArrowRight: [delta, 0],
        ArrowUp: [0, -delta],
        ArrowDown: [0, delta],
      };
      if (offsets[event.key]) {
        event.preventDefault();
        const [x, y] = offsets[event.key];
        state.update(e.id, { x: e.x + x, y: e.y + y });
      }
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, []);
  const align = (position: string) => {
    if (!selected) return;
    const patches: Record<string, Partial<PosterElement>> = {
      left: { x: 0 },
      center: { x: (size.width - selected.width) / 2 },
      right: { x: size.width - selected.width },
      top: { y: 0 },
      middle: { y: (size.height - selected.height) / 2 },
      bottom: { y: size.height - selected.height },
    };
    update(patches[position]);
  };
  async function download(format: 'png' | 'pdf') {
    if (!stage.current) return;
    setBusy(true);
    setMessage('Preparing export…');
    try {
      const filename = await exportPoster(
        stage.current,
        s.document,
        s.recipientName,
        format,
        quality,
      );
      setMessage(`Downloaded ${filename}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed. Try a lower quality.');
    } finally {
      setBusy(false);
    }
  }
  const outside = s.document.elements.some(
    (e) =>
      e.visible &&
      (e.x < 0 || e.y < 0 || e.x + e.width > size.width + 1 || e.y + e.height > size.height + 1),
  );
  function fitResources() {
    const elements = s.document.elements.filter((e) => e.type === 'resource');
    const columns = elements.length > 1 ? 2 : 1,
      rows = Math.ceil(elements.length / columns),
      width = (size.width - 116) / columns,
      height = (size.height - 330) / Math.max(rows, 1) - 20;
    s.change({
      ...s.document,
      elements: s.document.elements.map((e) => {
        const i = elements.indexOf(e);
        if (i < 0) return e;
        const estimatedFont = Math.min(
          20,
          Math.sqrt(((width - 32) * (height - 32)) / (Math.max(e.text.length, 1) * 0.7)),
        );
        return {
          ...e,
          x: 48 + (i % columns) * (width + 20),
          y: 250 + Math.floor(i / columns) * (height + 20),
          width,
          height,
          fontSize: Math.max(8, estimatedFont),
          padding: 12,
        };
      }),
    });
  }
  return (
    <>
      <header className="page-heading editor-heading">
        <div>
          <div className="eyebrow">02 / CREATE</div>
          <h1>Poster Maker</h1>
          <p>Good information. Your personal touch.</p>
        </div>
        <Link className="button" to="/poster/templates">
          Browse templates ↗
        </Link>
      </header>
      <div className="privacy-note">
        Personal information entered in the editor is used only to create your current content and
        is not added to a mentee database.
      </div>
      <div className="editor-toolbar">
        <label>
          Canvas size
          <select value={s.document.size} onChange={(e) => s.resize(e.target.value)}>
            {Object.entries(posterSizes).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Recipient first name
          <input
            value={s.recipientName}
            onChange={(e) => s.setRecipientName(e.target.value)}
            placeholder="Optional · temporary"
            autoComplete="off"
          />
        </label>
        <div className="icon-buttons">
          <button aria-label="Undo" disabled={!s.past.length} onClick={s.undo}>
            <Undo2 size={18} />
          </button>
          <button aria-label="Redo" disabled={!s.future.length} onClick={s.redo}>
            <Redo2 size={18} />
          </button>
        </div>
        <label>
          Export quality
          <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
            <option value={1}>Standard</option>
            <option value={2}>2x</option>
            <option value={3.125}>Print Quality · 300 dpi at Letter</option>
          </select>
        </label>
        <button className="primary" onClick={() => download('png')} disabled={busy}>
          <Download size={16} />
          PNG
        </button>
        <button onClick={() => download('pdf')} disabled={busy}>
          PDF
        </button>
      </div>
      <p role="status" className="editor-status">
        {message ||
          'Select an element on the canvas or in Layers to edit it. Changes stay in this browser session.'}
      </p>
      {outside && (
        <p className="notice">
          Some elements extend beyond the page and will be cropped. Move or resize them, or use Fit
          resource cards.
        </p>
      )}
      <div className="editor-layout">
        <aside className="editor-panel">
          <div className="tool-tabs">
            {[
              { name: 'Resources', Icon: BookOpen },
              { name: 'Text', Icon: Type },
              { name: 'Icons', Icon: Star },
              { name: 'Shapes', Icon: Shapes },
              { name: 'Images', Icon: ImagePlus },
              { name: 'QR Code', Icon: QrCode },
            ].map(({ name, Icon }) => (
              <button
                className={tab === name ? 'active' : ''}
                key={name}
                onClick={() => setTab(name)}
              >
                <Icon size={18} />
                {name}
              </button>
            ))}
          </div>
          <div className="tool-content">
            <h2>{tab}</h2>
            {tab === 'Resources' && (
              <>
                <input
                  aria-label="Find poster resources"
                  placeholder="Find a resource…"
                  value={resourceQuery}
                  onChange={(e) => setResourceQuery(e.target.value)}
                />
                <button onClick={fitResources}>Fit resource cards</button>
                <p className="muted">Review text size and placement before exporting.</p>
                <div className="resource-picker">
                  {resources
                    .filter((r) => r.title.toLowerCase().includes(resourceQuery.toLowerCase()))
                    .map((r) => (
                      <button key={r.id} onClick={() => s.importResources([r])}>
                        {r.title} <span>+</span>
                      </button>
                    ))}
                </div>
              </>
            )}
            {tab === 'Text' && (
              <>
                <button
                  onClick={() =>
                    s.add(
                      makeElement('text', {
                        text: 'Your heading',
                        fontSize: 40,
                        fontWeight: 'bold',
                        height: 90,
                      }),
                    )
                  }
                >
                  Add heading
                </button>
                <button onClick={() => s.add(makeElement('text'))}>Add body text</button>
                <button
                  onClick={() =>
                    s.add(makeElement('text', { text: 'Hello, {{recipientName}}!', height: 80 }))
                  }
                >
                  Add recipient greeting
                </button>
                <button
                  onClick={() =>
                    s.add(
                      makeElement('footer', {
                        text: 'Add your source or footer',
                        fontSize: 14,
                        height: 60,
                      }),
                    )
                  }
                >
                  Add footer
                </button>
              </>
            )}
            {tab === 'Icons' && (
              <div className="icon-palette">
                {[
                  ['★', 'Star'],
                  ['⌂', 'Campus'],
                  ['✓', 'Check'],
                  ['♡', 'Heart'],
                  ['→', 'Arrow'],
                  ['!', 'Reminder'],
                ].map(([text, name]) => (
                  <button
                    key={name}
                    onClick={() =>
                      s.add(
                        makeElement('icon', {
                          text,
                          fontSize: 80,
                          width: 120,
                          height: 130,
                          color: '#a6192e',
                          align: 'center',
                        }),
                      )
                    }
                  >
                    {text} {name}
                  </button>
                ))}
              </div>
            )}
            {tab === 'Shapes' && (
              <>
                {[
                  ['rectangle', 'RedBrushBanner'],
                  ['mountain', 'MountainDivider'],
                  ['sticky', 'StickyNote'],
                  ['ellipse', 'SpeechBubble'],
                  ['rectangle', 'CampusCard'],
                  ['rectangle', 'DeadlineBadge'],
                  ['ellipse', 'InfoPill'],
                  ['rectangle', 'SectionRibbon'],
                  ['rectangle', 'PhotoFrame'],
                  ['rectangle', 'QRCard'],
                ].map(([shape, name]) => (
                  <button
                    key={name}
                    onClick={() =>
                      s.add(
                        makeElement('shape', {
                          shape,
                          text: '',
                          color: name === 'StickyNote' ? '#f5dea0' : '#a6192e',
                          width: 300,
                          height: 100,
                        }),
                      )
                    }
                  >
                    {name}
                  </button>
                ))}
                <button
                  onClick={() =>
                    s.add(
                      makeElement('divider', {
                        text: '',
                        height: 12,
                        width: 400,
                        color: '#a6192e',
                      }),
                    )
                  }
                >
                  Divider
                </button>
              </>
            )}
            {tab === 'Images' && (
              <>
                <p>Images stay on your device. Keep factual text in editable text elements.</p>
                <label>
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        setMessage('Choose an image under 10 MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const src = String(reader.result);
                        const img = new Image();
                        img.onload = () =>
                          s.add(
                            makeElement('image', {
                              src,
                              text: '',
                              width: 360,
                              height: (360 * img.height) / img.width,
                            }),
                          );
                        img.onerror = () => setMessage('This image could not be opened.');
                        img.src = src;
                      };
                      reader.readAsDataURL(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </>
            )}
            {tab === 'QR Code' && (
              <>
                <label>
                  QR destination URL
                  <input type="url" value={qr} onChange={(e) => setQr(e.target.value)} />
                </label>
                <button
                  onClick={() => {
                    try {
                      const url = new URL(qr);
                      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
                      s.add(
                        makeElement('qrcode', {
                          text: url.href,
                          width: 180,
                          height: 180,
                          backgroundColor: '#ffffff',
                        }),
                      );
                    } catch {
                      setMessage('Enter a valid http or https URL.');
                    }
                  }}
                >
                  Add QR Code
                </button>
              </>
            )}
            <h3 className="sidebar-title">Template</h3>
            <select
              aria-label="Poster template"
              value={s.document.template}
              onChange={(e) => setPendingTemplate(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <label className="sidebar-title">
              Page background
              <input
                type="color"
                value={s.document.background}
                onChange={(e) => s.change({ ...s.document, background: e.target.value })}
              />
            </label>
          </div>
        </aside>
        <div className="canvas-area" ref={canvasArea}>
          <div className="canvas-meta">
            <span>
              {size.width} × {size.height}
            </span>
            <span>{Math.round(scale * 100)}% · Preview</span>
          </div>
          <div
            className="canvas-paper"
            tabIndex={0}
            aria-label="Poster canvas. Use Layers to select elements; arrow keys move selected elements."
          >
            <PosterCanvas stageRef={stage} scale={Math.max(0.1, scale)} />
          </div>
          <p className="canvas-help">
            Drag to move · Handles to resize / rotate
            <br />
            Arrow keys: 1 px · Shift + Arrow: 10 px · Delete to remove
          </p>
        </div>
        <aside className="editor-panel inspector">
          <h2>Design properties</h2>
          {selected ? (
            <>
              <p className="eyebrow">{selected.type} ELEMENT</p>
              <div className="icon-buttons">
                <button aria-label="Duplicate element" onClick={() => s.duplicate(selected.id)}>
                  <Copy size={17} />
                </button>
                <button
                  aria-label={selected.locked ? 'Unlock element' : 'Lock element'}
                  onClick={() => s.update(selected.id, { locked: !selected.locked })}
                  className={selected.locked ? 'active' : ''}
                >
                  <Lock size={17} />
                </button>
                <button
                  aria-label={selected.visible ? 'Hide element' : 'Show element'}
                  onClick={() => s.update(selected.id, { visible: !selected.visible })}
                >
                  <EyeOff size={17} />
                </button>
                <button
                  aria-label="Delete element"
                  disabled={selected.locked}
                  onClick={() => s.remove(selected.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <fieldset disabled={selected.locked}>
                <legend>{selected.locked ? 'Locked — unlock to edit' : 'Position & size'}</legend>
                <div className="property-grid">
                  {(['x', 'y', 'width', 'height', 'rotation'] as const).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        type="number"
                        aria-label={`Element ${key}`}
                        step={1}
                        value={Math.round(selected[key])}
                        onChange={(e) =>
                          update({
                            [key]: ['width', 'height'].includes(key)
                              ? Math.max(20, Number(e.target.value))
                              : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="align-buttons">
                  {['left', 'center', 'right', 'top', 'middle', 'bottom'].map((p) => (
                    <button key={p} onClick={() => align(p)}>
                      {p}
                    </button>
                  ))}
                </div>
                {!['shape', 'image', 'divider'].includes(selected.type) && (
                  <>
                    <label>
                      Editable text
                      <textarea
                        value={selected.text}
                        onChange={(e) => update({ text: e.target.value })}
                      />
                    </label>
                    <div className="property-grid">
                      <label>
                        Font size
                        <input
                          type="number"
                          min={6}
                          max={300}
                          value={selected.fontSize}
                          onChange={(e) =>
                            update({ fontSize: Math.max(6, Number(e.target.value)) })
                          }
                        />
                      </label>
                      <label>
                        Weight
                        <select
                          value={selected.fontWeight}
                          onChange={(e) =>
                            update({ fontWeight: e.target.value as 'normal' | 'bold' })
                          }
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Font family
                      <select
                        value={selected.fontFamily}
                        onChange={(e) => update({ fontFamily: e.target.value })}
                      >
                        {['Arial', 'Georgia', 'Verdana', 'Courier New'].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Text alignment
                      <select
                        value={selected.align}
                        onChange={(e) =>
                          update({ align: e.target.value as 'left' | 'center' | 'right' })
                        }
                      >
                        {['left', 'center', 'right'].map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <div className="property-grid">
                  <label>
                    Color
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => update({ color: e.target.value })}
                    />
                  </label>
                  <label>
                    Background
                    <input
                      type="color"
                      value={
                        selected.backgroundColor === 'transparent'
                          ? '#ffffff'
                          : selected.backgroundColor
                      }
                      onChange={(e) => update({ backgroundColor: e.target.value })}
                    />
                  </label>
                  <label>
                    Border color
                    <input
                      type="color"
                      value={selected.borderColor}
                      onChange={(e) => update({ borderColor: e.target.value })}
                    />
                  </label>
                  <label>
                    Border width
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={selected.borderWidth}
                      onChange={(e) => update({ borderWidth: Math.max(0, Number(e.target.value)) })}
                    />
                  </label>
                  <label>
                    Padding
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selected.padding}
                      onChange={(e) => update({ padding: Math.max(0, Number(e.target.value)) })}
                    />
                  </label>
                  <label>
                    Line height
                    <input
                      type="number"
                      min={0.5}
                      max={4}
                      step={0.1}
                      value={selected.lineHeight}
                      onChange={(e) =>
                        update({ lineHeight: Math.max(0.5, Number(e.target.value)) })
                      }
                    />
                  </label>
                  <label>
                    Letter spacing
                    <input
                      type="number"
                      step={0.5}
                      value={selected.letterSpacing}
                      onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <button onClick={() => update({ backgroundColor: 'transparent' })}>
                  Clear background
                </button>
              </fieldset>
              {['text', 'resource', 'footer', 'icon'].includes(selected.type) &&
                contrastRatio(
                  selected.color,
                  selected.backgroundColor === 'transparent'
                    ? s.document.background
                    : selected.backgroundColor,
                ) < 4.5 && (
                  <p className="notice">
                    Low contrast. Choose a darker text colour or lighter background.
                  </p>
                )}
              <div className="icon-buttons">
                <button onClick={() => s.reorder(selected.id, 1)} disabled={selected.locked}>
                  <ArrowUp size={16} />
                  Forward
                </button>
                <button onClick={() => s.reorder(selected.id, -1)} disabled={selected.locked}>
                  <ArrowDown size={16} />
                  Back
                </button>
              </div>
            </>
          ) : (
            <p className="muted">Select an element to edit its content and appearance.</p>
          )}
          <h3 className="sidebar-title">Layers</h3>
          <div className="layer-list">
            {[...s.document.elements]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((e) => (
                <button
                  className={s.selected === e.id ? 'active' : ''}
                  onClick={() => s.select(e.id)}
                  key={e.id}
                >
                  <span>{e.text.slice(0, 30) || e.shape || e.type}</span>
                  {e.locked && <Lock size={12} />} {!e.visible && <EyeOff size={12} />}
                </button>
              ))}
          </div>
        </aside>
      </div>
      {pendingTemplate && (
        <Modal title="Apply template?" onClose={() => setPendingTemplate('')}>
          <p>
            This replaces the current layout. Your content basket remains available, and you can
            undo the change.
          </p>
          <button
            className="primary"
            onClick={() => {
              s.applyTemplate(pendingTemplate);
              s.importResources(basket.items);
              setPendingTemplate('');
            }}
          >
            Apply template
          </button>
        </Modal>
      )}
    </>
  );
}
