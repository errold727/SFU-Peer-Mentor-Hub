import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { createTemplate, importedTemplates, templates } from '../poster/templates';
import { BlockProperties } from '../poster/BlockProperties';
import { isImageBlock, isQR, resourceBlockPatch } from '../poster/blocks';
import { readDrafts, saveDraft, validPosterDocument } from '../poster/drafts';
import { posterSizes } from '../poster/posterTypes';
import { usePosterStore } from '../store/posterStore';
import { resources } from '../data/resources';
import { courseToResource } from '../course/comparison';
import type { CourseOffering } from '../course/courseTypes';
import spring from '../../public/data/courses/2027-spring/engl.json';

const referenceManifest = [
  ['newsletter', '01_weekly_checkin_newsletter.png'],
  ['welcome', '02_welcome_to_sfu_orientation.png'],
  ['courses', '03_course_planning_blue.png'],
  ['library', '04_library_guide_editorial.png'],
  ['essentials', '05_student_essentials_playful.png'],
  ['event', '06_workshop_event_dark.png'],
  ['welcome-campus', '07_welcome_to_sfu_photo.png'],
  ['deadlines', '08_important_deadlines_timeline.png'],
  ['library-campus', '09_sfu_library_photo.png'],
  ['wellbeing', '10_student_wellbeing.png'],
  ['recreation', '11_get_active_recreation.png'],
  ['courses-campus', '12_course_planning_photo.png'],
  ['safety', '13_campus_safety.png'],
  ['academic', '14_academic_success.png'],
  ['international', '15_international_students.png'],
] as const;

describe('editable poster reference pack', () => {
  beforeEach(() => {
    usePosterStore.getState().reset();
    localStorage.clear();
  });

  it('registers each of the fifteen references once, alongside a separate blank canvas', () => {
    expect(importedTemplates).toHaveLength(15);
    expect(templates).toHaveLength(16);
    expect(new Set(templates.map((template) => template.id)).size).toBe(16);
    expect(new Set(importedTemplates.map((template) => template.reference)).size).toBe(15);
    expect(importedTemplates.map(({ id, reference }) => [id, reference])).toEqual(
      referenceManifest,
    );
    expect(templates.filter((template) => template.id === 'blank')).toHaveLength(1);
    expect(createTemplate('blank').elements).toEqual([]);
  });

  it('provides names, descriptions and lightweight preview metadata for every gallery choice', () => {
    for (const template of templates) {
      expect(template.name.trim(), template.id).not.toBe('');
      expect(template.description.trim(), template.id).not.toBe('');
      expect(template.preview, template.id).toEqual(expect.any(String));
      expect(template.preview.length, template.id).toBeGreaterThan(0);
      expect(template.preview, template.id).not.toMatch(/^data:image\//);
    }
    for (const template of importedTemplates) {
      expect(template.category.trim(), template.id).not.toBe('');
      expect(template.theme.trim(), template.id).not.toBe('');
    }
  });

  it.each(referenceManifest)(
    '%s loads as independent editable sections and round-trips through local drafts',
    (id) => {
      const document = createTemplate(id);
      expect(document.template).toBe(id);
      expect(validPosterDocument(document)).toBe(true);
      expect(document.elements.length).toBeGreaterThan(1);
      expect(new Set(document.elements.map((element) => element.id)).size).toBe(
        document.elements.length,
      );
      for (const element of document.elements) {
        expect(element.type).toBe('block');
        expect(element.block?.label.trim()).not.toBe('');
        expect(element.locked).toBe(false);
        expect(element.visible).toBe(true);
      }
      const original = structuredClone(document);
      const fresh = createTemplate(id);
      expect(fresh.elements[0].id).not.toBe(document.elements[0].id);
      document.elements[0].block!.title = 'Edited independently';
      expect(fresh.elements[0].block?.title).toBe(original.elements[0].block?.title);
      saveDraft(localStorage, original, 'Private recipient');
      expect(readDrafts(localStorage)[0].document).toEqual(original);
      expect(readDrafts(localStorage)[0].recipientName).toBeUndefined();
      expect(JSON.stringify(localStorage)).not.toContain('Private recipient');
    },
  );

  it('reconstructs image regions without using a full-page raster poster or a reference PNG', () => {
    for (const template of importedTemplates) {
      const document = createTemplate(template.id);
      const size = posterSizes[document.size];
      expect(document.background).toMatch(/^#[\da-f]{6}$/i);
      const images = document.elements.filter(isImageBlock);
      if (template.id !== 'deadlines') expect(images.length, template.id).toBeGreaterThan(0);
      for (const image of images) {
        expect(image.type).toBe('block');
        expect(image.src, template.id).toEqual(expect.any(String));
        expect(image.src, template.id).not.toMatch(/template-references|template-previews/i);
        for (const [, filename] of referenceManifest) expect(image.src).not.toContain(filename);
        expect(image.width * image.height, `${template.id}: ${image.block?.label}`).toBeLessThan(
          size.width * size.height * 0.6,
        );
        expect(image.block?.fitMode).toBe('cover');
        expect(image.block?.zoom).toBeGreaterThanOrEqual(1);
      }
      expect(document.elements.some((element) => element.block?.kind === 'title')).toBe(true);
      expect(
        document.elements.some((element) =>
          ['info', 'table', 'schedule', 'list', 'checklist', 'highlight'].includes(
            element.block!.kind,
          ),
        ),
      ).toBe(true);
    }
  });

  it('keeps personal recipient names out of default content', () => {
    const content = JSON.stringify(importedTemplates);
    expect(content).not.toMatch(/\b(?:Jikang|Ishaan|Callum)\b/i);
    const newsletter = JSON.stringify(createTemplate('newsletter'));
    expect(newsletter).toMatch(/\{\{recipientName\}\}|Student Name/);
  });

  it('uses dynamic QR sections with editable HTTPS destinations instead of raster QR images', () => {
    let count = 0;
    for (const template of importedTemplates) {
      for (const element of createTemplate(template.id).elements.filter(isQR)) {
        count += 1;
        expect(element.block?.kind).toBe('qr');
        expect(element.src).toBeUndefined();
        expect(element.block?.body).toBe(element.text);
        const destination = new URL(element.text);
        expect(destination.protocol).toBe('https:');
        expect(destination.hostname).toMatch(/(^|\.)sfu\.ca$/);
        usePosterStore.getState().change(createTemplate(template.id));
        const qr = usePosterStore.getState().document.elements.find(isQR)!;
        const properties = render(
          createElement(BlockProperties, {
            element: qr,
            update: (patch) => usePosterStore.getState().update(qr.id, patch),
            onReplaceContent: () => {},
            onMessage: () => {},
          }),
        );
        expect(properties.getByLabelText('QR destination URL')).toHaveValue(qr.text);
        fireEvent.change(properties.getByLabelText('Section name'), {
          target: { value: 'My official resource QR' },
        });
        const renamed = usePosterStore
          .getState()
          .document.elements.find((candidate) => candidate.id === qr.id)!;
        expect(renamed.text).toBe(qr.text);
        expect(renamed.block?.body).toBe(qr.text);
        properties.unmount();
        usePosterStore.getState().update(qr.id, { text: 'https://www.sfu.ca/students.html' });
        expect(
          usePosterStore.getState().document.elements.find((candidate) => candidate.id === qr.id)
            ?.text,
        ).toBe('https://www.sfu.ca/students.html');
        usePosterStore.getState().undo();
        expect(
          usePosterStore.getState().document.elements.find((candidate) => candidate.id === qr.id)
            ?.text,
        ).toBe(qr.text);
      }
    }
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it.each(['newsletter', 'courses', 'library', 'library-campus', 'recreation'])(
    '%s has real editable table cells',
    (id) => {
      const table = createTemplate(id).elements.find((element) =>
        ['table', 'schedule'].includes(element.block!.kind),
      )!;
      expect(table, id).toBeDefined();
      expect(table.block!.columns.length).toBeGreaterThanOrEqual(2);
      expect(table.block!.rows.length).toBeGreaterThan(0);
      expect(table.block!.rows.every((row) => row.length === table.block!.columns.length)).toBe(
        true,
      );
      usePosterStore.getState().change(createTemplate(id));
      const original = usePosterStore
        .getState()
        .document.elements.find((element) => ['table', 'schedule'].includes(element.block!.kind))!;
      const rows = original.block!.rows.map((row) => [...row]);
      rows[0][0] = 'Edited cell';
      rows.push(Array.from({ length: original.block!.columns.length }, () => 'Added cell'));
      usePosterStore.getState().update(original.id, { block: { ...original.block!, rows } });
      const edited = usePosterStore
        .getState()
        .document.elements.find((element) => element.id === original.id)!;
      expect(edited.block!.rows[0][0]).toBe('Edited cell');
      expect(edited.block!.rows).toHaveLength(original.block!.rows.length + 1);
      expect(original.block!.rows).toEqual(table.block!.rows);
      usePosterStore.getState().undo();
      expect(
        usePosterStore.getState().document.elements.find((element) => element.id === original.id)
          ?.block?.rows,
      ).toEqual(original.block!.rows);
    },
  );

  it.each([
    'welcome',
    'courses',
    'essentials',
    'event',
    'wellbeing',
    'courses-campus',
    'academic',
    'international',
  ])('%s supports adding and removing real checklist items', (id) => {
    usePosterStore.getState().change(createTemplate(id));
    const checklist = usePosterStore
      .getState()
      .document.elements.find((element) => element.block?.kind === 'checklist')!;
    expect(checklist, id).toBeDefined();
    expect(checklist.block!.items.length).toBeGreaterThan(0);
    const items = [...checklist.block!.items.slice(1), 'My next step'];
    usePosterStore.getState().update(checklist.id, { block: { ...checklist.block!, items } });
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === checklist.id)
        ?.block?.items,
    ).toEqual(items);
    usePosterStore.getState().undo();
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === checklist.id)
        ?.block?.items,
    ).toEqual(checklist.block!.items);
  });

  it('duplicates a sourced section independently and preserves official provenance through display edits and undo', () => {
    const state = usePosterStore.getState();
    state.applyTemplate('safety');
    const original = usePosterStore
      .getState()
      .document.elements.find((element) => element.block?.label === 'Campus Public Safety')!;
    const resource = resources.find((item) => item.id === 'campus-safety')!;
    state.update(original.id, resourceBlockPatch(original, resource));
    const sourced = usePosterStore
      .getState()
      .document.elements.find((element) => element.id === original.id)!;
    expect(sourced.provenance).toEqual([
      {
        id: resource.id,
        title: resource.title,
        sourceUrl: resource.sourceUrl,
        lastVerified: resource.lastVerified,
      },
    ]);
    state.duplicate(sourced.id);
    const copy = usePosterStore.getState().document.elements.at(-1)!;
    expect(copy.block).not.toBe(sourced.block);
    expect(copy.provenance).not.toBe(sourced.provenance);
    state.update(copy.id, {
      block: {
        ...copy.block!,
        title: 'My concise safety heading',
        body: 'My editable presentation text',
      },
      visible: false,
    });
    const edited = usePosterStore
      .getState()
      .document.elements.find((element) => element.id === copy.id)!;
    expect(edited.block?.title).toBe('My concise safety heading');
    expect(edited.provenance).toEqual(sourced.provenance);
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === sourced.id),
    ).toEqual(sourced);
    state.undo();
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === copy.id),
    ).toEqual(copy);
    state.remove(copy.id);
    state.undo();
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === copy.id)
        ?.provenance,
    ).toEqual(sourced.provenance);
    expect(validPosterDocument(usePosterStore.getState().document)).toBe(true);
  });

  it('accepts sourced Course Planner content in the imported campus planning layout without changing the course snapshot', () => {
    const course = (spring.courses as CourseOffering[]).find(
      (item) => item.courseNumber === '211' && item.section === 'D100',
    )!;
    const snapshot = structuredClone(course);
    const state = usePosterStore.getState();
    state.applyTemplate('courses-campus');
    const card = usePosterStore
      .getState()
      .document.elements.find((element) => element.block?.label === 'Explore Courses')!;
    const resource = courseToResource(course);
    state.update(card.id, resourceBlockPatch(card, resource));
    const inserted = usePosterStore
      .getState()
      .document.elements.find((element) => element.id === card.id)!;
    expect(inserted.block?.body).toContain(course.code);
    expect(inserted.sourceUrl).toBe(resource.sourceUrl);
    expect(inserted.provenance?.[0].lastVerified).toBe(resource.lastVerified);
    state.update(card.id, {
      block: {
        ...inserted.block!,
        title: 'A course to consider',
        body: 'Ask an advisor about this option.',
      },
    });
    expect(
      usePosterStore.getState().document.elements.find((element) => element.id === card.id)
        ?.provenance,
    ).toEqual(inserted.provenance);
    expect(course).toEqual(snapshot);
    expect(validPosterDocument(usePosterStore.getState().document)).toBe(true);
  });
});
