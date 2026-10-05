import type { ReactNode } from 'react';
import { FEEDBACK_RESPONDER_URL, isFeedbackResponderUrl } from '../config/feedback';
import { resourceCreditGroups } from '../data/aboutCredits';
import { toolCredits } from '../data/aboutTools';
import './About.css';

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} ↗
    </a>
  );
}

export default function About({
  feedbackUrl = FEEDBACK_RESPONDER_URL,
}: {
  feedbackUrl?: string | null;
}) {
  const feedbackReady = isFeedbackResponderUrl(feedbackUrl);

  return (
    <div className="about-page">
      <h1>About</h1>

      <section aria-labelledby="about-mentorship">
        <h2 id="about-mentorship">Supporting FASS Peer Mentorship</h2>
        <p>
          FASS Peer Mentorship connects new SFU students with experienced student mentors who help
          them navigate university life, campus resources, and opportunities.
        </p>
        <p>
          SFU Peer Mentor Hub supports this work by bringing together student resources, editable
          poster templates, and course-offering information.
        </p>
        <p>
          <SourceLink href="https://www.sfu.ca/students/get-involved/programs-and-opportunities/fassconnections.html">
            Learn about FASS Peer Mentorship
          </SourceLink>
        </p>
        <p className="about-note">
          Student-developed to support peer mentorship; not an official SFU website.
        </p>
        <p className="about-note">
          No mentee profiles are stored. Optional poster drafts remain in your browser.
        </p>
        <details>
          <summary>About local poster drafts</summary>
          <p>
            Unsaved posters stay in browser memory and clear on refresh. Saving a local draft keeps
            all poster content, including manually entered personal text, hidden sections, and
            images. Excluding the separate recipient field does not remove names typed into the
            poster.
          </p>
          <p>
            Drafts are unencrypted, do not reopen automatically, and can be deleted in Local Drafts
            or by clearing this site’s browser data. Remove them on shared devices. Exports include
            visible personal text and may have personalized filenames.
          </p>
          <p>
            The hub has no accounts, backend, or third-party analytics. Loading the site makes
            ordinary hosting requests; poster content is not uploaded. Feedback you choose to submit
            through Google Forms is separate from local drafts.
          </p>
        </details>
      </section>

      <section aria-labelledby="about-creator">
        <h2 id="about-creator">Created by Errol Dai</h2>
        <p className="about-author-label">Developer · FASS Peer Mentor</p>
        <p>
          Hi, I'm Errol Dai, a third-year Computing Science and Linguistics joint major student and
          FASS Peer Mentor at SFU. I built this hub to make it easier for mentors to find campus
          information and create useful posters for students.
        </p>
        <div className="about-contact">
          <a href="mailto:zda32@sfu.ca">zda32@sfu.ca</a>
        </div>
      </section>

      <section aria-labelledby="about-credits">
        <h2 id="about-credits">Data Sources &amp; Credits</h2>
        <p>
          Thanks to the services, SFU teams, and open-source projects that make this hub possible.
        </p>
        <h3>APIs &amp; Course Data</h3>
        <dl className="about-credit-list">
          <div>
            <dt>
              <SourceLink href="https://coursys.sfu.ca/browse/">
                CourSys public browse-data interface
              </SourceLink>
            </dt>
            <dd>Public course-offering listings and enrollment snapshots.</dd>
          </div>
          <div>
            <dt>
              <SourceLink href="https://www.sfu.ca/outlines/help/api.html">
                SFU Course Outlines REST API
              </SourceLink>
            </dt>
            <dd>Published course-outline and section details used by the importer.</dd>
          </div>
        </dl>
        <p className="about-note">
          Course data is imported as snapshots. Confirm current details with SFU.
        </p>

        <details>
          <summary>Resource information providers</summary>
          <p>
            Information may change. Refer to the linked official sources. Individual resource pages
            retain detailed citations and verification status.
          </p>
          {resourceCreditGroups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              <dl className="about-credit-list">
                {group.credits.map((credit) => (
                  <div key={credit.name}>
                    <dt>
                      <SourceLink href={credit.url}>{credit.name}</SourceLink>
                    </dt>
                    <dd>{credit.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </details>
        <details>
          <summary>Open-source tools &amp; asset credits</summary>
          <dl className="about-credit-list">
            {toolCredits.map((credit) => (
              <div key={credit.name}>
                <dt>
                  <SourceLink href={credit.url}>{credit.name}</SourceLink>
                </dt>
                <dd>
                  {credit.description} <span className="about-license">{credit.license}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p>
            <SourceLink href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.txt`}>
              Full third-party license notices
            </SourceLink>
          </p>
          <p>
            Poster templates use editable elements adapted from owner-supplied visual references.
            Three generic university scenes were generated with OpenAI image generation; they are
            illustrations, not official SFU photographs. Other decorative motifs are code-drawn
            illustrations.
          </p>
          <p>
            <SourceLink href="https://github.com/errold727/SFU-Peer-Mentor-Hub/tree/main/docs/template-references">
              Template and image provenance
            </SourceLink>
          </p>
          <p>
            Hosted on <SourceLink href="https://pages.github.com/">GitHub Pages</SourceLink>.{' '}
            <SourceLink href="https://github.com/errold727/SFU-Peer-Mentor-Hub">
              Project source and data maintenance
            </SourceLink>
          </p>
        </details>
      </section>

      <section aria-labelledby="about-feedback">
        <h2 id="about-feedback">Beta Feedback</h2>
        <p>
          Found a bug, outdated information, or something that could work better? Share your
          feedback to help improve the hub.
        </p>
        {feedbackReady ? (
          <a
            className="button primary"
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby="about-feedback-help"
          >
            Share Feedback ↗
          </a>
        ) : (
          <p role="status">Feedback form pending configuration.</p>
        )}
        <p id="about-feedback-help" className="about-note about-feedback-help">
          {feedbackReady
            ? 'Opens Google Forms. '
            : 'Feedback will open in Google Forms once available. '}
          Please do not include mentee names, student numbers, or other private information.
        </p>
        <p className="about-note">
          Feedback is entered on an external Google Form. Google sign-in is optional for saving
          progress; the hub does not attach poster content or recipient names.
        </p>
      </section>
    </div>
  );
}
