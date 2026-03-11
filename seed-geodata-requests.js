/**
 * seed-geodata-requests.js
 * --------------------------------
 * Inserts randomised dummy geospatial data requests
 * matching the CHERM Geospatial Data Request form.
 *
 * Usage:
 * node seed-geodata-requests.js
 * node seed-geodata-requests.js 100
 */

require('dotenv').config();
const { Pool } = require('pg');

// ───────────────────────────────────────────────
// DB CONNECTION
// ───────────────────────────────────────────────

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// ───────────────────────────────────────────────
// DATA POOLS
// ───────────────────────────────────────────────

const FIRST_NAMES = [
'Juan','Maria','Jose','Ana','Carlo','Liza','Mark','Rosa','Miguel',
'Elena','Ramon','Clara','Dante','Felix','Gloria','Andres','Cristina',
'Benito','Marilou','Rodel','Sheila','Ariel','Jocelyn','Renato','Evelyn'
];

const SURNAMES = [
'Dela Cruz','Reyes','Santos','Garcia','Torres','Flores','Mendoza',
'Bautista','Villanueva','Aquino','Ramos','Castillo','Diaz','Gonzales',
'Hernandez','Lim','Tan','Sy','Ocampo','Manalo','Pascual','Navarro'
];

const INTERNAL_AFFILIATIONS = [
'College of Engineering',
'College of Agriculture',
'College of Forestry',
'College of Arts and Sciences',
'College of Information Technology',
'College of Education',
'Graduate School',
'Office of Research Services',
'CHERM'
];

const EXTERNAL_AFFILIATIONS = [
'LGU Lucena City',
'LGU Tayabas',
'LGU Sariaya',
'DENR Region IV-A',
'DPWH Quezon',
'DOST IV-A',
'PHIVOLCS',
'PAGASA',
'Municipal Government of Infanta',
'Municipal Government of Mauban',
'Municipal Government of Atimonan',
'Philippine Red Cross Quezon'
];

const EXTERNAL_DOMAINS = [
'lgu.gov.ph',
'denr.gov.ph',
'gov.ph',
'gmail.com',
'yahoo.com',
'outlook.com',
'phivolcs.dost.gov.ph'
];

// datasets from catalogue
const DATASETS = [
'Flood Hazard Map',
'Landslide Hazard Map',
'Storm Surge Hazard Map',
'Digital Elevation Model',
'Slope Map',
'Land Use Map',
'Administrative Boundaries',
'Road Network',
'Bridge Locations',
'Population Density',
'Soil Map',
'Forest Cover',
'Protected Areas',
'Watershed Boundaries',
'Evacuation Centers',
'Rainfall Distribution',
'Infrastructure Map',
'Coastal Resource Map'
];

const PURPOSES = [
'Research',
'Planning',
'Disaster Risk Reduction',
'Academic / Thesis',
'Policy / Governance',
'Other'
];

const NOTES = [
'Data will be used for spatial analysis.',
'Required for thesis GIS modelling.',
'Needed for municipal planning.',
'Used for flood risk assessment.',
'Dataset required for environmental research.',
'Used for hazard mapping study.',
'Requested for academic presentation.',
'Needed for community mapping.',
'Required for infrastructure planning.',
'For disaster preparedness planning.'
];

// ───────────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────────

const pick = arr => arr[Math.floor(Math.random()*arr.length)];

const randInt = (min,max) =>
Math.floor(Math.random()*(max-min+1))+min;

function pickDatasets(){

const count = randInt(1,4);

const shuffled = [...DATASETS].sort(()=>0.5-Math.random());

return shuffled.slice(0,count);

}

function generateRequestId(){

const now = new Date();

const y = now.getFullYear();

const m = String(now.getMonth()+1).padStart(2,'0');

const d = String(now.getDate()).padStart(2,'0');

const hex = Array.from({length:6},()=>
'0123456789ABCDEF'[Math.floor(Math.random()*16)]
).join('');

return `${y}${m}${d}-CHERM-${hex}`;

}

function pastDate(maxDays=120){

const d = new Date();

d.setDate(d.getDate()-randInt(1,maxDays));

d.setHours(randInt(8,17),randInt(0,59));

return d.toISOString();

}

function buildEmail(first,surname,type){

const clean = s => s.toLowerCase().replace(/\s/g,'');

if(type==='internal')
return `${clean(first)}.${clean(surname)}@slsu.edu.ph`;

return `${clean(first)}.${clean(surname)}@${pick(EXTERNAL_DOMAINS)}`;

}

// ───────────────────────────────────────────────
// RECORD GENERATOR
// ───────────────────────────────────────────────

function generateRecord(){

const clientType = Math.random()<0.55 ? 'internal' : 'external';

const first = pick(FIRST_NAMES);

const surname = pick(SURNAMES);

const affiliation = clientType==='internal'
? pick(INTERNAL_AFFILIATIONS)
: pick(EXTERNAL_AFFILIATIONS);

const datasets = pickDatasets();

const purpose = pick(PURPOSES);

return {

request_code: generateRequestId(),

client_type: clientType,

email: buildEmail(first,surname,clientType),

first_name: first,

surname,

affiliation,

datasets,

purpose,

other_purpose: purpose==='Other'
? 'Special geospatial analysis'
: null,

notes: pick(NOTES),

created_at: pastDate()

};

}

// ───────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────

async function seed(count=50){

const client = await pool.connect();

try{

console.log(`🌱 Seeding ${count} geodata requests...`);

const records = Array.from({length:count},generateRecord);

await client.query(`

INSERT INTO geodata_requests (

request_code,
client_type,
email,
first_name,
surname,
affiliation,
datasets,
purpose,
other_purpose,
notes,
created_at

)

SELECT * FROM unnest(

$1::text[],
$2::text[],
$3::text[],
$4::text[],
$5::text[],
$6::text[],
$7::text[][],
$8::text[],
$9::text[],
$10::text[],
$11::timestamptz[]

)

`,[

records.map(r=>r.request_code),
records.map(r=>r.client_type),
records.map(r=>r.email),
records.map(r=>r.first_name),
records.map(r=>r.surname),
records.map(r=>r.affiliation),
records.map(r=>r.datasets),
records.map(r=>r.purpose),
records.map(r=>r.other_purpose),
records.map(r=>r.notes),
records.map(r=>r.created_at)

]);

console.log("✅ Done seeding.");

}catch(err){

console.error("Seed failed:",err);

}finally{

client.release();

await pool.end();

}

}

const count = parseInt(process.argv[2]) || 50;

seed(count);