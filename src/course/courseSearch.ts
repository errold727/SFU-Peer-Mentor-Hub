import { departments, terms } from './courseTypes';
import { validateCourseDataset } from './validation';
export { validateCourseDataset } from './validation';
export async function loadCourses(term: string, department: string, signal?: AbortSignal) {
  if (!(term in terms) || !departments.includes(department))
    throw new Error('Choose a supported term and department.');
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/courses/${term}/${department.toLowerCase()}.json`,
    { signal },
  );
  if (!response.ok) throw new Error('Course data could not be loaded. Please try again.');
  let data: unknown;
  try {
    data = await response.json();
    validateCourseDataset(data);
  } catch {
    throw new Error(
      'This course snapshot is unavailable or needs repair. Try another department or use official SFU Course Outlines.',
    );
  }
  if (
    data.courses.some(
      (c) => c.term !== terms[term as keyof typeof terms] || c.department !== department,
    )
  )
    throw new Error('Course dataset does not match the selected filters.');
  return data;
}
