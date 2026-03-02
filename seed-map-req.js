/**
 * seed-map-requests.js
 * ---------------------
 * Inserts randomised dummy map requests into PostgreSQL.
 * Uses the same request code format as the server: YYYYMMDD-CHERM-XXXXXX
 *
 * Usage:
 *   node seed-map-requests.js            → inserts 50 records (default)
 *   node seed-map-requests.js 100        → inserts 100 records
 */

require('dotenv').config();
const { Pool } = require('pg');

// ───────────────────────────────────────────────
// DB CONNECTION — reads from your existing .env
// ───────────────────────────────────────────────

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// ───────────────────────────────────────────────
// SEED DATA POOLS
// ───────────────────────────────────────────────

const FIRST_NAMES = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Carlo', 'Liza', 'Mark', 'Rosa',
    'Miguel', 'Elena', 'Ramon', 'Clara', 'Dante', 'Nena', 'Felix',
    'Gloria', 'Andres', 'Cristina', 'Benito', 'Marilou', 'Rodel',
    'Sheila', 'Ariel', 'Jocelyn', 'Renato', 'Evelyn', 'Danilo', 'Teresita',
];

const SURNAMES = [
    'Dela Cruz', 'Reyes', 'Santos', 'Garcia', 'Torres', 'Flores',
    'Mendoza', 'Bautista', 'Villanueva', 'Aquino', 'Ramos', 'Castillo',
    'Diaz', 'Cruz', 'Gonzales', 'Hernandez', 'Lim', 'Tan', 'Sy',
    'Ocampo', 'Manalo', 'Pascual', 'Navarro', 'Valdez', 'Salazar',
];

const INTERNAL_AFFILIATIONS = [
    'College of Engineering', 'College of Education', 'College of Agriculture',
    'College of Arts and Sciences', 'College of Nursing', 'College of Business',
    'College of Forestry', 'Graduate School', 'CHERM',
    'Office of Research Services', 'Office of the University President',
    'College of Information Technology', 'College of Criminal Justice',
    'College of Architecture',
];

const EXTERNAL_AFFILIATIONS = [
    'LGU Lucena City', 'LGU Tayabas', 'LGU Gumaca', 'LGU Sariaya',
    'DENR Region IV-A', 'DOST Quezon', 'PHIVOLCS', 'MGB Region IV-A',
    'Quezon Provincial Government', 'NDRRMC', 'DA Region IV-A',
    'Bureau of Fisheries and Aquatic Resources', 'DPWH Quezon',
    'DILG Quezon', 'PNP Quezon', 'NIA Quezon', 'PAG-ASA',
    'Municipal Government of Atimonan', 'Municipal Government of Infanta',
    'Municipal Government of Mauban', 'Philippine Red Cross Quezon',
];

const EXTERNAL_EMAIL_DOMAINS = [
    'lgu.gov.ph', 'denr.gov.ph', 'dost.gov.ph', 'ndrrmc.gov.ph',
    'da.gov.ph', 'dpwh.gov.ph', 'gmail.com', 'yahoo.com',
    'outlook.com', 'bfar.da.gov.ph', 'dilg.gov.ph',
];

const STANDARD_MAP_TYPES = ['Topographic', 'Hazard', 'Land-use', 'Thematic'];

const CUSTOM_MAP_TYPES = [
    'Flood Susceptibility Map', 'Soil Classification Map',
    'Vegetation Cover Map', 'Watershed Boundary Map',
    'Coastal Resource Map', 'Infrastructure Map',
    'Population Density Map', 'Erosion Susceptibility Map',
];

const MAP_SIZES = [
    'A4', 'A3', 'A2', 'A1', 'A0',
    '8x11 inches', '11x17 inches', '18x24 inches', '24x36 inches',
];

const PURPOSES = [
    'Research and development', 'Disaster risk reduction planning',
    'Land use planning', 'Environmental impact assessment',
    'Thesis or dissertation', 'Infrastructure development',
    'Community mapping', 'Academic presentation',
    'Local government planning', 'Natural resource management',
    'Feasibility study', 'Climate change adaptation',
    'Flood mitigation study', 'Reforestation project planning',
];

const AREAS_OF_INTEREST = [
    'Lucena City, Quezon', 'Tayabas City, Quezon', 'Gumaca, Quezon',
    'Sariaya, Quezon', 'Pagbilao, Quezon', 'Atimonan, Quezon',
    'Infanta, Quezon', 'Real, Quezon', 'Mauban, Quezon',
    'Pitogo, Quezon', 'Plaridel, Quezon', 'San Narciso, Quezon',
    'Lopez, Quezon', 'Macalelon, Quezon', 'Alabat Island, Quezon',
    'Entire Province of Quezon', 'CALABARZON Region',
    'Bondoc Peninsula, Quezon', 'Sierra Madre, Quezon',
    'Polillo Island Group, Quezon', 'Calauag, Quezon',
];

const STATUSES       = ['Pending', 'In-progress', 'Completed', 'Rejected', 'Terminated'];
const STATUS_WEIGHTS = [45, 25, 18, 7, 5];

// ───────────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────────

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function pickWeighted(arr, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Mirrors the server's generateRequestId() exactly:
 * Format: YYYYMMDD-CHERM-XXXXXX  (e.g. 20260226-CHERM-FD2897)
 */
function generateRequestId() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const hex   = Array.from({ length: 6 }, () =>
        '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
    ).join('');
    return `${year}${month}${day}-CHERM-${hex}`;
}

/** Random past timestamp within the last N days */
function pastDate(maxDaysAgo = 180) {
    const d = new Date();
    d.setDate(d.getDate() - randInt(1, maxDaysAgo));
    d.setHours(randInt(7, 18), randInt(0, 59), randInt(0, 59));
    return d.toISOString();
}

/** Random future date between 7 and 90 days from now */
function futureDate() {
    const d = new Date();
    d.setDate(d.getDate() + randInt(7, 90));
    return d.toISOString().slice(0, 10);
}

function buildEmail(firstName, surname, clientType, externalDomain) {
    const clean = str => str.toLowerCase().replace(/[\s.'-]/g, '').replace(/[^a-z0-9]/g, '');
    const base  = `${clean(firstName)}.${clean(surname)}`;
    return clientType === 'internal' ? `${base}@slsu.edu.ph` : `${base}@${externalDomain}`;
}

// ───────────────────────────────────────────────
// RECORD GENERATOR
// ───────────────────────────────────────────────

function generateRecord() {
    const clientType  = Math.random() < 0.55 ? 'internal' : 'external';
    const firstName   = pick(FIRST_NAMES);
    const surname     = pick(SURNAMES);
    const affiliation = clientType === 'internal'
        ? pick(INTERNAL_AFFILIATIONS)
        : pick(EXTERNAL_AFFILIATIONS);

    const email       = buildEmail(firstName, surname, clientType, pick(EXTERNAL_EMAIL_DOMAINS));
    const mapType     = Math.random() < 0.70 ? pick(STANDARD_MAP_TYPES) : pick(CUSTOM_MAP_TYPES);
    const status      = pickWeighted(STATUSES, STATUS_WEIGHTS);
    const requestCode = generateRequestId();

    const offCode = affiliation.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const ini     = `${firstName.charAt(0)}${surname.replace(/\s/g, '').charAt(0)}`.toUpperCase();

    return {
        request_code:       requestCode,
        client_type:        clientType,
        email,
        first_name:         firstName,
        surname,
        affiliation,
        date_needed:        futureDate(),
        map_type:           mapType,
        purpose:            pick(PURPOSES),
        area_of_interest:   pick(AREAS_OF_INTEREST),
        map_size:           pick(MAP_SIZES),
        quantity:           randInt(1, 10),
        status,
        request_letter_url: `https://storage.example.com/letters/GISMR_${offCode}_${ini}.pdf`,
        signature_url:      `https://storage.example.com/signatures/${surname.replace(/\s+/g, '')}_Esign.pdf`,
        initial_data_url:   Math.random() < 0.40
            ? `https://storage.example.com/initial-data/${requestCode}.pdf`
            : null,
        map_file_url:       status === 'Completed'
            ? `https://storage.example.com/maps/${requestCode}_map.png`
            : null,
        created_at:         pastDate(180),
    };
}

// ───────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────

async function seed(count = 50) {
    const client = await pool.connect();

    try {
        console.log(`\n🌱  Seeding ${count} dummy map requests...\n`);

        const records = Array.from({ length: count }, generateRecord);

        // Single batch INSERT using unnest — fast even for thousands of rows
        await client.query(`
            INSERT INTO map_requests (
                request_code, client_type, email, first_name, surname,
                affiliation, date_needed, map_type, purpose, area_of_interest,
                map_size, quantity, status,
                request_letter_url, signature_url, initial_data_url, map_file_url,
                created_at
            )
            SELECT * FROM unnest(
                $1::text[],  $2::text[],  $3::text[],  $4::text[],  $5::text[],
                $6::text[],  $7::date[],  $8::text[],  $9::text[],  $10::text[],
                $11::text[], $12::int[],  $13::text[], $14::text[], $15::text[],
                $16::text[], $17::text[], $18::timestamptz[]
            )
        `, [
            records.map(r => r.request_code),
            records.map(r => r.client_type),
            records.map(r => r.email),
            records.map(r => r.first_name),
            records.map(r => r.surname),
            records.map(r => r.affiliation),
            records.map(r => r.date_needed),
            records.map(r => r.map_type),
            records.map(r => r.purpose),
            records.map(r => r.area_of_interest),
            records.map(r => r.map_size),
            records.map(r => r.quantity),
            records.map(r => r.status),
            records.map(r => r.request_letter_url),
            records.map(r => r.signature_url),
            records.map(r => r.initial_data_url),
            records.map(r => r.map_file_url),
            records.map(r => r.created_at),
        ]);

        // ── Summary ──
        const byStatus     = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
        const internal     = records.filter(r => r.client_type === 'internal').length;
        const withInitData = records.filter(r => r.initial_data_url).length;

        console.log('✅  Done!\n');
        console.log(`   Total inserted : ${count}`);
        console.log(`   Internal       : ${internal}`);
        console.log(`   External       : ${count - internal}`);
        console.log(`   With init data : ${withInitData}`);
        console.log('   By status:');
        STATUSES.forEach(s => {
            if (byStatus[s]) console.log(`     ${s.padEnd(14)}: ${byStatus[s]}`);
        });
        console.log('');

    } catch (err) {
        console.error('❌  Seed failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

const count = parseInt(process.argv[2]) || 50;
seed(count);