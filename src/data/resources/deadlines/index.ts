import type { SFUResource } from '../types';
export const deadlineSource = 'https://www.sfu.ca/students/deadlines/fall.html';
const entries = [
 ['2026-09-09','Fall classes start'],['2026-09-15','Last day to add/swap classes or change tutorials using goSFU'],['2026-09-15','Last day for 100% tuition refund'],['2026-09-22','Last day to drop without WD'],['2026-09-22','Last day for 75% tuition refund'],['2026-09-22','Tuition and supplementary fees due'],['2026-09-29','Last day for 50% tuition refund'],['2026-09-30','No tuition refund starting this date'],['2026-11-03','Last day to drop using goSFU with WD'],['2026-12-07','Last day of classes'],['2026-12-09','Exam period begins'],['2026-12-20','Exam period ends'],
];
export const deadlines: SFUResource[] = entries.map(([date,title],i) => ({ id:`deadline-${i}`, title, date, category:'deadline', summary:'Fall 2026 undergraduate deadline. Check the official source for conditions and exceptions.', campus:'All', term:'Fall 2026', sourceName:'SFU Dates & Deadlines', sourceUrl: i === 9 || i === 10 ? 'https://www.sfu.ca/students/calendar/2026/fall.html' : deadlineSource, lastVerified:'2026-10-03', posterCompatible:true, tags:['refund','tuition','dates','fall',title] }));

