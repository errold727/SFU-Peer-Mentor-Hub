import { create } from 'zustand';
import { courseId, type CourseOffering } from '../course/courseTypes';

// One session-only selection list. Complete public snapshots are kept with selections
// so filtering, navigation and cache eviction cannot lose their meeting details.
type PlannerState = {
  selected: CourseOffering[];
  mostRecentTerm: string | null;
  selectionRevision: Record<string, number>;
  addSelectedSection: (course: CourseOffering, expectedRevision?: number) => void;
  removeSelectedSection: (id: string) => void;
  clearSelectedSectionsForTerm: (term: string) => void;
};

export const useCoursePlanner = create<PlannerState>((set) => ({
  selected: [],
  mostRecentTerm: null,
  selectionRevision: {},
  addSelectedSection: (course, expectedRevision) =>
    set((state) =>
      (expectedRevision !== undefined &&
        expectedRevision !== (state.selectionRevision[course.term] ?? 0)) ||
      state.selected.some((entry) => courseId(entry) === courseId(course))
        ? state
        : { selected: [...state.selected, course], mostRecentTerm: course.term },
    ),
  removeSelectedSection: (id) =>
    set((state) => ({
      selected: state.selected.filter((entry) => courseId(entry) !== id),
    })),
  clearSelectedSectionsForTerm: (term) =>
    set((state) => ({
      selected: state.selected.filter((entry) => entry.term !== term),
      // In-flight detail loads from before Clear must not silently re-add choices.
      selectionRevision: {
        ...state.selectionRevision,
        [term]: (state.selectionRevision[term] ?? 0) + 1,
      },
    })),
}));

export function defaultTimetableTerm(
  selected: CourseOffering[],
  browsedTerm: string,
  recent: string | null,
) {
  const terms = new Set(selected.map((course) => course.term));
  return terms.has(browsedTerm)
    ? browsedTerm
    : recent && terms.has(recent)
      ? recent
      : (selected.at(-1)?.term ?? browsedTerm);
}
