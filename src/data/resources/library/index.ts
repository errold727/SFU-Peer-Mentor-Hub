import { academicResources } from '../catalog/academic';
export const library = academicResources.find(r=>r.id==='bennett-library')!;
// Legacy export retained; the old floor guide has no current supporting evidence.
export const libraryFloors: { floor: number; title: string; detail: string }[] = [];
