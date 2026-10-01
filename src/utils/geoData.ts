export interface GeoLocation {
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  region?: string;
}

const TIMEZONE_GEO_MAP: Record<string, GeoLocation> = {
  'America/New_York': { country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.006, region: 'New York' },
  'America/Chicago': { country: 'United States', countryCode: 'US', latitude: 41.8781, longitude: -87.6298, region: 'Illinois' },
  'America/Denver': { country: 'United States', countryCode: 'US', latitude: 39.7392, longitude: -104.9903, region: 'Colorado' },
  'America/Los_Angeles': { country: 'United States', countryCode: 'US', latitude: 34.0522, longitude: -118.2437, region: 'California' },
  'America/Toronto': { country: 'Canada', countryCode: 'CA', latitude: 43.6532, longitude: -79.3832, region: 'Ontario' },
  'America/Vancouver': { country: 'Canada', countryCode: 'CA', latitude: 49.2827, longitude: -123.1207, region: 'British Columbia' },
  'America/Sao_Paulo': { country: 'Brazil', countryCode: 'BR', latitude: -23.5505, longitude: -46.6333, region: 'São Paulo' },
  'America/Mexico_City': { country: 'Mexico', countryCode: 'MX', latitude: 19.4326, longitude: -99.1332, region: 'CDMX' },

  'Europe/London': { country: 'United Kingdom', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, region: 'London' },
  'Europe/Paris': { country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, region: 'Île-de-France' },
  'Europe/Berlin': { country: 'Germany', countryCode: 'DE', latitude: 52.52, longitude: 13.405, region: 'Berlin' },
  'Europe/Amsterdam': { country: 'Netherlands', countryCode: 'NL', latitude: 52.3676, longitude: 4.9041, region: 'North Holland' },
  'Europe/Madrid': { country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038, region: 'Madrid' },
  'Europe/Rome': { country: 'Italy', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964, region: 'Lazio' },
  'Europe/Dublin': { country: 'Ireland', countryCode: 'IE', latitude: 53.3498, longitude: -6.2603, region: 'Leinster' },
  'Europe/Stockholm': { country: 'Sweden', countryCode: 'SE', latitude: 59.3293, longitude: 18.0686, region: 'Stockholm' },

  'Asia/Tokyo': { country: 'Japan', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, region: 'Tokyo' },
  'Asia/Singapore': { country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, region: 'Singapore' },
  'Asia/Hong_Kong': { country: 'Hong Kong', countryCode: 'HK', latitude: 22.3193, longitude: 114.1694, region: 'Hong Kong' },
  'Asia/Seoul': { country: 'South Korea', countryCode: 'KR', latitude: 37.5665, longitude: 126.978, region: 'Seoul' },
  'Asia/Manila': { country: 'Philippines', countryCode: 'PH', latitude: 14.5995, longitude: 120.9842, region: 'Metro Manila' },
  'Asia/Kolkata': { country: 'India', countryCode: 'IN', latitude: 28.6139, longitude: 77.209, region: 'Delhi' },
  'Asia/Dubai': { country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, region: 'Dubai' },
  'Australia/Sydney': { country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093, region: 'NSW' },
  'Australia/Melbourne': { country: 'Australia', countryCode: 'AU', latitude: -37.8136, longitude: 144.9631, region: 'Victoria' },
  'Pacific/Auckland': { country: 'New Zealand', countryCode: 'NZ', latitude: -36.8485, longitude: 174.7633, region: 'Auckland' }
};

export function resolveGeoLocation(timeZone: string): GeoLocation {
  if (TIMEZONE_GEO_MAP[timeZone]) {
    return TIMEZONE_GEO_MAP[timeZone];
  }

  if (timeZone.startsWith('America/')) {
    return { country: 'United States', countryCode: 'US', latitude: 39.8283, longitude: -98.5795 };
  }
  if (timeZone.startsWith('Europe/')) {
    return { country: 'Germany', countryCode: 'DE', latitude: 51.1657, longitude: 10.4515 };
  }
  if (timeZone.startsWith('Asia/')) {
    return { country: 'Japan', countryCode: 'JP', latitude: 36.2048, longitude: 138.2529 };
  }
  if (timeZone.startsWith('Australia/')) {
    return { country: 'Australia', countryCode: 'AU', latitude: -25.2744, longitude: 133.7751 };
  }

  return { country: 'Global / Edge', countryCode: 'GL', latitude: 20.0, longitude: 0.0 };
}

export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'GL') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
