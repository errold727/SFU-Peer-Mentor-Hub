/** Audit findings are review requests, never new facts or verification stamps. */
export type Finding = {
  id: string;
  code: string;
  severity: 'error' | 'warning';
  priority: 'high' | 'normal';
  resourceIds: string[];
  message: string;
  url?: string;
  context?: string;
};

export type AuditScope = 'all' | 'resources' | 'courses' | 'links' | 'search';
