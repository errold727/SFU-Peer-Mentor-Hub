import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SFUResource } from '../data/resources/types';
import Home from '../pages/Home';
import Resources from '../pages/Resources';
import { ResourceDetailBody } from '../components/resource/ResourceDetailBody';
import { ResourceCard } from '../components/resource/ResourceCard';
import { usePosterBasket } from '../store/posterBasketStore';

const { fixtures } = vi.hoisted(() => {
  const base = {
    schemaVersion: 2,
    id: 'speaking',
    title: 'Public Speaking',
    summary: 'A concise program summary.',
    category: 'workshops-events',
    campus: 'Burnaby',
    campuses: ['Burnaby'],
    term: 'Fall 2026',
    sourceName: 'Student Learning Commons',
    sourceUrl: 'https://www.lib.sfu.ca/about/branches-depts/slc',
    actionUrl: 'https://www.lib.sfu.ca/about/branches-depts/slc',
    lastVerified: '2026-10-01',
    posterCompatible: true,
    tags: ['Public Speaking'],
    provider: { name: 'SFU Student Learning Commons', type: 'sfu' },
    verification: {
      status: 'reviewed',
      verifiedAt: '2026-10-01T20:00:00Z',
      reviewedAt: '2026-10-01T20:00:00Z',
      reviewer: 'agent',
    },
    reviewDueAt: '2026-10-08',
    reviewCadence: 'schedule',
    lifecycle: 'active',
    audiences: ['All students'],
    eligibility: ['This example is only for members of the named community.'],
    access: ['Check the official program page.'],
    details: [
      { heading: 'Program description', body: 'The full useful description remains in details.' },
    ],
    sources: [
      {
        id: 'guide',
        url: 'https://www.lib.sfu.ca/about/branches-depts/slc',
        title: 'Official program source',
        retrievalStatus: 'retrieved',
      },
    ],
    program: {
      kind: 'multiple',
      sourcePages: [5],
      sourceDocument: {
        filename: 'Program Guide Fall 2026_FINAL1.pdf',
        sha256: 'a'.repeat(64),
        pages: 11,
      },
      registrationStatus: 'unavailable',
      manualReviewRequired: true,
      manualReviewNote:
        'The source description needs confirmation; the dated sessions are supported.',
      occurrences: [
        {
          id: 'past',
          date: '2026-09-29',
          startTime: '10:30',
          endTime: '11:30',
          mode: 'in-person',
          campus: 'Burnaby',
          building: 'Library',
          room: 'Room 1',
          sourcePage: 5,
        },
        {
          id: 'first',
          date: '2026-10-06',
          startTime: '10:30',
          endTime: '11:30',
          mode: 'hybrid',
          locationDisplay: 'Surrey · Room 2 and online',
          sourcePage: 5,
          registrationStatus: 'verified',
          registrationUrl: 'https://www.lib.sfu.ca/about/branches-depts/slc/register',
        },
        {
          id: 'second',
          date: '2026-10-26',
          startTime: '13:00',
          endTime: '14:00',
          mode: 'in-person',
          campus: 'Burnaby',
          building: 'Library',
          room: 'Room 3',
          sourcePage: 5,
        },
        {
          id: 'uncertain',
          date: '2026-10-12',
          startTime: null,
          endTime: null,
          mode: 'online',
          sourcePage: 5,
          manualReviewRequired: true,
          manualReviewNote: 'The source times conflict; confirm them with SLC.',
        },
      ],
    },
  };
  const additional = Array.from({ length: 7 }, (_, index) => ({
    ...base,
    id: `workshop-${index}`,
    title: `Workshop ${index}`,
    program: {
      ...base.program,
      manualReviewRequired: false,
      occurrences: [
        {
          id: `date-${index}`,
          date: `2026-10-${String(7 + index).padStart(2, '0')}`,
          startTime: '12:00',
          endTime: '13:00',
          mode: 'in-person',
          campus: 'Burnaby',
          locationDisplay: 'Library · Room 4',
          sourcePage: 6,
        },
      ],
    },
  }));
  return {
    fixtures: [
      base,
      ...additional,
      {
        ...base,
        id: 'deadline',
        title: 'Dated deadline reminder',
        category: 'deadline',
        date: '2026-10-05',
        program: undefined,
      },
      {
        ...base,
        id: 'evergreen',
        title: 'Evergreen support service',
        category: 'academic-support',
        program: undefined,
      },
      {
        ...base,
        id: 'community-overview',
        title: 'Community drop-in overview',
        category: 'academic-support',
        relatedIds: [
          ...additional.map((resource) => resource.id),
          additional[0].id,
          'missing-resource',
          'community-overview',
        ],
        program: {
          ...base.program,
          kind: 'service',
          occurrences: [],
          manualReviewRequired: false,
        },
      },
    ] as SFUResource[],
  };
});
vi.mock('../data/resources', () => ({ resources: fixtures }));
const now = new Date('2026-10-05T15:00:00Z');
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
  usePosterBasket.getState().clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (originalShowModal)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

function RouteState() {
  const location = useLocation();
  return <output aria-label="Current resource filters">{location.search}</output>;
}

describe('workshop Resource Hub integration', () => {
  it('shows the next confirmed program date without requiring legacy validFrom', () => {
    const resource = {
      ...fixtures[1],
      program: {
        ...fixtures[1].program!,
        occurrences: [
          { ...fixtures[0].program!.occurrences[3], date: '2026-10-06' },
          ...fixtures[1].program!.occurrences,
        ],
      },
    };
    render(
      <MemoryRouter>
        <ResourceCard resource={resource} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Next confirmed date 2026-10-07')).toBeVisible();
    expect(screen.queryByText(/^Starts$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Starts 2026-10-06')).not.toBeInTheDocument();
  });

  it('uses a published service window start without inventing a session', () => {
    const resource = {
      ...fixtures[0],
      program: {
        ...fixtures[0].program!,
        kind: 'range' as const,
        startDate: '2026-10-09',
        endDate: '2026-12-01',
        occurrences: [],
      },
    };
    render(
      <MemoryRouter>
        <ResourceCard resource={resource} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Starts 2026-10-09')).toBeVisible();
  });

  it('labels a completed program while retaining its history and qualified poster action', async () => {
    const user = userEvent.setup();
    const resource = {
      ...fixtures[0],
      program: { ...fixtures[0].program!, occurrences: [fixtures[0].program!.occurrences[0]] },
    };
    render(
      <MemoryRouter>
        <ResourceCard resource={resource} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Completed')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add to Poster' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'View Details' }));
    const dialog = screen.getByRole('dialog', { name: resource.title });
    expect(dialog).toHaveTextContent('Past dates (1)');
    expect(dialog).toHaveTextContent('2026-09-29');
    expect(dialog).toHaveTextContent('This example is only for members of the named community.');
    await user.click(within(dialog).getByRole('button', { name: 'Close details' }));
  });

  it('does not present an explicitly unknown program campus as all campuses', () => {
    const resource = { ...fixtures[0], campuses: [] };
    const { rerender } = render(
      <MemoryRouter>
        <ResourceCard resource={resource} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Location not specified')).toBeVisible();
    expect(screen.queryByText('All campuses')).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <ResourceDetailBody resource={resource} now={now} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/SFU Student Learning Commons · Location not specified/)).toBeVisible();
  });
  it('shows a compact combined chronological feed capped at six, without evergreen cards', () => {
    render(
      <MemoryRouter>
        <Home now={now} />
      </MemoryRouter>,
    );
    const section = screen.getByRole('region', { name: 'This week at SFU' });
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveTextContent('Dated deadline reminder');
    expect(items[1]).toHaveTextContent('Public Speaking');
    expect(items[1]).toHaveTextContent('10:30 AM–11:30 AM');
    expect(items[1]).toHaveTextContent('Hybrid · Surrey · Room 2 and online');
    expect(items.map((item) => item.querySelector('time')?.dateTime)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ]);
    expect(section).not.toHaveTextContent('A concise program summary');
    expect(section).not.toHaveTextContent('Evergreen support service');
    expect(within(section).queryByRole('button')).not.toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'View all workshops →' })).toHaveAttribute(
      'href',
      '/resources?category=workshops-events',
    );
  });

  it('honours the injected Vancouver date instead of the host clock and shows an honest empty state', () => {
    render(
      <MemoryRouter>
        <Home now={new Date('2027-01-01T20:00:00Z')} />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('No confirmed events or date reminders in the next seven days.'),
    ).toBeVisible();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('opens a canonical program from This Week while preserving the workshop filter and poster action', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Home now={now} />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
        <RouteState />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('link', { name: 'Public Speaking' }));
    expect(screen.getByLabelText('Category')).toHaveValue('workshops-events');
    const dialog = screen.getByRole('dialog', { name: 'Public Speaking' });
    expect(dialog).toHaveTextContent('2026-10-06');
    expect(dialog).toHaveTextContent('2026-10-26');
    await user.click(within(dialog).getByRole('button', { name: 'Add to Poster' }));
    expect(usePosterBasket.getState().items.map((resource) => resource.id)).toEqual(['speaking']);
    await user.click(within(dialog).getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Current resource filters')).toHaveTextContent(
      '?category=workshops-events',
    );
    expect(screen.getByRole('heading', { name: 'Public Speaking' })).toBeVisible();
  });

  it('updates filters from route navigation and rejects unknown category parameters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/resources?category=workshops-events']}>
        <Link to="/resources?category=deadline">Deadline filter</Link>
        <Link to="/resources?category=made-up">Unknown filter</Link>
        <Resources />
        <RouteState />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Category')).toHaveValue('workshops-events');
    expect(
      screen.queryByRole('heading', { name: 'Dated deadline reminder' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Deadline filter' }));
    expect(screen.getByLabelText('Category')).toHaveValue('deadline');
    expect(screen.getByRole('heading', { name: 'Dated deadline reminder' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Unknown filter' }));
    expect(screen.getByLabelText('Category')).toHaveValue('All');
    await user.selectOptions(screen.getByLabelText('Category'), 'workshops-events');
    expect(screen.getByLabelText('Current resource filters')).toHaveTextContent(
      '?category=workshops-events',
    );
  });

  it('keeps all dates, past history, source provenance, restrictions and explicit uncertainty in one detail', () => {
    const { container } = render(
      <MemoryRouter>
        <ResourceDetailBody resource={fixtures[0]} now={now} />
      </MemoryRouter>,
    );
    const dates = screen.getByRole('region', { name: 'Program dates and registration' });
    expect(dates).toHaveTextContent('2026-10-06');
    expect(dates).toHaveTextContent('2026-10-26');
    expect(dates).toHaveTextContent('Time not confirmed');
    expect(dates).toHaveTextContent('The source times conflict; confirm them with SLC.');
    expect(dates).toHaveTextContent('Program Guide Fall 2026_FINAL1.pdf · Page 5');
    expect(dates).toHaveTextContent('Fall 2026');
    expect(dates).toHaveTextContent('America/Vancouver');
    const history = container.querySelector('.program-history')!;
    expect(history).not.toHaveAttribute('open');
    expect(history).toHaveTextContent('2026-09-29');
    expect(history.querySelector('summary')).toHaveAttribute('tabindex', '0');
    expect(
      screen.getByText('This example is only for members of the named community.'),
    ).toBeVisible();
    expect(screen.getByText('The full useful description remains in details.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Register for this date ↗' })).toHaveAttribute(
      'href',
      'https://www.lib.sfu.ca/about/branches-depts/slc/register',
    );
  });

  it('does not turn an official source link into an unverified registration link', () => {
    const resource = {
      ...fixtures[0],
      program: {
        ...fixtures[0].program!,
        occurrences: [],
        kind: 'service' as const,
        registrationUrl: 'https://www.lib.sfu.ca/about/branches-depts/slc/unconfirmed',
        registrationStatus: 'unavailable' as const,
      },
    };
    render(
      <MemoryRouter>
        <ResourceDetailBody resource={resource} now={now} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /Register/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Registration link unavailable. Check the official program source for arrangements.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open official service ↗' })).toHaveAttribute(
      'href',
      resource.sourceUrl,
    );
  });

  it('retains unresolved raw timezone wording without claiming normalized Vancouver times', () => {
    const resource = {
      ...fixtures[0],
      program: {
        ...fixtures[0].program!,
        kind: 'service' as const,
        occurrences: [],
        scheduleText: 'Source wording: Fridays, 9:00am to noon (UTC-07:00/Pacific Daylight Time).',
        manualReviewNote:
          'The provider says UTC-08:00/Pacific Standard Time. Confirm timing; no conversion is made.',
      },
    };
    render(
      <MemoryRouter>
        <ResourceDetailBody resource={resource} now={now} />
      </MemoryRouter>,
    );
    const dates = screen.getByRole('region', { name: 'Program dates and registration' });
    expect(dates).toHaveTextContent('UTC-07:00/Pacific Daylight Time');
    expect(dates).toHaveTextContent('UTC-08:00/Pacific Standard Time');
    expect(dates).not.toHaveTextContent('America/Vancouver');
    expect(
      within(dates).queryByRole('heading', { name: 'Upcoming dates' }),
    ).not.toBeInTheDocument();
  });

  it('links each related canonical location once and opens it through the resource query route', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={['/resources?category=academic-support&resource=community-overview']}
      >
        <Resources />
        <RouteState />
      </MemoryRouter>,
    );
    const overview = screen.getByRole('dialog', { name: 'Community drop-in overview' });
    const related = within(overview).getByRole('region', { name: 'Related resources' });
    const links = within(related).getAllByRole('link');
    expect(links).toHaveLength(7);
    expect(links.map((link) => link.textContent)).toEqual(
      Array.from({ length: 7 }, (_, index) => `Workshop ${index}`),
    );
    expect(links[0]).toHaveAttribute(
      'href',
      '/resources?category=workshops-events&resource=workshop-0',
    );
    await user.click(links[0]);
    const location = screen.getByRole('dialog', { name: 'Workshop 0' });
    expect(
      screen.queryByRole('dialog', { name: 'Community drop-in overview' }),
    ).not.toBeInTheDocument();
    expect(location).toHaveTextContent('2026-10-07');
    expect(screen.getByLabelText('Category')).toHaveValue('workshops-events');
    await user.click(within(location).getByRole('button', { name: 'Close details' }));
    expect(screen.getByLabelText('Current resource filters')).toHaveTextContent(
      '?category=workshops-events',
    );
  });
});
