/**
 * Geolocation & Timezone Resolution Engine for Real Live Telemetry
 * Resolves location strictly from legitimate tracking events using verified IP geolocation
 * and authentic IANA timezones. Does NOT use fake locations, mock coordinates, or simulated cities.
 */

export interface GeoLocationResult {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  timeZone: string;
  locationPrecision: 'precise' | 'approximate' | 'unavailable' | 'unresolved';
  ip?: string;
}

/**
 * Resolve authentic live geolocation and timezone from incoming request / client IP
 */
export async function resolveLiveEventGeo(): Promise<GeoLocationResult> {
  // Capture verified client browser timezone if available
  let clientTz = 'Unknown';
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && typeof detected === 'string') {
      clientTz = detected;
    }
  } catch {
    // fallback
  }

  // 1. Attempt lookup via backend API endpoint (/api/geo/lookup)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/geo/lookup', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        data &&
        data.status === 'precise' &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        !isNaN(data.latitude) &&
        !isNaN(data.longitude)
      ) {
        return {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'UN',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude,
          longitude: data.longitude,
          timeZone: data.timeZone || clientTz,
          locationPrecision: 'precise',
          ip: data.ip,
        };
      }
    }
  } catch {
    // Backend lookup failed or timed out
  }

  // 2. Direct client fallback via free public IP geolocation endpoint
  if (typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const clientRes = await fetch('https://ipwho.is/', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        if (
          clientData &&
          clientData.success !== false &&
          typeof clientData.latitude === 'number' &&
          typeof clientData.longitude === 'number' &&
          !isNaN(clientData.latitude) &&
          !isNaN(clientData.longitude)
        ) {
          return {
            country: clientData.country || 'Unknown',
            countryCode: clientData.country_code || 'UN',
            region: clientData.region || 'Unknown',
            city: clientData.city || 'Unknown',
            latitude: Number(clientData.latitude),
            longitude: Number(clientData.longitude),
            timeZone: clientData.timezone?.id || clientTz,
            locationPrecision: 'precise',
            ip: clientData.ip,
          };
        }
      }
    } catch {
      // Direct client lookup failed or blocked by content blocker
    }
  }

  // 3. Fallback when geographic coordinates cannot be resolved
  // Display Unknown/Unavailable rather than inventing synthetic coordinates or fake cities
  return {
    country: 'Unknown',
    countryCode: 'UN',
    region: 'Unknown',
    city: 'Unknown',
    latitude: null,
    longitude: null,
    timeZone: clientTz,
    locationPrecision: clientTz !== 'Unknown' ? 'approximate' : 'unavailable',
  };
}

/**
 * Compute authentic live local time for a verified IANA timezone.
 * Returns "Unavailable" if the timezone is missing or unresolved.
 */
export function getLiveLocalTime(timeZone?: string | null): string {
  if (!timeZone || timeZone === 'Unknown') {
    return 'Unavailable';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return 'Unavailable';
  }
}
