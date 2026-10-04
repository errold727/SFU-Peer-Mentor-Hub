export default function About() {
  return (
    <div className="prose">
      <div className="eyebrow">MADE BY PEERS, FOR PEERS</div>
      <h1>About this hub</h1>
      <p className="lede">A useful starting point. A more thoughtful way to share.</p>
      <p>
        SFU Peer Mentor Hub is a peer-created resource tool. It does not replace official SFU
        websites and is not an official Simon Fraser University website.
      </p>
      <h2>Find → Select → Create</h2>
      <p>
        Find public SFU information, select resources for your content basket, and turn them into
        editable posters. Compare published course offerings without ranking courses or predicting
        demand.
      </p>
      <h2>Your privacy</h2>
      <ul>
        <li>No mentee database, student profiles, or mentor/mentee assignment database.</li>
        <li>No login, backend, message history, student notes, or third-party analytics.</li>
        <li>
          Recipient names, uploaded images, and editor content stay in browser memory by default.
          Refreshing clears the current session. No editor content is uploaded.
        </li>
        <li>
          Save locally is optional and saves all poster content on this browser. The recipient field
          is excluded unless you explicitly include it. Saved drafts never open automatically, can
          be duplicated or deleted, and should be removed from shared devices. PNG/PDF downloads
          include the personal text you chose to show, without hidden layers or an embedded editable
          document.
        </li>
      </ul>
      <p className="notice">
        Personal information entered in the editor is used only to create your current content and
        is not added to a mentee database.
      </p>
      <h2>Sources and verification</h2>
      <p>
        Every resource links to its official source and shows its verification date. Time-sensitive
        information should be verified through those sources. Dates use America/Vancouver. Sources
        older than 90 days are flagged for review; over 180 days are stale. Unverified entries are
        clearly marked and should be checked before sharing.
      </p>
      <p>
        Library floor details were supplied in the project specification. Where source retrieval was
        blocked, verification remains incomplete. International resources point to SFU; this tool
        does not provide legal or immigration advice.
      </p>
      <h2>Course data</h2>
      <p>
        Course Planner discovers the public offering universe from SFU CourSys for Fall 2026 (1267)
        and Spring 2027 (1271), with details from SFU Course Outlines. Each term shows its subject
        coverage and snapshot time. It is not live enrollment data. Missing schedules, seats,
        instructors or prerequisites remain unavailable. Always verify all required lectures,
        tutorials and labs in the official outline and goSFU.
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
