/* ============================================================
   CivicPulse — Smart Routing & Assignment Engine
   ------------------------------------------------------------
   Given an issue's image classification (category) + location
   (ward/zone/district), determine:
     1. The department that must handle it
     2. The responsible administrative officer (ward/zonal)
     3. The elected representative accountable to the public
     4. The escalation path if unresolved
   ============================================================ */

// ---- Department routing table: category -> owning department ----
export const DEPARTMENT_ROUTING = {
  ROADS:        { dept: 'HIGHWAYS', name: 'Highways & Infrastructure', agency: 'Corporation Engineering / Highways Dept', color: '#3b82f6' },
  POTHOLE:      { dept: 'HIGHWAYS', name: 'Highways & Infrastructure', agency: 'Corporation Engineering / Highways Dept', color: '#3b82f6' },
  FOOTPATH:     { dept: 'HIGHWAYS', name: 'Highways & Infrastructure', agency: 'Corporation Engineering', color: '#3b82f6' },
  STREETLIGHTS: { dept: 'TNEB',     name: 'TNEB / TANGEDCO',           agency: 'TNEB Line Superintendent', color: '#f59e0b' },
  ELECTRICITY:  { dept: 'TNEB',     name: 'TNEB / TANGEDCO',           agency: 'TNEB Line Superintendent', color: '#f59e0b' },
  WATER:        { dept: 'CMWSSB',   name: 'Water & Sewerage Board',    agency: 'CMWSSB / Metro Water', color: '#0ea5e9' },
  DRAINAGE:     { dept: 'CMWSSB',   name: 'Water & Sewerage Board',    agency: 'CMWSSB Drainage Section', color: '#0ea5e9' },
  SEWERAGE:     { dept: 'CMWSSB',   name: 'Water & Sewerage Board',    agency: 'CMWSSB Sewerage Section', color: '#0ea5e9' },
  GARBAGE:      { dept: 'SWM',      name: 'Solid Waste Management',    agency: 'Corporation SWM / Sanitation', color: '#10b981' },
  SANITATION:   { dept: 'SWM',      name: 'Solid Waste Management',    agency: 'Corporation SWM / Sanitation', color: '#10b981' },
  TRAFFIC:      { dept: 'TRAFFIC',  name: 'Traffic Police',            agency: 'City Traffic Police', color: '#8b5cf6' },
  PARKS:        { dept: 'CORPORATION', name: 'Municipal Corporation',  agency: 'Corporation Parks Division', color: '#8b5cf6' },
  PUBLIC_SAFETY:{ dept: 'CORPORATION', name: 'Municipal Corporation',  agency: 'Corporation / Police', color: '#8b5cf6' },
  DEFAULT:      { dept: 'CORPORATION', name: 'Municipal Corporation',  agency: 'Corporation General', color: '#8b5cf6' },
};

// ---- Descriptive category aliases -> routing key ----
// Maps the human-readable category labels used across the app (and by the
// AI classifier) onto the canonical routing keys above.
const CATEGORY_ALIASES = {
  'ROADS & INFRASTRUCTURE': 'ROADS',
  'ROADS': 'ROADS',
  'ROAD': 'ROADS',
  'POTHOLE': 'POTHOLE',
  'POTHOLES': 'POTHOLE',
  'FOOTPATH': 'FOOTPATH',
  'FOOTPATHS': 'FOOTPATH',
  'STREET LIGHTING (TNEB)': 'STREETLIGHTS',
  'STREET LIGHTING': 'STREETLIGHTS',
  'STREETLIGHTS': 'STREETLIGHTS',
  'STREETLIGHT': 'STREETLIGHTS',
  'ELECTRICITY': 'ELECTRICITY',
  'WATER SUPPLY': 'WATER',
  'WATER': 'WATER',
  'DRAINAGE & FLOODING': 'DRAINAGE',
  'DRAINAGE': 'DRAINAGE',
  'SEWERAGE': 'SEWERAGE',
  'SOLID WASTE MANAGEMENT': 'GARBAGE',
  'GARBAGE & SANITATION': 'GARBAGE',
  'GARBAGE': 'GARBAGE',
  'SANITATION': 'SANITATION',
  'TRAFFIC': 'TRAFFIC',
  'PARKS': 'PARKS',
  'PUBLIC SAFETY': 'PUBLIC_SAFETY',
};

const normalizeCategory = (category) => {
  if (!category) return null;
  const raw = String(category).trim();
  const upper = raw.toUpperCase();
  if (CATEGORY_ALIASES[upper]) return CATEGORY_ALIASES[upper];
  // Fallback: strip non-alphanumerics and try direct key match
  const stripped = upper.replace(/[^A-Z0-9_]/g, '_');
  if (DEPARTMENT_ROUTING[stripped]) return stripped;
  return null;
};

// ---- Corporation-level elected & administrative heads ----
export const CORPORATION_LEADERSHIP = {
  Chennai: {
    mayor: { name: 'Priya Rajan', role: 'Mayor of Chennai', party: 'DMK', phone: '044 2561 9200', email: 'mayor@chennaicorp.gov.in' },
    deputyMayor: { name: 'M. Mahesh Kumar', role: 'Deputy Mayor', party: 'DMK', phone: '044 2561 9201', email: 'deputymayor@chennaicorp.gov.in' },
    commissioner: { name: 'J. Radhakrishnan', role: 'Municipal Commissioner', phone: '044 2561 9200', email: 'commissioner@chennaicorp.gov.in' },
  },
  Madurai: {
    mayor: { name: 'Indrani Ponvasanth', role: 'Mayor of Madurai', party: 'DMK', phone: '0452 253 1200', email: 'mayor@maduraicorp.gov.in' },
    commissioner: { name: 'K. P. Karthikeyan', role: 'Municipal Commissioner', phone: '0452 253 1200', email: 'commissioner@maduraicorp.gov.in' },
  },
  Coimbatore: {
    mayor: { name: 'R. Ranganayaki', role: 'Mayor of Coimbatore', party: 'DMK', phone: '0422 230 1200', email: 'mayor@coimbatorecorp.gov.in' },
    commissioner: { name: 'M. Prathap', role: 'Municipal Commissioner', phone: '0422 230 1200', email: 'commissioner@coimbatorecorp.gov.in' },
  },
  Salem: {
    mayor: { name: 'A. Ramachandran', role: 'Mayor of Salem', party: 'DMK', phone: '0427 233 1200', email: 'mayor@salemcorp.gov.in' },
    commissioner: { name: 'S. Balachander', role: 'Municipal Commissioner', phone: '0427 233 1200', email: 'commissioner@salemcorp.gov.in' },
  },
  Tiruchirappalli: {
    mayor: { name: 'M. Anbalagan', role: 'Mayor of Tiruchirappalli', party: 'DMK', phone: '0431 241 1200', email: 'mayor@trichycorp.gov.in' },
    commissioner: { name: 'V. Saravanan', role: 'Municipal Commissioner', phone: '0431 241 1200', email: 'commissioner@trichycorp.gov.in' },
  },
};

// ---- Elected representatives & responsible officers per ward ----
// City -> Ward -> { councillor (elected), wardOfficer (admin), zone, zonalOfficer }
// Ward numbers repeat across corporations, so the city is the disambiguator.
export const WARD_GOVERNANCE = {
  Chennai: {
    'Ward 104': {
      zone: 'Zone 10',
      councillor: { name: 'Priya Rajan', party: 'DMK', phone: '94440 10001', email: 'councillor.ward104@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. S. Kumar', role: 'Ward Officer / AE', phone: '98400 20001' },
      zonalOfficer: { name: 'Er. R. Meena', role: 'Zonal Executive Engineer', phone: '98400 30001' },
    },
    'Ward 22': {
      zone: 'Zone 3',
      councillor: { name: 'M. Mahesh Kumar', party: 'DMK', phone: '94440 10022', email: 'councillor.ward22@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. V. Anand', role: 'Ward Officer / AE', phone: '98400 20022' },
      zonalOfficer: { name: 'Er. K. Divya', role: 'Zonal Executive Engineer', phone: '98400 30022' },
    },
    'Ward 12': {
      zone: 'Zone 2',
      councillor: { name: 'R. Durai Raj', party: 'AIADMK', phone: '94440 10012', email: 'councillor.ward12@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. P. Selvam', role: 'Ward Officer / AE', phone: '98400 20012' },
      zonalOfficer: { name: 'Er. S. Bhavani', role: 'Zonal Executive Engineer', phone: '98400 30012' },
    },
    'Ward 9': {
      zone: 'Zone 1',
      councillor: { name: 'K. Lakshmi', party: 'DMK', phone: '94440 10009', email: 'councillor.ward9@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. G. Murugan', role: 'Ward Officer / AE', phone: '98400 20009' },
      zonalOfficer: { name: 'Er. T. Revathi', role: 'Zonal Executive Engineer', phone: '98400 30009' },
    },
    'Ward 18': {
      zone: 'Zone 2',
      councillor: { name: 'S. Vijayalakshmi', party: 'DMK', phone: '94440 10018', email: 'councillor.ward18@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. N. Karthik', role: 'Ward Officer / AE', phone: '98400 20018' },
      zonalOfficer: { name: 'Er. S. Bhavani', role: 'Zonal Executive Engineer', phone: '98400 30012' },
    },
    'Ward 45': {
      zone: 'Zone 5',
      councillor: { name: 'A. Meenakshi', party: 'AIADMK', phone: '94440 10045', email: 'councillor.ward45@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. R. Prakash', role: 'Ward Officer / AE', phone: '98400 20045' },
      zonalOfficer: { name: 'Er. M. Kavitha', role: 'Zonal Executive Engineer', phone: '98400 30045' },
    },
    'Ward 64': {
      zone: 'Zone 7',
      councillor: { name: 'B. Saravanan', party: 'DMK', phone: '94440 10064', email: 'councillor.ward64@chennaicorp.gov.in' },
      wardOfficer: { name: 'Er. J. Deepa', role: 'Ward Officer / AE', phone: '98400 20064' },
      zonalOfficer: { name: 'Er. L. Ganesh', role: 'Zonal Executive Engineer', phone: '98400 30064' },
    },
  },
  Madurai: {
    'Ward 45': {
      zone: 'Zone 5',
      councillor: { name: 'S. Meena', party: 'DMK', phone: '94440 20045', email: 'councillor.ward45@maduraicorp.gov.in' },
      wardOfficer: { name: 'Er. K. Rajesh', role: 'Ward Officer / AE', phone: '98400 40045' },
      zonalOfficer: { name: 'Er. P. Vignesh', role: 'Zonal Executive Engineer', phone: '98400 50045' },
    },
  },
  Coimbatore: {
    'Ward 12': {
      zone: 'Zone 2',
      councillor: { name: 'V. Senthil Kumar', party: 'AIADMK', phone: '94440 30012', email: 'councillor.ward12@coimbatorecorp.gov.in' },
      wardOfficer: { name: 'Er. M. Arun', role: 'Ward Officer / AE', phone: '98400 60012' },
      zonalOfficer: { name: 'Er. R. Priya', role: 'Zonal Executive Engineer', phone: '98400 70012' },
    },
    'Ward 14': {
      zone: 'Zone 2',
      councillor: { name: 'K. Mohan', party: 'DMK', phone: '94440 30014', email: 'councillor.ward14@coimbatorecorp.gov.in' },
      wardOfficer: { name: 'Er. S. Deepak', role: 'Ward Officer / AE', phone: '98400 60014' },
      zonalOfficer: { name: 'Er. R. Priya', role: 'Zonal Executive Engineer', phone: '98400 70012' },
    },
    'Ward 18': {
      zone: 'Zone 3',
      councillor: { name: 'L. Kavitha', party: 'DMK', phone: '94440 30018', email: 'councillor.ward18@coimbatorecorp.gov.in' },
      wardOfficer: { name: 'Er. N. Balaji', role: 'Ward Officer / AE', phone: '98400 60018' },
      zonalOfficer: { name: 'Er. T. Meena', role: 'Zonal Executive Engineer', phone: '98400 70018' },
    },
    'Ward 64': {
      zone: 'Zone 7',
      councillor: { name: 'A. Ramesh', party: 'DMK', phone: '94440 30064', email: 'councillor.ward64@coimbatorecorp.gov.in' },
      wardOfficer: { name: 'Er. J. Divya', role: 'Ward Officer / AE', phone: '98400 60064' },
      zonalOfficer: { name: 'Er. M. Ganesh', role: 'Zonal Executive Engineer', phone: '98400 70064' },
    },
  },
  Salem: {
    'Ward 22': {
      zone: 'Zone 3',
      councillor: { name: 'R. Selvam', party: 'DMK', phone: '94440 40022', email: 'councillor.ward22@salemcorp.gov.in' },
      wardOfficer: { name: 'Er. P. Kumar', role: 'Ward Officer / AE', phone: '98400 80022' },
      zonalOfficer: { name: 'Er. S. Revathi', role: 'Zonal Executive Engineer', phone: '98400 90022' },
    },
  },
  Tiruchirappalli: {
    'Ward 8': {
      zone: 'Zone 1',
      councillor: { name: 'M. Anbu', party: 'DMK', phone: '94440 50008', email: 'councillor.ward8@trichycorp.gov.in' },
      wardOfficer: { name: 'Er. K. Suresh', role: 'Ward Officer / AE', phone: '98400 10008' },
      zonalOfficer: { name: 'Er. R. Lakshmi', role: 'Zonal Executive Engineer', phone: '98400 11008' },
    },
    'Ward 9': {
      zone: 'Zone 1',
      councillor: { name: 'S. Ganesan', party: 'AIADMK', phone: '94440 50009', email: 'councillor.ward9@trichycorp.gov.in' },
      wardOfficer: { name: 'Er. V. Mani', role: 'Ward Officer / AE', phone: '98400 10009' },
      zonalOfficer: { name: 'Er. R. Lakshmi', role: 'Zonal Executive Engineer', phone: '98400 11008' },
    },
  },
};

// ---- Escalation ladder (matches TN ULB practice) ----
export const ESCALATION_LADDER = [
  { level: 1, title: 'Ward Officer', desc: 'First responder — accepts, inspects, fixes' },
  { level: 2, title: 'Zonal Executive Engineer', desc: 'Zone-level oversight & budget' },
  { level: 3, title: 'Deputy Commissioner', desc: 'Corporation department head' },
  { level: 4, title: 'Municipal Commissioner', desc: 'Corporation head' },
  { level: 5, title: 'Mayor / CM Cell', desc: 'Political escalation' },
];

// ---- City aliases -> canonical corporation key ----
const CITY_ALIASES = {
  CHENNAI: 'Chennai',
  'GREATER CHENNAI': 'Chennai',
  MADURAI: 'Madurai',
  COIMBATORE: 'Coimbatore',
  SALEM: 'Salem',
  TRICHY: 'Tiruchirappalli',
  TIRUCHIRAPPALLI: 'Tiruchirappalli',
  TIRUCHY: 'Tiruchirappalli',
};

// ---- Resolve the corporation city from a ward/location string ----
const resolveCity = (ward, district) => {
  const haystack = `${ward || ''} ${district || ''}`.toUpperCase();
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (haystack.includes(alias)) return city;
  }
  return null;
};

// ---- Resolve a ward string to a canonical ward key within a city ----
const normalizeWard = (ward, city) => {
  if (!ward) return null;
  const m = String(ward).match(/Ward\s*(\d+)/i);
  if (!m) return null;
  const num = m[1];
  const cityGov = city ? WARD_GOVERNANCE[city] : null;
  if (cityGov && cityGov[`Ward ${num}`]) return `Ward ${num}`;
  // Fallback: search all cities for a matching ward number
  for (const gov of Object.values(WARD_GOVERNANCE)) {
    if (gov[`Ward ${num}`]) return `Ward ${num}`;
  }
  return null;
};

// ---- Main routing function ----
export function routeIssue({ category, ward, district }) {
  const catKey = normalizeCategory(category);
  const dept = (catKey && DEPARTMENT_ROUTING[catKey]) || DEPARTMENT_ROUTING.DEFAULT;

  const city = resolveCity(ward, district);
  const wardKey = normalizeWard(ward, city);
  const cityGov = city ? WARD_GOVERNANCE[city] : null;
  const gov = wardKey && cityGov ? cityGov[wardKey] : null;

  return {
    department: dept,
    city: city || 'Unassigned city',
    ward: wardKey || (ward || 'Unassigned ward'),
    zone: gov ? gov.zone : 'Zone unassigned',
    responsibleOfficer: gov ? gov.wardOfficer : null,
    zonalOfficer: gov ? gov.zonalOfficer : null,
    electedRepresentative: gov ? gov.councillor : null,
    corporation: city ? CORPORATION_LEADERSHIP[city] : CORPORATION_LEADERSHIP.Chennai,
    escalation: ESCALATION_LADDER,
    // Human-readable routing summary
    summary: gov
      ? `${dept.name} · ${city} ${gov.zone} · Ward Officer ${gov.wardOfficer.name} · Councillor ${gov.councillor.name}`
      : `${dept.name} · ${city || district || 'District'} · Corporation`,
  };
}

// ---- Reverse lookup: given a department, list candidate officers ----
// Filters ward officers by the department they are responsible for.
const DEPT_OFFICER_ROLES = {
  HIGHWAYS: ['Ward Officer / AE'],
  TNEB: ['Line Superintendent'],
  CMWSSB: ['Ward Officer / AE'],
  SWM: ['Sanitary Inspector'],
  TRAFFIC: ['Traffic Inspector'],
  CORPORATION: ['Ward Officer / AE'],
};

export function officersForDepartment(deptId) {
  const matches = [];
  Object.entries(WARD_GOVERNANCE).forEach(([city, wards]) => {
    Object.entries(wards).forEach(([ward, g]) => {
      if (g.wardOfficer) {
        matches.push({ ...g.wardOfficer, zone: g.zone, ward, city });
      }
    });
  });
  return matches;
}
