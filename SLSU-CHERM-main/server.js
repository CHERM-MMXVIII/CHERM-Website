const express = require ('express');
const {Pool} = require('pg');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cherm_website',
    password: 'CHERM2026',
    port: 5432,
});

app.get('/index.html', async (req, res) => {
    try{
        const result = await pool.query(
            'SELECT title, venue, image_url, event_date FROM articles ORDER BY event_date DESC'
        );

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Articles</title>
        </head>
        <body>
            <h2>Latest Articles</h2>
        `;

        result.rows.forEach(article => {
            html += `
                <div style="border:1px solid #ccc; padding:10px; margin:10px;">
                <img src="${article.image_url}" width="200"><br>
                <strong>${article.title}</strong><br>
                Venue: ${article.venue}<br>
                Date: ${article.event_date}
                </div>
            `;
        });

        html += `
            </body>
            </html>
        `;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.send("Daabase error")
    }
});

app.listen(PORT, () => {
  console.log(`Website running at http://localhost:${PORT}`);
});