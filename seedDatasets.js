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

async function seedDatasets() {
  try {

    const datasets = [
      {
        title: "Flood Hazard Map",
        data_desc: "Flood hazard zones derived from LiDAR elevation and rainfall modeling.",
        cat: "hazard",
        format: "SHP",
        coverage: "Quezon Province",
        scale: "1:10,000",
        crs: "PRS92 / Philippine Zone V",
        year: 2023,
        size: "24 MB"
      },
      {
        title: "Storm Surge Hazard Map",
        data_desc: "Storm surge inundation zones along the Infanta coastline.",
        cat: "hazard",
        format: "TIFF",
        coverage: "Infanta, Quezon",
        scale: "1:5,000",
        crs: "WGS84",
        year: 2022,
        size: "46 MB"
      },
      {
        title: "Land Use Map",
        data_desc: "Urban and agricultural land classification.",
        cat: "landuse",
        format: "GPKG",
        coverage: "Lucena City",
        scale: "1:10,000",
        crs: "PRS92",
        year: 2024,
        size: "9 MB"
      },
      {
        title: "Administrative Boundaries",
        data_desc: "Province and municipal boundaries.",
        cat: "boundary",
        format: "SHP",
        coverage: "Quezon Province",
        scale: "1:50,000",
        crs: "PRS92",
        year: 2021,
        size: "3.4 MB"
      },
      {
        title: "Road Network Dataset",
        data_desc: "Primary and secondary roads.",
        cat: "infra",
        format: "GPKG",
        coverage: "Southern Luzon",
        scale: "1:25,000",
        crs: "WGS84",
        year: 2023,
        size: "15 MB"
      }
    ];

    for (const d of datasets) {
      await pool.query(
        `INSERT INTO datasets
        (title, data_desc, cat, format, coverage, scale, crs, year, size, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [
          d.title,
          d.data_desc,
          d.cat,
          d.format,
          d.coverage,
          d.scale,
          d.crs,
          d.year,
          d.size
        ]
      );
    }

    console.log("Datasets seeded successfully");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDatasets();