// Shared by the browser and the Node server — keep it dependency-free.

const RELEASE = { y: 2026, m: 11, d: 19 };

// Reported (Forbes, allthings.how, keymap.io): the US PlayStation Store treats the whole
// country as one release region keyed to Eastern Time.
const US_STORE_TZ = 'America/New_York';

const REGIONS = {
  oceania: 'Oceania',
  asia: 'Asia',
  mea: 'Middle East & Africa',
  europe: 'Europe',
  americas: 'Americas',
};

const ZONES = [
  { id: 'auckland', tz: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿', region: 'oceania', slug: 'new-zealand', also: ['Wellington', 'Christchurch'] },
  { id: 'sydney', tz: 'Australia/Sydney', city: 'Sydney', country: 'Australia (NSW / VIC / ACT / TAS)', flag: '🇦🇺', region: 'oceania', slug: 'australia-sydney-melbourne', also: ['Melbourne', 'Canberra', 'Hobart'] },
  { id: 'adelaide', tz: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia (SA)', flag: '🇦🇺', region: 'oceania', slug: 'australia-adelaide', also: [] },
  { id: 'brisbane', tz: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia (QLD)', flag: '🇦🇺', region: 'oceania', slug: 'australia-brisbane', also: ['Gold Coast', 'Cairns'] },
  { id: 'tokyo', tz: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'asia', slug: 'japan', also: ['Osaka', 'Kyoto'] },
  { id: 'seoul', tz: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', region: 'asia', slug: 'south-korea', also: ['Busan'] },
  { id: 'perth', tz: 'Australia/Perth', city: 'Perth', country: 'Australia (WA)', flag: '🇦🇺', region: 'oceania', slug: 'australia-perth', also: [] },
  { id: 'singapore', tz: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', region: 'asia', slug: 'singapore-malaysia', also: ['Kuala Lumpur'] },
  { id: 'hongkong', tz: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', region: 'asia', slug: 'hong-kong-taiwan', also: ['Taipei', 'Macau'] },
  { id: 'manila', tz: 'Asia/Manila', city: 'Manila', country: 'Philippines', flag: '🇵🇭', region: 'asia', slug: 'philippines', also: ['Cebu'] },
  { id: 'bangkok', tz: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', region: 'asia', slug: 'thailand-vietnam', also: ['Ho Chi Minh City', 'Hanoi'] },
  { id: 'jakarta', tz: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', region: 'asia', slug: 'indonesia', also: ['Bandung', 'Surabaya'] },
  { id: 'india', tz: 'Asia/Kolkata', city: 'Mumbai', country: 'India', flag: '🇮🇳', region: 'asia', slug: 'india', also: ['Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'] },
  { id: 'karachi', tz: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', flag: '🇵🇰', region: 'asia', slug: 'pakistan', also: ['Lahore', 'Islamabad'] },
  { id: 'dubai', tz: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', region: 'mea', slug: 'uae-dubai', also: ['Abu Dhabi', 'Muscat'] },
  { id: 'riyadh', tz: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', region: 'mea', slug: 'saudi-arabia-qatar-kuwait', also: ['Jeddah', 'Doha', 'Kuwait City'] },
  { id: 'istanbul', tz: 'Europe/Istanbul', city: 'Istanbul', country: 'Türkiye', flag: '🇹🇷', region: 'europe', slug: 'turkey', also: ['Ankara'] },
  { id: 'johannesburg', tz: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', region: 'mea', slug: 'south-africa', also: ['Cape Town', 'Durban'] },
  { id: 'berlin', tz: 'Europe/Berlin', city: 'Berlin', country: 'Central Europe (CET)', flag: '🇪🇺', region: 'europe', slug: 'europe-germany-france-spain-italy', also: ['Paris', 'Madrid', 'Rome', 'Amsterdam', 'Warsaw', 'Stockholm'] },
  { id: 'london', tz: 'Europe/London', city: 'London', country: 'UK & Ireland', flag: '🇬🇧', region: 'europe', slug: 'uk-ireland', also: ['Manchester', 'Dublin', 'Lisbon'] },
  { id: 'saopaulo', tz: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', region: 'americas', slug: 'brazil', also: ['Rio de Janeiro', 'Brasília'] },
  { id: 'buenosaires', tz: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', region: 'americas', slug: 'argentina-chile', also: ['Santiago'] },
  { id: 'bogota', tz: 'America/Bogota', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴', region: 'americas', slug: 'colombia-peru', also: ['Lima', 'Medellín'] },
  { id: 'newyork', tz: 'America/New_York', city: 'New York', country: 'USA — Eastern', flag: '🇺🇸', region: 'americas', slug: 'usa-eastern-time', also: ['Miami', 'Atlanta', 'Boston'], us: true },
  { id: 'toronto', tz: 'America/Toronto', city: 'Toronto', country: 'Canada — Eastern', flag: '🇨🇦', region: 'americas', slug: 'canada-toronto-montreal', also: ['Montréal', 'Ottawa'] },
  { id: 'chicago', tz: 'America/Chicago', city: 'Chicago', country: 'USA — Central', flag: '🇺🇸', region: 'americas', slug: 'usa-central-time', also: ['Dallas', 'Houston', 'Austin'], us: true },
  { id: 'mexico', tz: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', region: 'americas', slug: 'mexico', also: ['Guadalajara', 'Monterrey'] },
  { id: 'denver', tz: 'America/Denver', city: 'Denver', country: 'USA — Mountain', flag: '🇺🇸', region: 'americas', slug: 'usa-mountain-time', also: ['Phoenix', 'Salt Lake City'], us: true },
  { id: 'losangeles', tz: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA — Pacific', flag: '🇺🇸', region: 'americas', slug: 'usa-pacific-time', also: ['San Francisco', 'Seattle', 'Las Vegas'], us: true },
  { id: 'honolulu', tz: 'Pacific/Honolulu', city: 'Honolulu', country: 'USA — Hawaii', flag: '🇺🇸', region: 'americas', slug: 'usa-hawaii', also: [], us: true },
];

const US_TZ_PREFIXES = [
  'America/New_York', 'America/Detroit', 'America/Indiana', 'America/Kentucky', 'America/Chicago',
  'America/Menominee', 'America/North_Dakota', 'America/Denver', 'America/Boise', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'America/Juneau', 'America/Sitka', 'America/Metlakatla',
  'America/Yakutat', 'America/Nome', 'America/Adak', 'Pacific/Honolulu', 'US/',
];

const isUsTz = (tz) => US_TZ_PREFIXES.some((p) => tz === p || tz.startsWith(p.endsWith('/') ? p : `${p}/`));

const zoneBySlug = (slug) => ZONES.find((z) => z.slug === slug);

export { RELEASE, US_STORE_TZ, REGIONS, ZONES, isUsTz, zoneBySlug };
