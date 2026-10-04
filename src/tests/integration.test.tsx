import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Resources from '../pages/Resources';
import { usePosterBasket } from '../store/posterBasketStore';
import { usePosterStore } from '../store/posterStore';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
describe('resource UI integration', () => {
  beforeEach(() => {
    usePosterBasket.getState().clear();
    usePosterStore.getState().reset();
  });
  it('searches, adds to basket, and imports factual editable text', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Resources />
      </MemoryRouter>,
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Search SFU resources' }),
      'Campus Public Safety',
    );
    const card = screen.getByRole('heading', { name: 'Campus Public Safety' }).closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Add to Poster' }));
    expect(screen.getByRole('heading', { name: 'Poster Content (1)' })).toBeInTheDocument();
    usePosterStore.getState().importResources(usePosterBasket.getState().items);
    expect(
      usePosterStore.getState().document.elements.find((e) => e.type === 'resource')?.text,
    ).toContain('778-782-4500');
    await user.click(screen.getByRole('button', { name: 'Remove Campus Public Safety' }));
    expect(usePosterBasket.getState().items).toHaveLength(0);
  });
  it('combines category and campus controls', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Resources />
      </MemoryRouter>,
    );
    await user.selectOptions(screen.getByLabelText('Category'), 'library');
    expect(screen.getByRole('heading', { name: /Bennett Library/ })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Campus'), 'Surrey');
    expect(screen.getByRole('heading', { name: /Fraser Library/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bennett Library/ })).not.toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Search SFU resources' }),
      'zzzxxy-no-resource',
    );
    expect(screen.getByRole('heading', { name: 'No matching resources' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('heading', { name: /Bennett Library/ })).toBeInTheDocument();
  });
});
describe('privacy architecture', () => {
  it('has only public basket and ephemeral editor stores, no database dependencies or storage writes', () => {
    const files = readdirSync(resolve('src/store')).sort();
    expect(files).toEqual(['posterBasketStore.ts', 'posterStore.ts']);
    for (const file of files) {
      const source = readFileSync(resolve('src/store', file), 'utf8');
      expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|persist\(/);
    }
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(
      Object.keys(pkg.dependencies).some((name) =>
        /supabase|firebase|mongodb|prisma|auth0|postgres/i.test(name),
      ),
    ).toBe(false);
  });
});
