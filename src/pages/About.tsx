export default function About() {
  return (
    <div className="prose">
      <h1>About this hub</h1>
      <p>
        Resources, editable posters, and course planning for SFU Peer Mentors. Peer-created; not an
        official Simon Fraser University website.
      </p>
      <h2>Your privacy</h2>
      <ul>
        <li>No accounts, backend, student database, or third-party analytics.</li>
        <li>
          Course selections, recipient names, images, and unsaved posters stay in browser memory.
          Refresh clears the session. Editor content is never uploaded.
        </li>
        <li>
          Optional local drafts save all poster content on this browser. Recipient names are
          excluded unless selected. Drafts never reopen automatically; remove them from shared
          devices. PNG/PDF exports include visible personal text, without hidden layers or an
          editable document.
        </li>
      </ul>
      <h2>Sources and verification</h2>
      <p>
        Resources link to official sources and show verification status. Check time-sensitive or
        unverified details before sharing. Verification ages: over 90 days needs review; over 180
        days is stale. Dates use America/Vancouver.
      </p>
      <p>
        Library floor details were supplied in the project specification. Where source retrieval was
        blocked, verification remains incomplete. International resources point to SFU; this tool
        does not provide legal or immigration advice.
      </p>
      <h2>Course data</h2>
      <p>
        Fall 2026 (1267) and Spring 2027 (1271) offerings come from public SFU CourSys, enriched by
        Course Outlines. Coverage and snapshot times are available in the planner; enrollment is not
        live. Missing details remain unavailable. Confirm required lectures, tutorials and labs
        through SFU and goSFU.
      </p>
      <h2>Independent visual identity</h2>
      <p>
        The SFU-inspired colours and campus geometry are original design elements. No official SFU
        logo or restricted commercial font is bundled.
      </p>
      <a href="https://github.com/errold727/SFU-Peer-Mentor-Hub" target="_blank" rel="noreferrer">
        Project source and data maintenance ↗
      </a>
    </div>
  );
}
