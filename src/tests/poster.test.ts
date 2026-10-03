import { beforeEach, describe, expect, it } from 'vitest';
import { usePosterStore } from '../store/posterStore';
import { resources } from '../data/resources';
import { createTemplate, templates } from '../poster/templates';
import { makeElement, resolveRecipient, visibleElements } from '../poster/posterTypes';
import { contrastRatio } from '../poster/contrast';
describe('poster editor', () => {
  beforeEach(() => usePosterStore.getState().reset());
  it('turns resources into editable text with source metadata', () => {
    const s = usePosterStore.getState();
    s.importResources([resources[1]]);
    const element = usePosterStore
      .getState()
      .document.elements.find((e) => e.resourceId === resources[1].id)!;
    expect(element.text).toContain('778-782-4500');
    expect(element.text).toContain(resources[1].sourceUrl);
    s.update(element.id, { text: 'Edited' });
    expect(usePosterStore.getState().document.elements.find((e) => e.id === element.id)?.text).toBe(
      'Edited',
    );
  });
  it('does not duplicate basket resources on remount', () => {
    const s = usePosterStore.getState();
    s.importResources([resources[0]]);
    s.importResources([resources[0]]);
    expect(
      usePosterStore.getState().document.elements.filter((e) => e.type === 'resource'),
    ).toHaveLength(1);
  });
  it('keeps names out of the poster document and browser storage', () => {
    localStorage.clear();
    sessionStorage.clear();
    const s = usePosterStore.getState();
    s.setRecipientName('Callum');
    expect(JSON.stringify(usePosterStore.getState().document)).not.toContain('Callum');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    s.reset();
    expect(usePosterStore.getState().recipientName).toBe('');
  });
  it('resolves a recipient only at render time', () =>
    expect(resolveRecipient('Hello {{recipientName}}', 'Callum')).toBe('Hello Callum'));
  it('supports undo and redo of movement', () => {
    const s = usePosterStore.getState(),
      e = s.document.elements[0];
    s.update(e.id, { x: 123 });
    s.undo();
    expect(usePosterStore.getState().document.elements[0].x).toBe(e.x);
    s.redo();
    expect(usePosterStore.getState().document.elements[0].x).toBe(123);
  });
  it('protects locked elements from deletion', () => {
    const s = usePosterStore.getState(),
      e = s.document.elements[0];
    s.update(e.id, { locked: true });
    s.remove(e.id);
    expect(usePosterStore.getState().document.elements.some((x) => x.id === e.id)).toBe(true);
  });
  it('duplicates with a unique id and reorders layers', () => {
    const s = usePosterStore.getState();
    s.duplicate(s.document.elements[0].id);
    const doc = usePosterStore.getState().document;
    expect(new Set(doc.elements.map((e) => e.id)).size).toBe(doc.elements.length);
    s.reorder(doc.elements[0].id, 1);
    expect(usePosterStore.getState().document.elements[1].id).toBe(doc.elements[0].id);
  });
  it('excludes hidden elements from rendered and exportable content', () =>
    expect(
      visibleElements([
        makeElement('text', { visible: false }),
        makeElement('text', { text: 'visible' }),
      ]).map((e) => e.text),
    ).toEqual(['visible']));
  it('provides eight editable templates', () => {
    expect(templates).toHaveLength(8);
    for (const t of templates)
      expect(createTemplate(t.id).elements.some((e) => e.type === 'text')).toBe(true);
  });
  it('checks contrast', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });
});
