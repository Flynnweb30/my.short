/**
 * Visitor & Session Tracking Identity Engine
 * Manages unique visitor IDs, session boundaries, event IDs, and UTM parameter extraction.
 */

const VISITOR_ID_KEY = 'myshort_visitor_id';
const SESSION_ID_KEY = 'myshort_session_id';

/**
 * Get or generate persistent unique visitor ID (stored in localStorage)
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `vis_ephemeral_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Get or generate ephemeral session ID (stored in sessionStorage)
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `ses_ephemeral_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Generate a cryptographically distinct unique event ID for every click
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract UTM tags from current query string or destination URL
 */
export function extractUtmParams(urlOrQuery?: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;
} {
  const result: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    utmId?: string;
  } = {};

  try {
    let search = '';
    if (urlOrQuery) {
      if (urlOrQuery.includes('?')) {
        search = urlOrQuery.split('?')[1] || '';
      } else if (urlOrQuery.startsWith('utm_') || urlOrQuery.includes('=')) {
        search = urlOrQuery;
      }
    } else if (typeof window !== 'undefined') {
      search = window.location.search.replace(/^\?/, '');
    }

    if (!search) return result;

    const params = new URLSearchParams(search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    const content = params.get('utm_content');
    const term = params.get('utm_term');
    const id = params.get('utm_id');

    if (source) result.utmSource = source;
    if (medium) result.utmMedium = medium;
    if (campaign) result.utmCampaign = campaign;
    if (content) result.utmContent = content;
    if (term) result.utmTerm = term;
    if (id) result.utmId = id;
  } catch {
    // fallback
  }

  return result;
}
