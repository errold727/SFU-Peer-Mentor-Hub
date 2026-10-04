import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import About from '../pages/About';
import { FEEDBACK_RESPONDER_URL, isFeedbackResponderUrl } from '../config/feedback';

describe('About', () => {
  it('keeps the introduction, author, credits and feedback in exactly four main sections', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Supporting FASS Peer Mentorship',
      'Created by Errol Dai',
      'Data Sources & Credits',
      'Beta Feedback',
    ]);
    const author = screen.getByRole('region', { name: 'Created by Errol Dai' });
    expect(author).toHaveTextContent('third-year Computing Science and Linguistics joint major');
    expect(author).toHaveTextContent('Developer · FASS Peer Mentor');
    expect(within(author).getByRole('link', { name: 'zda32@sfu.ca' })).toHaveAttribute(
      'href',
      'mailto:zda32@sfu.ca',
    );
    expect(within(author).getByRole('link', { name: 'GitHub ↗' })).toHaveAttribute(
      'href',
      'https://github.com/errold727',
    );
    expect(
      screen.getByRole('link', { name: 'Learn about FASS Peer Mentorship ↗' }),
    ).toHaveAttribute(
      'href',
      'https://www.sfu.ca/students/get-involved/programs-and-opportunities/fassconnections.html',
    );
  });

  it('credits the actual course sources as snapshots, with a public interface distinct from the API', () => {
    render(<About />);
    expect(
      screen.getByRole('link', { name: 'CourSys public browse-data interface ↗' }),
    ).toHaveAttribute('href', 'https://coursys.sfu.ca/browse/');
    expect(screen.getByRole('link', { name: 'SFU Course Outlines REST API ↗' })).toHaveAttribute(
      'href',
      'https://www.sfu.ca/outlines/help/api.html',
    );
    expect(
      screen.getByText('Course data is imported as snapshots. Confirm current details with SFU.'),
    ).toBeVisible();
  });

  it('keeps personal-text and external-feedback privacy qualifications available in a native disclosure', () => {
    const { container } = render(<About />);
    const disclosure = container.querySelector('details')!;
    expect(disclosure.querySelector('summary')).toHaveTextContent('About local poster drafts');
    expect(disclosure).toHaveTextContent(
      'including manually entered personal text, hidden sections, and images',
    );
    expect(disclosure).toHaveTextContent(
      'Excluding the separate recipient field does not remove names typed into the poster',
    );
    expect(disclosure).toHaveTextContent(
      'Feedback you choose to submit through Google Forms is separate from local drafts',
    );
    expect(disclosure).not.toHaveAttribute('open');
  });

  it('uses only the configured clean responder link and protects external links', () => {
    const { container } = render(<About />);
    const feedback = screen.getByRole('link', { name: 'Share Feedback ↗' });
    expect(feedback).toHaveAttribute('href', FEEDBACK_RESPONDER_URL);
    expect(isFeedbackResponderUrl(FEEDBACK_RESPONDER_URL)).toBe(true);
    expect(feedback).toHaveAccessibleDescription(/Please do not include mentee names/);
    for (const link of container.querySelectorAll('a[target="_blank"]')) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(container.querySelector('iframe, form')).toBeNull();
  });

  it.each([
    null,
    'https://docs.google.com/forms/d/example/edit',
    'https://docs.google.com/forms/d/e/example/viewform?entry.1=private-text',
    'https://docs.google.com.attacker.example/forms/d/e/example/viewform',
    'javascript:alert(1)',
  ])(
    'leaves feedback pending instead of exposing an unconfigured or unsafe URL: %s',
    (feedbackUrl) => {
      const { container } = render(<About feedbackUrl={feedbackUrl} />);
      expect(screen.queryByRole('link', { name: 'Share Feedback ↗' })).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Feedback form pending configuration');
      expect(container.querySelector('a[href*="/edit"], a[href*="entry.1"]')).toBeNull();
    },
  );
});
