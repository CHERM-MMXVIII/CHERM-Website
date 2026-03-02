const Parser = require('rss-parser');
const { Pool } = require('pg');

const RSS_URL = 'https://rss.app/feeds/prVwaD4E2lxxoong.xml';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cherm_website',
  password: 'PgPass123!',
  port: 5433,
});

const parser = new Parser();

async function importRSS() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    for (let item of feed.items) {

      const fb_post_id = item.id || item.link;
      const title = item.title || 'Facebook Post';
      const image_url = item.enclosure ? item.enclosure.url : '';
      const post_date = item.pubDate;

      await pool.query(
        `INSERT INTO articles (fb_post_id, title, image_url, post_date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (fb_post_id) DO NOTHING`,
        [fb_post_id, title, image_url, post_date]
      );
    }

    console.log("✅ Facebook posts imported into PostgreSQL!");
    process.exit();

  } catch (err) {
    console.error("RSS Import Error:", err);
  }
}

importRSS();
