import { makeBlock, campusArt } from '../blocks';
import {
  makeElement,
  type PosterDocument,
  type PosterElement,
  type BlockKind,
  type BlockContent,
} from '../posterTypes';
export const templates = [
  { id: 'blank', name: 'Blank Poster', description: 'A clean canvas in your chosen style.' },
  {
    id: 'welcome',
    name: 'Welcome to SFU',
    description: 'A campus welcome and personal introduction.',
  },
  {
    id: 'weekly',
    name: 'Weekly Check-In',
    description: 'A greeting, announcement and resource grid.',
  },
  {
    id: 'deadlines',
    name: 'Important Deadlines',
    description: 'A clear timeline of dates and next steps.',
  },
  {
    id: 'library',
    name: 'Library Guide',
    description: 'Study spaces, services and a floor guide.',
  },
  {
    id: 'recreation',
    name: 'Recreation Guide',
    description: 'A schedule with room for practical details.',
  },
  {
    id: 'courses',
    name: 'Course Planning',
    description: 'Course tables and a planning checklist.',
  },
  {
    id: 'event',
    name: 'Workshop / Event',
    description: 'A bold invitation with essential event details.',
  },
  {
    id: 'essentials',
    name: 'Student Essentials',
    description: 'Six quick-reference resource cards.',
  },
  {
    id: 'newsletter',
    name: 'Check-In Newsletter',
    description: 'Weekly updates, events, schedules and course planning.',
  },
];
// Old saved documents remain supported; the old information id is an alias, not an 11th template.
export function createTemplate(id = 'information'): PosterDocument {
  if (id === 'information')
    return {
      size: 'letter',
      background: '#faf9f6',
      template: 'essentials',
      elements: [
        makeElement('shape', {
          x: 0,
          y: 0,
          width: 816,
          height: 22,
          shape: 'rectangle',
          text: '',
          color: '#a6192e',
        }),
        makeElement('text', {
          x: 48,
          y: 65,
          width: 720,
          height: 95,
          text: 'STUDENT ESSENTIALS',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#a6192e',
          padding: 0,
        }),
        makeElement('text', {
          x: 48,
          y: 160,
          width: 720,
          height: 70,
          text: 'Your SFU resource collection',
          fontSize: 22,
          padding: 0,
        }),
        makeElement('footer', {
          x: 48,
          y: 984,
          width: 720,
          height: 44,
          text: 'Contact your Peer Mentor',
          fontSize: 14,
          padding: 0,
        }),
      ],
    };
  const elements: PosterElement[] = [];
  const add = (
    kind: BlockKind,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    content: Partial<BlockContent> = {},
    props: Partial<PosterElement> = {},
  ) => {
    elements.push(
      makeBlock(
        kind,
        { label, ...content },
        { x, y, width, height, zIndex: elements.length, ...props },
      ),
    );
  };
  const hero = (y = 32, h = 190) =>
    add('hero', 'Hero Image', 32, y, 752, h, {}, { src: campusArt, padding: 0, borderWidth: 0 });
  const title = (text: string, y: number, h = 85, size = 38) =>
    add(
      'title',
      'Title Banner',
      32,
      y,
      752,
      h,
      { title: text, accentColor: '#a6192e', bannerStyle: 'brush' },
      { fontSize: size, color: '#ffffff', padding: 12, borderWidth: 0, backgroundColor: '#faf9f6' },
    );
  const footer = () =>
    add(
      'footer',
      'Footer',
      32,
      970,
      752,
      54,
      { body: 'Contact your Peer Mentor', icon: '↗' },
      { backgroundColor: '#172d43', color: '#ffffff', fontSize: 16, padding: 17, borderWidth: 0 },
    );
  const info = (
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    body: string,
    icon = '',
  ) => add('info', label, x, y, w, h, { title: label.toUpperCase(), body, icon });
  const doc = () => ({
    size: 'letter',
    background: '#faf9f6',
    template: templates.some((t) => t.id === id) ? id : 'blank',
    elements,
  });
  if (id === 'blank') return doc();
  if (id === 'newsletter' || id === 'weekly') {
    hero(32, 165);
    title(id === 'newsletter' ? 'WEEKLY CHECK-IN' : 'THIS WEEK AT SFU', 209, 72, 34);
    add(
      'greeting',
      'Greeting',
      32,
      293,
      752,
      51,
      { body: 'Hope your week is going well, {{recipientName}}!' },
      { backgroundColor: '#e9e4db', padding: 15, fontSize: 17, borderWidth: 0 },
    );
    add(
      'text',
      'Intro',
      32,
      354,
      752,
      42,
      { body: 'Your weekly collection of updates and useful resources.', role: 'header' },
      { padding: 8, fontSize: 17, backgroundColor: 'transparent', borderWidth: 0 },
    );
    add(
      'highlight',
      'Announcement',
      32,
      408,
      752,
      103,
      { title: 'IMPORTANT DATE', body: 'Add a verified announcement and the action to take.' },
      { fontSize: 18, backgroundColor: '#fff1ed' },
    );
    info(
      'Get Involved',
      32,
      525,
      368,
      197,
      'Add an opportunity, workshop or campus resource.\n\nChoose Replace Content to use the Resource Hub.',
      '↗',
    );
    add(
      'schedule',
      'Recreation',
      416,
      525,
      368,
      197,
      {
        title: 'DROP-IN RECREATION',
        columns: ['Activity', 'When'],
        rows: [
          ['Activity', 'Day · Time'],
          ['Activity', 'Day · Time'],
        ],
      },
      { fontSize: 16, padding: 14 },
    );
    add(
      'table',
      'Course Planning',
      32,
      736,
      368,
      218,
      {
        title: 'PLAN AHEAD',
        subtitle: 'Future course offerings',
        columns: ['Course', 'Instructor'],
        rows: [
          ['Course code', 'Instructor'],
          ['Course code', 'Instructor'],
          ['Course code', 'Instructor'],
        ],
      },
      { fontSize: 16, padding: 14 },
    );
    info(
      'Planning Tips',
      416,
      736,
      368,
      218,
      'Review prerequisites.\nCompare schedules.\nCheck required sections.\nConfirm details with SFU.',
      '✓',
    );
    footer();
    return doc();
  }
  if (id === 'welcome') {
    hero(32, 300);
    title('WELCOME TO SFU', 346, 95, 46);
    add(
      'greeting',
      'Greeting',
      32,
      455,
      752,
      62,
      { body: 'Hello, {{recipientName}}!' },
      { fontSize: 26, padding: 14, borderWidth: 0, backgroundColor: 'transparent' },
    );
    info(
      'Meet Your Peer Mentor',
      32,
      533,
      470,
      285,
      'Introduce yourself.\n\nShare your interests, languages and how students can reach you.',
      '⌂',
    );
    add('checklist', 'Get Started', 518, 533, 266, 285, {
      title: 'GET STARTED',
      items: ['Explore your campus', 'Find a study space', 'Ask a question'],
    });
    add(
      'text',
      'Contact',
      32,
      836,
      752,
      110,
      { body: 'Add your preferred contact details and availability.' },
      { backgroundColor: '#e9e4db' },
    );
    footer();
    return doc();
  }
  if (id === 'deadlines') {
    title('DATES TO REMEMBER', 32, 126, 40);
    add(
      'text',
      'Introduction',
      32,
      174,
      752,
      62,
      { body: 'Add verified dates and check the official source before sharing.', role: 'header' },
      { fontSize: 20, borderWidth: 0, backgroundColor: 'transparent' },
    );
    [260, 440, 620].forEach((y, i) =>
      add(
        'highlight',
        `Date ${i + 1}`,
        32,
        y,
        752,
        162,
        {
          title: `0${i + 1}   IMPORTANT DATE`,
          subtitle: 'Date · Action required',
          body: 'Add the deadline and a concise next step.',
        },
        { backgroundColor: i % 2 ? '#ffffff' : '#f1e4df', fontSize: 21 },
      ),
    );
    add('checklist', 'Before You Submit', 32, 800, 752, 154, {
      title: 'BEFORE YOU SUBMIT',
      items: ['Confirm the date and timezone', 'Review required documents'],
    });
    footer();
    return doc();
  }
  if (id === 'library') {
    title('LIBRARY GUIDE', 32, 106, 45);
    hero(152, 200);
    add(
      'table',
      'Floor Guide',
      32,
      370,
      454,
      380,
      {
        title: 'FIND YOUR SPACE',
        columns: ['Area', 'Good for'],
        rows: [
          ['Floor / area', 'Study style'],
          ['Floor / area', 'Study style'],
          ['Floor / area', 'Study style'],
          ['Floor / area', 'Study style'],
        ],
      },
      { fontSize: 20 },
    );
    info(
      'Library Services',
      502,
      370,
      282,
      380,
      'Replace this card with a verified Library resource.\n\nKeep source limitations visible in your wording.',
      '⌂',
    );
    info(
      'Research & Writing',
      32,
      766,
      752,
      188,
      'Add research, writing or learning support details from the Resource Hub.',
      '→',
    );
    footer();
    return doc();
  }
  if (id === 'recreation') {
    hero(32, 210);
    title('MAKE TIME TO MOVE', 256, 88, 40);
    add(
      'schedule',
      'Recreation Schedule',
      32,
      360,
      752,
      400,
      {
        title: 'DROP-IN SCHEDULE',
        columns: ['Activity', 'Day', 'Time'],
        rows: [
          ['Activity', 'Day', 'Time'],
          ['Activity', 'Day', 'Time'],
          ['Activity', 'Day', 'Time'],
          ['Activity', 'Day', 'Time'],
        ],
      },
      { fontSize: 22, padding: 22 },
    );
    info(
      'Before You Go',
      32,
      776,
      368,
      178,
      'Confirm the current schedule, location and entry requirements.',
      '✓',
    );
    info('Bring Along', 416, 776, 368, 178, 'Add a short equipment or preparation list.', '→');
    footer();
    return doc();
  }
  if (id === 'courses') {
    title('PLAN YOUR TERM', 32, 106, 44);
    add(
      'text',
      'Introduction',
      32,
      154,
      752,
      65,
      { body: 'Compare your options. Confirm final details with SFU.', role: 'header' },
      { fontSize: 21, borderWidth: 0, backgroundColor: 'transparent' },
    );
    add(
      'table',
      'Course Offerings',
      32,
      235,
      752,
      330,
      {
        title: 'FUTURE COURSE OFFERINGS',
        columns: ['Course', 'Instructor', 'Schedule'],
        rows: [
          ['Course code', 'Instructor', 'Days · Time'],
          ['Course code', 'Instructor', 'Days · Time'],
          ['Course code', 'Instructor', 'Days · Time'],
        ],
      },
      { fontSize: 19, padding: 22 },
    );
    add('checklist', 'Planning Checklist', 32, 581, 368, 280, {
      title: 'PLAN AHEAD',
      items: [
        'Review prerequisites',
        'Compare meeting times',
        'Check required sections',
        'Keep a backup option',
      ],
    });
    info(
      'Schedule Notes',
      416,
      581,
      368,
      280,
      'Add schedule considerations or insert a conflict notice from your course selections.',
      '!',
    );
    add(
      'text',
      'Reminder',
      32,
      877,
      752,
      77,
      { body: 'Offerings and schedules may change before enrolment.' },
      { fontSize: 20, backgroundColor: '#e9e4db' },
    );
    footer();
    return doc();
  }
  if (id === 'event') {
    hero(32, 300);
    title('WORKSHOP / EVENT', 348, 132, 48);
    add(
      'text',
      'Event Title',
      32,
      498,
      752,
      115,
      { title: 'YOUR EVENT TITLE', body: 'Add a short description of the session.' },
      { fontSize: 28, borderWidth: 0, backgroundColor: 'transparent' },
    );
    add(
      'list',
      'Event Details',
      32,
      630,
      470,
      300,
      {
        title: 'THE DETAILS',
        items: ['When · Date and time', 'Where · Location', 'Bring · What to prepare'],
      },
      { fontSize: 23 },
    );
    add(
      'qr',
      'Event QR',
      548,
      651,
      205,
      205,
      { body: 'https://www.sfu.ca/' },
      { text: 'https://www.sfu.ca/', padding: 0 },
    );
    footer();
    return doc();
  }
  if (id === 'essentials') {
    title('STUDENT ESSENTIALS', 32, 106, 40);
    add(
      'greeting',
      'Greeting',
      32,
      152,
      752,
      65,
      { body: 'Your campus quick-reference guide, {{recipientName}}.' },
      { fontSize: 22, backgroundColor: 'transparent', borderWidth: 0 },
    );
    [
      'Library',
      'Campus Safety',
      'Academic Support',
      'Recreation',
      'Student Services',
      'Getting Around',
    ].forEach((label, i) =>
      info(
        label,
        32 + (i % 2) * 384,
        235 + Math.floor(i / 2) * 240,
        368,
        224,
        'Choose a Resource Hub card or add your own information.',
        ['⌂', '!', '✓', '→', '★', '↗'][i],
      ),
    );
    footer();
  }
  return doc();
}
