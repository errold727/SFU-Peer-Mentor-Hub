import type { DirectoryResource, ResourceSource, Evidence } from '../types';

export const reviewCadenceDays = {
  schedule: 7,
  sensitive: 14,
  safety: 30,
  evergreen: 180,
} as const;
export type SourceInput = Omit<ResourceSource, 'id'> & {
  id?: string;
  locator: string;
  fields: string[];
  note?: string;
};
export type CatalogInput = Omit<
  DirectoryResource,
  | 'schemaVersion'
  | 'sourceName'
  | 'sourceUrl'
  | 'lastVerified'
  | 'campus'
  | 'posterCompatible'
  | 'sources'
  | 'evidence'
  | 'reviewDueAt'
  | 'facts'
  | 'details'
  | 'locations'
  | 'contacts'
  | 'relatedIds'
  | 'aliases'
  | 'tags'
  | 'actionUrl'
  | 'lifecycle'
> & {
  sources: SourceInput[];
  evidence?: Evidence[];
  facts?: DirectoryResource['facts'];
  details?: DirectoryResource['details'];
  locations?: DirectoryResource['locations'];
  contacts?: DirectoryResource['contacts'];
  relatedIds?: string[];
  aliases?: string[];
  tags?: string[];
  actionUrl?: string;
  lifecycle?: DirectoryResource['lifecycle'];
};
// Only publication-shape defaults live here. Research dates and review outcomes must be explicit.
export function defineResource(input: CatalogInput): DirectoryResource {
  const { sources, evidence = [], ...data } = input;
  const sourceRecords = sources.map((s, i): ResourceSource => ({
    id: s.id ?? `s${i + 1}`,
    title: s.title,
    url: s.url,
    lastRetrievalAttemptAt: s.lastRetrievalAttemptAt,
    lastRetrievedAt: s.lastRetrievedAt,
    retrievalStatus: s.retrievalStatus,
    ...(s.sourcePublishedAt ? { sourcePublishedAt: s.sourcePublishedAt } : {}),
    ...(s.sourceUpdatedAt ? { sourceUpdatedAt: s.sourceUpdatedAt } : {}),
  }));
  const reviewed = input.verification.status === 'reviewed' && input.verification.verifiedAt;
  const due = reviewed ? new Date(input.verification.verifiedAt!) : null;
  if (due) due.setUTCDate(due.getUTCDate() + reviewCadenceDays[input.reviewCadence]);
  return {
    details: [],
    locations: [],
    contacts: [],
    relatedIds: [],
    aliases: [],
    tags: [],
    facts: [],
    lifecycle: 'active',
    ...data,
    schemaVersion: 2,
    sources: sourceRecords,
    evidence: [
      ...sources.flatMap((s, i) =>
        s.fields.map((field) => ({
          field,
          sourceId: sourceRecords[i].id,
          locator: s.locator,
          ...(s.note ? { note: s.note } : {}),
        })),
      ),
      ...evidence,
    ],
    sourceUrl: sourceRecords[0].url,
    sourceName: sourceRecords[0].title,
    actionUrl: input.actionUrl ?? sourceRecords[0].url,
    campus:
      input.campuses.length === 1 && input.campuses[0] !== 'Online' ? input.campuses[0] : 'All',
    lastVerified: reviewed ? input.verification.verifiedAt!.slice(0, 10) : null,
    posterCompatible: true,
    reviewDueAt: due?.toISOString().slice(0, 10) ?? null,
  };
}
