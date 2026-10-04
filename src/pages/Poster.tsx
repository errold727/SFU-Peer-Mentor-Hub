import { readLocalImage } from '../poster/images';
import { SectionsPanel } from '../poster/SectionsPanel';
import { BlockProperties } from '../poster/BlockProperties';
import { resourceBlockPatch, makeBlock } from '../poster/blocks';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { searchResources } from '../utils/search';
import { Modal } from '../components/ui/Modal';
import { autoArrange, MIN_BODY_FONT, textHeight } from '../poster/layout';
import { posterQuality } from '../poster/quality';
import { posterStyles, applyPosterStyle } from '../poster/styles';
import { LocalDrafts } from '../poster/LocalDrafts';

export default function Poster() {
  const s = usePosterStore(),
    basket = usePosterBasket();
  const stage = useRef<Konva.Stage>(null);
  const canvasArea = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(540);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState('Sections');
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'tools' | 'properties' | null>(null);
  const [guides, setGuides] = useState(false);
  const [preview, setPreview] = useState(false);
  const [quality, setQuality] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState('https://www.sfu.ca/');
  const [pendingTemplate, setPendingTemplate] = useState('');
  const [resourceQuery, setResourceQuery] = useState('');
  const size = posterSizes[s.document.size];
  const selected = s.document.elements.find((e) => e.id === s.selected);
  const scale =
    Math.max(
      0.1,
      Math.min(
        0.72,
        (areaWidth - 48) / size.width,
        Math.max(400, viewportHeight - 390) / size.height,
      ),
    ) * zoom;
  const issues = useMemo(
    () => posterQuality(s.document, s.recipientName),
    [s.document, s.recipientName],
  );
  const update = (patch: Partial<PosterElement>) => {
    if (Object.values(patch).some((v) => typeof v === 'number' && !Number.isFinite(v))) {
      setMessage('Enter a finite number for this property.');
      return;
    }
    if (selected && !selected.locked) s.update(selected.id, patch);
  };
  useEffect(() => {
    const el = canvasArea.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setAreaWidth(entries[0].contentRect.width));
    observer.observe(el);
    const resize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
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
    setMessage(
      `Preparing export…${issues.length ? ` ${issues.length} advisory quality warning(s); review Poster Quality before sharing.` : ''}`,
    );
    try {
      const filename = await exportPoster(
        stage.current,
        s.document,
        s.recipientName,
        format,
        quality,
      );
      setMessage(
        `Downloaded ${filename}${issues.length ? ` · ${issues.length} advisory warning(s) remain in Poster Quality.` : ''}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.startsWith('Please wait')
          ? error.message
          : 'Export could not complete. Check images and canvas settings, then try a lower quality. Your poster is still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  function fitResources() {
    const arranged = autoArrange(s.document, s.recipientName);
    s.change(arranged.document);
    setMessage(arranged.warnings.join(' ') || 'Resource cards arranged.');
  }
  return (
    <div className="poster-workspace">
      <header className="page-heading editor-heading">
        <div>
          <h1>Poster Maker</h1>
        </div>
        <div className="actions">
          <Link to="/poster">New poster</Link>
          <button aria-pressed={preview} onClick={() => setPreview(!preview)}>
            {preview ? 'Edit' : 'Preview'}
          </button>
          <Link className="button" to="/poster/templates">
            Browse templates ↗
          </Link>
        </div>
      </header>
      <div className="privacy-note">
        <span className="template-name">
          {templates.find((t) => t.id === s.document.template)?.name}
        </span>{' '}
        · Unsaved content stays in this browser session. Nothing is uploaded.{' '}
        <Link to="/about">Privacy</Link>
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
        {message}
      </p>
      <div className="editor-utilities">
        <details className="poster-quality" open={issues.some((i) => i.code === 'invalid')}>
          <summary>
            Poster Quality ·{' '}
            {issues.length ? `${issues.length} advisory warning(s)` : 'No issues detected'}
          </summary>
          <p>Warnings do not block export. Review at the intended print size.</p>
          {issues.length > 0 && (
            <ul>
              {issues.map((issue, i) => (
                <li key={i}>
                  {issue.message}
                  {issue.elementId && (
                    <button onClick={() => s.select(issue.elementId!)}>
                      Select element {i + 1}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button onClick={fitResources}>Auto Arrange</button>
        </details>
        <LocalDrafts />
      </div>
      <div className="mobile-editor-switch">
        <button
          aria-expanded={mobilePanel === 'tools'}
          onClick={() => setMobilePanel(mobilePanel === 'tools' ? null : 'tools')}
        >
          Sections & tools
        </button>
        <button
          aria-expanded={mobilePanel === 'properties'}
          onClick={() => setMobilePanel(mobilePanel === 'properties' ? null : 'properties')}
        >
          Properties
        </button>
      </div>
      <div
        className={`editor-layout v2-editor ${preview ? 'preview-mode' : ''}`}
        data-panel={mobilePanel}
      >
        <aside className="editor-panel tools-panel">
          <div className="tool-tabs">
            {[
              { name: 'Sections', Icon: BookOpen },
              { name: 'Resources', Icon: BookOpen },
              { name: 'Templates', Icon: BookOpen },
              { name: 'Layers', Icon: BookOpen },
              { name: 'Text', Icon: Type },
              { name: 'Icons', Icon: Star },
              { name: 'Shapes', Icon: Shapes },
              { name: 'Images', Icon: ImagePlus },
              { name: 'QR Code', Icon: QrCode },
            ].map(({ name, Icon }) => (
              <button
                className={tab === name ? 'active' : ''}
                aria-pressed={tab === name}
                key={name}
                onClick={() => setTab(name)}
              >
                <Icon size={18} />
                {name}
              </button>
            ))}
          </div>
          <div className="tool-content">
            {tab === 'Sections' && <SectionsPanel />}
            {tab === 'Templates' && <Link to="/poster/templates">Browse all templates</Link>}
            {tab === 'Layers' && (
              <div className="raw-layer-list">
                {[...s.document.elements]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        s.select(e.id);
                        setMobilePanel('properties');
                      }}
                    >
                      {e.block
                        ? `${e.block.label} · group`
                        : e.text.slice(0, 24) || e.shape || e.type}
                    </button>
                  ))}
              </div>
            )}
            {tab === 'Resources' && (
              <>
                {replaceTarget && (
                  <p className="notice">
                    Choose replacement content.{' '}
                    <button onClick={() => setReplaceTarget(null)}>Cancel</button>
                  </p>
                )}
                <input
                  aria-label="Find poster resources"
                  placeholder="Find a resource…"
                  value={resourceQuery}
                  onChange={(e) => setResourceQuery(e.target.value)}
                />
                {basket.items.length > 0 && (
                  <button
                    onClick={() => {
                      s.importResources(basket.items);
                      setMessage('Selected resources added. Use Auto Arrange to fit them.');
                    }}
                  >
                    Add selected resources ({basket.items.length})
                  </button>
                )}
                <button onClick={fitResources}>Auto Arrange resource cards</button>
                <div className="course-insert">
                  <Link to="/course-planner">Choose courses ↗</Link>
                  {basket.items.some((r) => r.id.startsWith('course:')) && (
                    <button
                      onClick={() => {
                        const courses = basket.items.filter((r) => r.id.startsWith('course:'));
                        const block = makeBlock(
                          'table',
                          {
                            label: 'Course Offerings',
                            title: 'COURSE OFFERINGS',
                            subtitle: [...new Set(courses.map((r) => r.term))].join(' · '),
                            columns: ['Course', 'Instructor'],
                            rows: courses.map((r) => [
                              r.title.split(' · ')[0],
                              r.facts?.find((f) => f.label === 'Instructor')?.value ||
                                'Unavailable',
                            ]),
                          },
                          {
                            x: 32,
                            y: 360,
                            width: 752,
                            height: 300,
                            sourceUrl: courses[0].sourceUrl,
                            provenance: courses.map((r) => ({
                              id: r.id,
                              title: r.title,
                              sourceUrl: r.sourceUrl,
                              lastVerified: r.lastVerified,
                            })),
                          },
                        );
                        if (selected?.block && ['table', 'schedule'].includes(selected.block.kind))
                          update({
                            block: block.block,
                            provenance: block.provenance,
                            sourceUrl: block.sourceUrl,
                            text: block.text,
                          });
                        else s.add(block);
                      }}
                    >
                      Insert course table
                    </button>
                  )}
                </div>

                <div className="resource-picker">
                  {searchResources(
                    [
                      ...resources,
                      ...basket.items.filter((r) => !resources.some((v) => v.id === r.id)),
                    ],
                    resourceQuery,
                  ).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const target = s.document.elements.find((e) => e.id === replaceTarget);
                        if (target && !target.locked) {
                          s.update(target.id, resourceBlockPatch(target, r));
                          setReplaceTarget(null);
                          setMessage('Section content replaced. Source metadata retained.');
                        } else s.importResources([r]);
                      }}
                    >
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
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      try {
                        const src = await readLocalImage(file);
                        const image = new Image();
                        image.src = src;
                        await image.decode();
                        s.add(
                          makeBlock(
                            'image',
                            {},
                            {
                              src,
                              width: 360,
                              height: (360 * image.height) / image.width,
                              padding: 0,
                            },
                          ),
                        );
                      } catch (error) {
                        setMessage((error as Error).message);
                      }
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
              Poster style
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value)
                    s.change(
                      applyPosterStyle(s.document, e.target.value as keyof typeof posterStyles),
                    );
                  e.target.value = '';
                }}
              >
                <option value="">Choose a style…</option>
                {Object.entries(posterStyles).map(([id, v]) => (
                  <option key={id} value={id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
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
            <label className="guide-toggle">
              <input
                type="checkbox"
                checked={guides}
                onChange={(event) => setGuides(event.target.checked)}
              />
              Guides
            </label>
            <span>
              {size.width} × {size.height}
            </span>
            <label>
              Preview zoom
              <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
                <option value={1}>Fit</option>
                <option value={1.5}>150% of fit</option>
                <option value={2}>200% of fit</option>
                <option value={3}>300% of fit</option>
              </select>
            </label>
          </div>
          <div className="canvas-viewport">
            <div
              className="canvas-paper"
              role="region"
              tabIndex={0}
              aria-label="Poster canvas. Use Layers to select elements; arrow keys move selected elements."
            >
              <PosterCanvas
                preview={preview}
                guides={guides && !preview}
                stageRef={stage}
                scale={Math.max(0.1, scale)}
              />
            </div>
          </div>
          <details className="canvas-help">
            <summary>Canvas & keyboard controls</summary>
            <p>
              Drag to move · Handles to resize / rotate · Scroll the canvas when zoomed
              <br />
              Arrow keys: 1 px · Shift + Arrow: 10 px · Delete to remove
            </p>
          </details>
        </div>
        <aside className="editor-panel inspector">
          <h2>Properties</h2>
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
                <legend>
                  {selected.locked
                    ? 'Locked — unlock to edit'
                    : selected.block
                      ? 'Section properties'
                      : 'Position & size'}
                </legend>
                {selected.block && (
                  <BlockProperties
                    element={selected}
                    update={update}
                    onReplaceContent={() => {
                      setReplaceTarget(selected.id);
                      setTab('Resources');
                      setMobilePanel('tools');
                    }}
                    onMessage={setMessage}
                  />
                )}
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
                {!['shape', 'image', 'divider'].includes(selected.type) &&
                  !['hero', 'image', 'divider'].includes(selected.block?.kind || '') && (
                    <>
                      {!selected.block && (
                        <label>
                          Editable text
                          <textarea
                            value={selected.text}
                            onChange={(e) => update({ text: e.target.value })}
                          />
                        </label>
                      )}
                      {selected.type !== 'qrcode' && (
                        <div className="actions">
                          <button
                            onClick={() =>
                              update({
                                height: Math.ceil(textHeight(selected, s.recipientName)) + 2,
                              })
                            }
                          >
                            Grow to fit text
                          </button>
                          <button
                            disabled={selected.fontSize <= MIN_BODY_FONT}
                            onClick={() => {
                              const next = { ...selected };
                              while (
                                next.fontSize > MIN_BODY_FONT &&
                                textHeight(next, s.recipientName) > next.height
                              )
                                next.fontSize -= 0.5;
                              update({ fontSize: next.fontSize });
                            }}
                          >
                            Fit text safely
                          </button>
                        </div>
                      )}
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
            <p className="muted">Select an element to edit.</p>
          )}
          <h3 className="sidebar-title">Layers</h3>
          {selected?.sourceUrl && (
            <button
              onClick={() => {
                const url = selected.sourceUrl!;
                if (!/^https:\/\//.test(url)) {
                  setMessage('This source URL is unavailable.');
                  return;
                }
                s.add(
                  makeElement('qrcode', {
                    text: url,
                    width: 140,
                    height: 140,
                    x: size.width - 188,
                    y: Math.min(size.height - 188, selected.y),
                  }),
                );
                setMessage('Official source QR added. Position it beside the relevant card.');
              }}
            >
              Add official source QR
            </button>
          )}
          <div className="layer-list">
            {[...s.document.elements]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((e) => (
                <button
                  className={s.selected === e.id ? 'active' : ''}
                  onClick={() => {
                    s.select(e.id);
                    setMobilePanel('properties');
                  }}
                  key={e.id}
                >
                  <span>
                    {e.block
                      ? (e.block.title || e.block.body || e.block.label).slice(0, 30)
                      : e.text.slice(0, 30) || e.shape || e.type}
                  </span>
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
    </div>
  );
}
