require('dotenv').config();

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const logActivity = require('./utils/activityLogger');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

/* ---------- DATABASE CONFIG ---------- */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ---------- ENSURE UPLOADS DIR EXISTS ---------- */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const bannersDir = path.join(uploadsDir, 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir);
}

const trainingRequestDir = path.join(uploadsDir, 'training-requests');
if (!fs.existsSync(trainingRequestDir)) {
  fs.mkdirSync(trainingRequestDir);
}

const manuscriptRequestDir = path.join(uploadsDir, 'manuscript-requests');
if (!fs.existsSync(manuscriptRequestDir)) {
  fs.mkdirSync(manuscriptRequestDir);
}

const dataRequestDir = path.join(uploadsDir, 'data-requests');
if (!fs.existsSync(dataRequestDir)) {
  fs.mkdirSync(dataRequestDir);
}

const datasetFilesDir = path.join(uploadsDir, 'dataset-files');
if (!fs.existsSync(datasetFilesDir)) {
  fs.mkdirSync(datasetFilesDir);
}

/* ---------- MIDDLEWARE ---------- */
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


/* ---------- MULTER CONFIG ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  }
})

/* ---------- BANNER UPLOAD ---------- */
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bannersDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = 'banner-' + Date.now() + ext;
    cb(null, uniqueName);
  }
});

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 500* 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/');

    if (!allowed) {
      return cb(new Error('Only image or video files allowed'));
    }
    cb(null, true);
  }
});

const trainingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, trainingRequestDir),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

const manuscriptUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, manuscriptRequestDir),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF, DOC, or DOCX files are allowed'));
    }
    cb(null, true);
  }
});

const dataRequestUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, dataRequestDir),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',   // .shp, .dbf, .prj, .shx, .gpkg, etc.
      'application/geo+json',
      'application/json',
      'text/csv',
      'text/plain',
      'image/tiff',
      'image/geotiff',
      'application/vnd.google-earth.kml+xml',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      '.pdf', '.zip', '.shp', '.dbf', '.shx', '.prj',
      '.tif', '.tiff', '.geojson', '.json', '.csv',
      '.kml', '.gpkg',
    ];
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

const datasetFileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, datasetFilesDir),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => cb(null, true),
});

/* ---------- ADMIN MAPS DIR ---------- */
const adminMapsDir = path.join(uploadsDir, 'admin-maps');

if (!fs.existsSync(adminMapsDir)) {
  fs.mkdirSync(adminMapsDir);
}

/* ---------- MAP REQUEST PDF UPLOAD ---------- */
const mapRequestDir = path.join(uploadsDir, 'map-requests');
if (!fs.existsSync(mapRequestDir)) {
  fs.mkdirSync(mapRequestDir);
}

const mapRequestStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, mapRequestDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const mapRequestUpload = multer({
  storage: mapRequestStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

function generateRequestId() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;

  // 3 random bytes = 6 hex characters
  const hexPart = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `${datePart}-CHERM-${hexPart}`;
}

function generateTrainingRequestId() {
  const now = new Date();

  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const hexPart = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `${datePart}-CHERM-TR-${hexPart}`;
}

function generateManuscriptRequestId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const hexPart = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${datePart}-CHERM-MR-${hexPart}`;
}

function generateDataRequestId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const hexPart  = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${datePart}-CHERM-DR-${hexPart}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024)              return bytes + ' B';
  if (bytes < 1024 * 1024)       return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ---------- FACEBOOK POST ID EXTRACTOR ---------- */
function extractFbPostId(url) {
  if (!url) return null;

  let match = url.match(/\/posts\/([^\/\?]+)/);
  if (match) return match[1];

  match = url.match(/story_fbid=([^&]+)/);
  if (match) return match[1];

  match = url.match(/(pfbid[^\/\?]+)/);
  if (match) return match[1];

  match = url.match(/\/share\/p\/([^\/\?]+)/);
  if (match) return match[1];

  return null;
}

/* ---------- FRONTEND ROUTES ---------- */

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/main-admin');
  }
  res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'signup.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'events.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'admin.html'));
});

app.get('/admin/events', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'events-crud.html'));
});

app.get('/admin/banner', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, 'html', 'new-banner.html');
  res.sendFile(filePath);
});

app.get('/admin/manage-banners', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-banners.html'));
});

app.get('/main-admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'main-admin.html'));
});

// GET LOGGED-IN USER INFO
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    email: req.session.user.email,
    firstName: req.session.user.first_name,
    lastName: req.session.user.last_name
  });
});

app.get('/api/activity/recent', requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT
      action_type,
      entity_type,
      entity_name,
      message,
      created_at
    FROM activity_logs
    ORDER BY created_at DESC
    LIMIT 5
  `);

  res.json({ activities: result.rows });
});

// Serve the manage-map-request.html page (admin-only)
app.get('/admin/map-requests', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-map-request.html'));
});

app.get('/admin/training-requests', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-training-req.html'));
});

app.get('/admin/manuscript-requests', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-manuscript-req.html'));
});

app.get('/admin/data-requests', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-data-req.html'));
});

app.get('/admin/datasets', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'manage-datasets.html'));
});

// LOGIN SETUP 
app.post('/login', async (req, res) => {
  try {
    let { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    email = email.toLowerCase().trim();


    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name

    };

    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    } else {
      req.session.cookie.expires = false; // session-only
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// SIGNUP
app.post('/signup', async (req, res) => {
  console.log('SIGNUP BODY:', req.body);
  try {
    const {
      first_name,
      last_name,
      birthday,
      position,
      university_code,
      email,
      password
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }


    if (!email.endsWith('@slsu.edu.ph')) {
      return res.status(400).json({
        message: 'Only official SLSU email addresses are allowed'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users
      (first_name, last_name, birthday, position, university_code, email, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        first_name,
        last_name,
        birthday,
        position,
        university_code,
        email,
        hashedPassword
      ]
    );

    res.status(201).json({ message: 'Account created successfully' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    await transporter.sendMail({
      from: `"CHERM System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // CHERM email dapat
      subject: 'Forgot Password Request',
      html: `
        <h3>Forgot Password Request</h3>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p>This user requested assistance to reset their password.</p>
      `
    });

    res.json({ message: 'Request sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send request' });
  }
});


//Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

/* ---------- ADMIN ADD EVENT ---------- */
app.post('/admin/add', upload.single('image_file'), async (req, res) => {
  try {
    const { title, post_date, venue, content, fb_link } = req.body;

    let final_title = title?.trim() || null;
    let final_content = content?.trim() || null;
    let final_venue = venue?.trim() || null;
    let final_fb_link = fb_link?.trim() || null;
    let final_post_date = post_date ? new Date(post_date) : null;
    let image_url = null;

    if (req.file) {
      image_url = '/uploads/' + req.file.filename;
    }

    /* ---------- FACEBOOK AUTO-FILL ---------- */
    if (final_fb_link) {
      const postId = extractFbPostId(final_fb_link);
      if (!postId) return res.send('❌ Invalid Facebook post URL.');

      const parser = new Parser();
      const feed = await parser.parseURL(
        'https://rss.app/feeds/fe90KLPC6zF9aBIM.xml'
      );

      const matchedItem = feed.items.find(
        item => extractFbPostId(item.link) === postId
      );

      if (!matchedItem) return res.send('Facebook post not found.');

      if (!final_title) final_title = matchedItem.title;
      if (!final_post_date && matchedItem.pubDate) {
        final_post_date = new Date(matchedItem.pubDate);
      }

      if (!image_url) {
        if (matchedItem['media:content']?.url) {
          image_url = matchedItem['media:content'].url;
        } else {
          const match = matchedItem.content?.match(/<img[^>]+src="([^">]+)"/);
          if (match) image_url = match[1];
        }
      }

      if (!final_content) {
        final_content =
          matchedItem.contentSnippet ||
          matchedItem.content?.replace(/<[^>]+>/g, '').trim() ||
          null;
      }

      final_fb_link = matchedItem.link;
    }

    if (!final_title || !final_content || !final_venue || !final_post_date || !image_url) {
      return res.redirect('/admin?error=incomplete');
    }

    await pool.query(
      `
      INSERT INTO articles
      (fb_post_id, title, venue, content, image_url, post_date, fb_link, published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
      `,
      [
        final_fb_link ? extractFbPostId(final_fb_link) : null,
        final_title,
        final_venue,
        final_content,
        image_url,
        final_post_date,
        final_fb_link
      ]
    );

    await logActivity(
      req,
      pool,
      'create',
      'event',
      final_title,
      `"${final_title}" has been published`
    );

    res.redirect('/admin?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Insert failed');
  }
});

/* ---------- EVENTS API ---------- */
app.get('/api/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    if (isNaN(page) || isNaN(limit)) {
      const result = await pool.query(
        `SELECT * FROM articles WHERE published = TRUE ORDER BY post_date DESC`
      );
      return res.json({ rows: result.rows });  
    }

    const offset = (page - 1) * limit;
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM articles WHERE published = TRUE`
    );
    const total = parseInt(totalResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT * FROM articles WHERE published = TRUE ORDER BY post_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      rows: result.rows,
      page,
      totalPages
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* ---------- DELETE EVENT ---------- */
// Protect DELETE route
app.delete('/admin/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `SELECT title, image_url FROM articles WHERE id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { title, image_url } = eventResult.rows[0];

    // Delete image file if it exists and is uploaded locally
    if (image_url && image_url.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, image_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    // Delete event from DB
    await pool.query(`DELETE FROM articles WHERE id = $1`, [id]);

    // Log the deletion
    await logActivity(
      req,
      pool,
      'delete',
      'event',
      title,
      `"${title}" has been deleted`
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});


/* ---------- UPDATE EVENT (LOCK FB LINK + FB IMAGE) ---------- */
app.put('/admin/events/:id', upload.single('image_file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { venue, content, post_date, remove_image } = req.body;

    const current = await pool.query(
      `SELECT title, post_date, image_url FROM articles WHERE id = $1`,
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      title: currentTitle,
      post_date: currentDate,
      image_url: currentImageUrl
    } = current.rows[0];

    const isFbImage =
      currentImageUrl && !currentImageUrl.startsWith('/uploads/');

    let image_url = currentImageUrl;

    if (req.file && !isFbImage) {
      image_url = '/uploads/' + req.file.filename;

      if (currentImageUrl?.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, currentImageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    if (remove_image === 'true' && !isFbImage) {
      if (currentImageUrl?.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, currentImageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = null;
    }

    await pool.query(
      `
      UPDATE articles
      SET title = $1,
          venue = $2,
          content = $3,
          post_date = $4,
          image_url = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      `,
      [
        currentTitle,                
        venue?.trim(),
        content?.trim(),
        post_date || currentDate,     
        image_url,
        id
      ]
    );

    await logActivity(
      req,
      pool,
      'update',
      'event',
      currentTitle,
      `"${currentTitle}" has been updated`
    );


    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

/* ---------- UPLOAD BANNER ---------- */
app.post('/api/banners/upload', bannerUpload.single('banner'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        url: `/uploads/banners/${req.file.filename}`,
        type: req.file.mimetype
    });
});


/* ---------- (REPLACE OLD BANNER) ---------- */
app.post('/api/banners/publish', async (req, res) => {
    const { fileUrl, fileType } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Deactivate current banner
        await client.query(`
            UPDATE banners
            SET is_active = false
            WHERE is_active = true
        `);

        // 2. Insert new banner as active
        await client.query(`
            INSERT INTO banners (file_url, file_type, is_active)
            VALUES ($1, $2, true)
        `, [fileUrl, fileType]);

        await client.query('COMMIT');

        await logActivity(req, pool, 'create', 'banner', fileUrl, `Banner "${fileUrl}" has been added`);

        res.json({ success: true });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to publish banner' });
    } finally {
        client.release();
    }
});

/* ---------- GET ACTIVE BANNER ---------- */
app.get('/api/banners/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT file_url, file_type
      FROM banners
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ banner: null });
    }

    res.json({ banner: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active banner' });
  }
});

app.post('/api/banners/:id/activate', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`UPDATE banners SET is_active = false`);
    await client.query(
      `UPDATE banners SET is_active = true WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    
    await logActivity(req, pool, 'update', 'banner', id, `Banner ID ${id} has been updated`);

    res.json({ success: true });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Activation failed' });
  } finally {
    client.release();
  }
});

/* ---------- GET ALL BANNERS ---------- */
app.get('/api/banners', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        file_url,
        file_type,
        is_active,
        created_at
      FROM banners
      ORDER BY created_at DESC
    `);

    res.json({ banners: result.rows });
  } catch (err) {
    console.error('Failed to fetch banners:', err);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

console.log('Defining route /api/map-requests');

/* ---------- SUBMIT MAP REQUEST ---------- */
app.post('/api/map-requests',
  mapRequestUpload.fields([
    { name: 'requestLetter', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'initialData', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        clientType,
        email,
        surname,
        firstName,
        affiliation,
        date,
        mapType,
        purpose,
        areaOfInterest,
        mapSize,
        quantity
      } = req.body;

      if (
        !clientType || !email || !surname || !firstName ||
        !affiliation || !date || !mapType ||
        !purpose || !areaOfInterest || !mapSize || !quantity
      ) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // ✅ Generate Request Code
      const requestCode = generateRequestId();

      const requestLetterPath = req.files?.requestLetter
        ? '/uploads/map-requests/' + req.files.requestLetter[0].filename
        : null;

      const signaturePath = req.files?.signature
        ? '/uploads/map-requests/' + req.files.signature[0].filename
        : null;
      
        const initialDataPath = req.files?.initialData
        ? '/uploads/map-requests/' + req.files.initialData[0].filename
        : null;

      const result = await pool.query(
        `
        INSERT INTO map_requests
        (
          request_code,
          client_type,
          email,
          surname,
          first_name,
          affiliation,
          date_needed,
          map_type,
          purpose,
          area_of_interest,
          map_size,
          quantity,
          request_letter_url,
          signature_url,
          initial_data_url
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING id, request_code
        `,
        [
          requestCode,
          clientType,
          email,
          surname,
          firstName,
          affiliation,
          date,
          mapType,
          purpose,
          areaOfInterest,
          mapSize,
          quantity,
          requestLetterPath,
          signaturePath,
          initialDataPath,
        ]
      );

      // ✅ Send Email Notification
      await transporter.sendMail({
        from: `"CHERM Map Request" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Map Request - ${requestCode}`,
        html: `
          <h3>New Map Request Submitted</h3>
          <p><strong>Request Code:</strong> ${requestCode}</p>
          <p><strong>Client Type:</strong> ${clientType}</p>
          <p><strong>Name:</strong> ${firstName} ${surname}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Affiliation:</strong> ${affiliation}</p>
          <p><strong>Date Needed:</strong> ${date}</p>
          <p><strong>Map Type:</strong> ${mapType}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p><strong>Area of Interest:</strong> ${areaOfInterest}</p>
          <p><strong>Map Size:</strong> ${mapSize}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
        `
      });

      // ✅ Send confirmation email to USER
      await transporter.sendMail({
        from: `"CHERM Map Request" <${process.env.EMAIL_USER}>`,
        to: email, // send to the user who submitted
        subject: `Your CHERM Map Request Code - ${requestCode}`,
        html: `
          <h2>CHERM Map Request Confirmation</h2>
          <p>Dear ${firstName} ${surname},</p>

          <p>Thank you for submitting your map request.</p>

          <p><strong>Your Request Code:</strong></p>
          <h3 style="color:#2c3e50;">${requestCode}</h3>
        `
      });

      // ✅ Send success response
      res.json({
        success: true,
        requestCode: requestCode
      });

    } catch (err) {
      console.error('Map request error:', err);
      res.status(500).json({ error: 'Failed to submit request' });
    }
  }
);


app.get('/api/map-requests', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, request_code, first_name, surname, affiliation, date_needed, map_type, status, created_at, client_type
       FROM map_requests
       ORDER BY created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Fetch map requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// User: view map request by code (no login required)
app.get('/api/user/map-requests', async (req, res) => {
  const { code } = req.query;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Request code is required' });
  }

  try {
    const requestResult = await pool.query(
      `SELECT id,
        request_code,
        map_type,
        area_of_interest,
        status,
        created_at
       FROM map_requests
       WHERE TRIM(request_code) = $1
       LIMIT 1`,
      [code.trim()]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ request: null });
    }

    const request = requestResult.rows[0];

    const filesResult = await pool.query(
      `SELECT id,
              file_url,
              file_type,
              created_at
       FROM map_request_files
       WHERE map_request_id = $1
       ORDER BY created_at DESC`,
      [request.id]
    );

    request.admin_maps = filesResult.rows;

    res.json({ request });

  } catch (err) {
    console.error('Error fetching map request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/manuscript-requests', async (req, res) => {
  const { code } = req.query;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Request code is required' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        id,
        request_code,
        client_type,
        email,
        surname,
        first_name,
        affiliation,
        manuscript_title,
        abstract,
        date_needed,
        manuscript_file_path,
        file_link,
        status,
        admin_notes,
        reviewed_file_url,
        user_approved,
        created_at
       FROM manuscript_review_requests
       WHERE TRIM(request_code) = $1
       LIMIT 1`,
      [code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ request: null });
    }

    const request = result.rows[0];
    res.json({ request });

  } catch (err) {
    console.error('Error fetching manuscript review request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/* ---------- GET SINGLE MAP REQUEST ---------- */
app.get('/api/map-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM map_requests
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ request: result.rows[0] });

  } catch (err) {
    console.error('Fetch single request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

app.put('/api/map-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query(
      `UPDATE map_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update map request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.delete('/api/map-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const request = await pool.query(`SELECT request_letter_url, signature_url, initial_data_url FROM map_requests WHERE id = $1`, [id]);
    if (request.rows.length > 0) {
      const { request_letter_url, signature_url, initial_data_url } = request.rows[0];
      if (request_letter_url && fs.existsSync(path.join(__dirname, request_letter_url))) {
        fs.unlinkSync(path.join(__dirname, request_letter_url));
      }
      if (signature_url && fs.existsSync(path.join(__dirname, signature_url))) {
        fs.unlinkSync(path.join(__dirname, signature_url));
      }
      if (initial_data_url && fs.existsSync(path.join(__dirname, initial_data_url))) {
        fs.unlinkSync(path.join(__dirname, initial_data_url));
      }
    }
    await pool.query(`DELETE FROM map_requests WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete map request error:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

const mapProgressUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, adminMapsDir),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images or PDFs allowed'));
    }
  }
});


app.post('/api/map-requests/:id/upload', requireAuth, mapProgressUpload.single('mapFile'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = '/uploads/admin-maps/' + req.file.filename;

  try {
    await pool.query(
      `INSERT INTO map_request_files (map_request_id, file_url, file_type, uploaded_by)
       VALUES ($1, $2, 'admin-map', 'admin')`,
      [id, filePath]
    );

    res.json({ success: true, fileUrl: filePath });
  } catch (err) {
    console.error('Admin map upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/* ---------- GET UPLOAD HISTORY FOR A MAP REQUEST ---------- */
app.get('/api/map-requests/:id/uploads', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, file_url, file_type, uploaded_by, created_at AS uploaded_at,
              SUBSTRING(file_url FROM '[^/]+$') AS file_name
       FROM map_request_files
       WHERE map_request_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json({ uploads: result.rows });
  } catch (err) {
    console.error('Fetch upload history error:', err);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

app.post('/api/training-requests', trainingUpload.single('requestLetter'), async (req, res) => {
  try {
    const {
      clientType,
      email,
      surname,
      firstName,
      affiliation
    } = req.body;

    if (!clientType || !email || !surname || !firstName || !affiliation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Request Letter is required' });
    }

    let requestCode;
    let exists = true;

    while (exists) {
      requestCode = generateTrainingRequestId();
      const check = await pool.query(
        'SELECT id FROM training_requests WHERE request_code = $1',
        [requestCode]
      );
      if (check.rows.length === 0) exists = false;
    }

    const requestLetterPath = '/uploads/training-requests/' + req.file.filename;

    await pool.query(
      `INSERT INTO training_requests
        (request_code, client_type, email, surname, first_name, affiliation, request_letter_path)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7)`,
      [
        requestCode,
        clientType,
        email,
        surname,
        firstName,
        affiliation,
        requestLetterPath
      ]
    );

    res.status(201).json({
      success: true,
      requestCode
    });

  } catch (err) {
    console.error('Training request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/training-requests', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         request_code,
         client_type,
         email,
         surname,
         first_name,
         affiliation,
         request_letter_path,
         status,
         created_at
       FROM training_requests
       ORDER BY created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Fetch training requests error:', err);
    res.status(500).json({ error: 'Failed to fetch training requests' });
  }
});

app.get('/api/training-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM training_requests WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error('Fetch single training request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

app.put('/api/training-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    await pool.query(
      `UPDATE training_requests
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update training request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.delete('/api/training-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT request_letter_path FROM training_requests WHERE id = $1`,
      [id]
    );

    if (result.rows.length > 0) {
      const { request_letter_path } = result.rows[0];
      if (request_letter_path) {
        if (fs.existsSync(request_letter_path)) {
          fs.unlinkSync(request_letter_path);
        } else {
          const relative = path.join(__dirname, request_letter_path);
          if (fs.existsSync(relative)) fs.unlinkSync(relative);
        }
      }
    }

    await pool.query(`DELETE FROM training_requests WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete training request error:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.post('/api/manuscript-requests', manuscriptUpload.single('manuscriptFile'), async (req, res) => {
  try {
    const {
      clientType,
      email,
      surname,
      firstName,
      affiliation,
      manuscriptTitle,   
      abstract,          
      dateNeeded,        
      targetPublisher,
      fileLink
    } = req.body;

    if (!clientType || !email || !surname || !firstName || !affiliation || !fileLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Manuscript file is required' });
    }

    let requestCode;
    let exists = true;
    while (exists) {
      requestCode = generateManuscriptRequestId();
      const check = await pool.query(
        'SELECT id FROM manuscript_review_requests WHERE request_code = $1',
        [requestCode]
      );
      if (check.rows.length === 0) exists = false;
    }

    const manuscriptFilePath = '/uploads/manuscript-requests/' + req.file.filename;

    await pool.query(
      `INSERT INTO manuscript_review_requests
        (request_code, client_type, email, surname, first_name, affiliation,
         manuscript_title, abstract, date_needed, target_publisher,   
         manuscript_file_path, file_link)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        requestCode,
        clientType,
        email,
        surname,
        firstName,
        affiliation,
        manuscriptTitle || null,
        abstract        || null,
        dateNeeded      || null,
        targetPublisher  || null,
        manuscriptFilePath,
        fileLink
      ]
    );

    await transporter.sendMail({
      from: `"CHERM Manuscript Review" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Manuscript Review Request - ${requestCode}`,
      html: `
        <h3>New Manuscript Review Request Submitted</h3>
        <p><strong>Request Code:</strong> ${requestCode}</p>
        <p><strong>Client Type:</strong> ${clientType}</p>
        <p><strong>Name:</strong> ${firstName} ${surname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Affiliation:</strong> ${affiliation}</p>
        <p><strong>Manuscript Title:</strong> ${manuscriptTitle || '—'}</p>
        <p><strong>Review By:</strong> ${dateNeeded || '—'}</p>
        <p><strong>Target Journal / Publisher:</strong> ${targetPublisher || '—'}</p>
        <p><strong>Abstract:</strong></p>
        <blockquote style="color:#555; border-left:3px solid #ccc; padding-left:12px;">
          ${abstract || '—'}
        </blockquote>
        <p><strong>File Link:</strong> <a href="${fileLink}">${fileLink}</a></p>
        <p><strong>Uploaded File:</strong> ${req.file.originalname}</p>
      `
    });

    await transporter.sendMail({
      from: `"CHERM Manuscript Review" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your CHERM Manuscript Review Request - ${requestCode}`,
      html: `
        <h2>CHERM Manuscript Review Confirmation</h2>
        <p>Dear ${firstName} ${surname},</p>
        <p>Thank you for submitting your manuscript for review.</p>
        <p><strong>Manuscript Title:</strong> ${manuscriptTitle || '—'}</p>
        <p><strong>Your Request Code:</strong></p>
        <h3 style="color:#2c3e50;">${requestCode}</h3>
        <p>Please keep this code to track the status of your request.</p>
        <p>We will get back to you via email once the review is complete.</p>
      `
    });

    res.status(201).json({ success: true, requestCode });

  } catch (err) {
    console.error('Manuscript request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/manuscript-requests/:code/revision', async (req, res) => {
  const { code } = req.params;
  const { revision_notes } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Request code is required' });
  }

  if (!revision_notes || !revision_notes.trim()) {
    return res.status(400).json({ error: 'Revision notes are required' });
  }

  try {
    const check = await pool.query(
      `SELECT id, reviewed_file_url, user_approved, email, first_name, surname,
              affiliation, manuscript_title, created_at
       FROM manuscript_review_requests
       WHERE TRIM(request_code) = $1
       LIMIT 1`,
      [code.trim()]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const record = check.rows[0];

    if (record.user_approved) {
      return res.status(400).json({ error: 'Already approved, cannot request revision' });
    }

    await pool.query(
      `UPDATE manuscript_review_requests
       SET revision_notes          = $1,
           revision_requested_at   = CURRENT_TIMESTAMP,
           status                  = 'Under Review',
           reviewed_file_url       = NULL,
           updated_at              = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [revision_notes.trim(), record.id]
    );

    await transporter.sendMail({
    from: `"CHERM Manuscript Review" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Revision Requested - ${code}`,
    html: `
        <p>A client has requested revisions for their manuscript submission.</p>

        <p>
          <strong>Request Code:</strong> ${code}<br>
          <strong>Client Name:</strong> ${record.first_name} ${record.surname}<br>
          <strong>Email:</strong> ${record.email}<br>
          <strong>Affiliation:</strong> ${record.affiliation}<br>
          <strong>Manuscript Title:</strong> ${record.manuscript_title || '—'}<br>
          <strong>Date Submitted:</strong> ${new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <p><strong>Revision Notes:</strong><br>
        ${revision_notes.trim()}</p>

        <p>Please review the request at your earliest convenience.</p>

        <p>SLSU - CHERM System</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error('Revision request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/manuscript-requests', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         request_code,
         client_type,
         email,
         surname,
         first_name,
         affiliation,
         manuscript_title,
         abstract,
         date_needed,
         target_publisher,
         manuscript_file_path,
         file_link,
         reviewed_file_url,
         user_approved,
         status,
         admin_notes,
         revision_notes, 
         revision_requested_at,
         created_at
       FROM manuscript_review_requests
       ORDER BY created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Fetch manuscript requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.get('/api/manuscript-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM manuscript_review_requests WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error('Fetch single manuscript request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

app.put('/api/manuscript-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes, reviewed_file_url } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    await pool.query(
      `UPDATE manuscript_review_requests
       SET status             = $1,
           admin_notes        = $2,
           reviewed_file_url  = $3,
           updated_at         = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, admin_notes || null, reviewed_file_url || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update manuscript request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.delete('/api/manuscript-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT manuscript_file_path FROM manuscript_review_requests WHERE id = $1`,
      [id]
    );

    if (result.rows.length > 0) {
      const { manuscript_file_path } = result.rows[0];
      if (manuscript_file_path) {
        const relative = path.join(__dirname, manuscript_file_path);
        if (fs.existsSync(relative)) {
          fs.unlinkSync(relative);
        } else if (fs.existsSync(manuscript_file_path)) {
          fs.unlinkSync(manuscript_file_path);
        }
      }
    }

    await pool.query(
      `DELETE FROM manuscript_review_requests WHERE id = $1`,
      [id]
    );
    res.json({ success: true });

  } catch (err) {
    console.error('Delete manuscript request error:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.post('/api/user/manuscript-requests/:code/approve', async (req, res) => {
  const { code } = req.params;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Request code is required' });
  }

  try {
    const check = await pool.query(
      `SELECT id, reviewed_file_url, user_approved, status
       FROM manuscript_review_requests
       WHERE TRIM(request_code) = $1
       LIMIT 1`,
      [code.trim()]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const record = check.rows[0];

    if (!record.reviewed_file_url) {
      return res.status(400).json({ error: 'No reviewed file available to approve' });
    }

    if (record.user_approved) {
      return res.status(400).json({ error: 'Already approved' });
    }

    await pool.query(
      `UPDATE manuscript_review_requests
       SET user_approved = TRUE,
           status        = 'Completed',
           updated_at    = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [record.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Approve manuscript request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/data-requests', async (req, res) => {
  try {
    const {
      clientType,
      email,
      firstName,
      surname,
      affiliation,
      purpose,
      notes,
      datasets
    } = req.body;

    if (!clientType || !email || !firstName || !surname || !affiliation || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let parsedDatasets = [];
    if (datasets) {
      try {
        parsedDatasets = typeof datasets === 'string' ? JSON.parse(datasets) : datasets;
      } catch {
        return res.status(400).json({ error: 'Invalid datasets format' });
      }
    }

    if (!Array.isArray(parsedDatasets) || parsedDatasets.length === 0) {
      return res.status(400).json({ error: 'At least one dataset must be selected' });
    }

    let requestCode;
    let exists = true;
    while (exists) {
      requestCode = generateDataRequestId();
      const check = await pool.query(
        'SELECT id FROM data_requests WHERE request_code = $1',
        [requestCode]
      );
      if (check.rows.length === 0) exists = false;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const requestResult = await client.query(
        `INSERT INTO data_requests
          (request_code, client_type, email, first_name, surname,
           affiliation, purpose, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          requestCode,
          clientType,
          email,
          firstName,
          surname,
          affiliation,
          purpose,
          notes   || null,
        ]
      );

      const newId = requestResult.rows[0].id;

      for (const d of parsedDatasets) {
        await client.query(
          `INSERT INTO data_request_datasets
            (data_request_id, dataset_id, dataset_title, format, coverage, year)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newId,
            d.id       || 0,
            d.title    || d.dataset_title || 'Unknown',
            d.format   || null,
            d.coverage || null,
            d.year     || null,
          ]
        );
      }

      await client.query('COMMIT');

      const datasetList = parsedDatasets
        .map((d, i) => `<li>${i + 1}. ${d.title || d.dataset_title} (${d.format || '—'})</li>`)
        .join('');

      await transporter.sendMail({
        from:    `"CHERM Data Request" <${process.env.EMAIL_USER}>`,
        to:      process.env.EMAIL_USER,
        subject: `New GIS Data Request — ${requestCode}`,
        html: `
          <h3>New GIS Data Request Submitted</h3>
          <p><strong>Request Code:</strong> ${requestCode}</p>
          <p><strong>Client Type:</strong> ${clientType}</p>
          <p><strong>Name:</strong> ${firstName} ${surname}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Affiliation:</strong> ${affiliation}</p>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p><strong>Notes:</strong> ${notes || '—'}</p>
          <p><strong>Datasets Requested (${parsedDatasets.length}):</strong></p>
          <ul>${datasetList}</ul>
        `
      });

      await transporter.sendMail({
        from:    `"CHERM Data Request" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `Your CHERM GIS Data Request — ${requestCode}`,
        html: `
          <h2>CHERM GIS Data Request Confirmation</h2>
          <p>Dear ${firstName} ${surname},</p>
          <p>Thank you for submitting your GIS data request.</p>
          <p><strong>Your Request Code:</strong></p>
          <h3 style="color:#2c3e50;">${requestCode}</h3>
          <p>Please keep this code to track your request status.</p>
          <p><strong>Datasets Requested:</strong></p>
          <ul>${datasetList}</ul>
          <p>We will contact you once your request is ready for fulfillment.</p>
        `
      });

      res.status(201).json({ success: true, requestCode });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Data request submission error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

app.get('/api/data-requests', requireAuth, async (req, res) => {
  try {
    const requestsResult = await pool.query(
      `SELECT
         id,
         request_code,
         client_type,
         email,
         first_name,
         surname,
         affiliation,
         purpose,
         notes,
         status,
         delivery_link,
         admin_notes,
         created_at,
         updated_at
       FROM data_requests
       ORDER BY created_at DESC`
    );

    const requests = requestsResult.rows;

    if (requests.length === 0) {
      return res.json([]);
    }

    const ids = requests.map(r => r.id);
    const datasetsResult = await pool.query(
      `SELECT
         data_request_id,
         dataset_id,
         dataset_title,
         format,
         coverage,
         year
       FROM data_request_datasets
       WHERE data_request_id = ANY($1)
       ORDER BY id ASC`,
      [ids]
    );

    const datasetMap = {};
    for (const d of datasetsResult.rows) {
      if (!datasetMap[d.data_request_id]) datasetMap[d.data_request_id] = [];
      datasetMap[d.data_request_id].push(d);
    }

    const combined = requests.map(r => ({
      ...r,
      datasets: datasetMap[r.id] || [],
    }));

    res.json(combined);

  } catch (err) {
    console.error('Fetch data requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.get('/api/data-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const requestResult = await pool.query(
      `SELECT * FROM data_requests WHERE id = $1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    const datasetsResult = await pool.query(
      `SELECT dataset_id, dataset_title, format, coverage, year
       FROM data_request_datasets
       WHERE data_request_id = $1
       ORDER BY id ASC`,
      [id]
    );

    const filesResult = await pool.query(
      `SELECT id, filename, file_path, file_size, uploaded_at
       FROM data_request_files
       WHERE data_request_id = $1
       ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json({
      ...request,
      datasets:        datasetsResult.rows,
      delivered_files: filesResult.rows,
    });

  } catch (err) {
    console.error('Fetch single data request error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

app.put('/api/data-requests/:id', requireAuth, async (req, res) => {
  const { id }    = req.params;
  const { status, delivery_link, admin_notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    await pool.query(
      `UPDATE data_requests
       SET status        = $1,
           delivery_link = $2,
           admin_notes   = $3,
           updated_at    = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, delivery_link || null, admin_notes || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update data request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.delete('/api/data-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const filesResult = await pool.query(
      `SELECT file_path FROM data_request_files WHERE data_request_id = $1`,
      [id]
    );

    for (const row of filesResult.rows) {
      const absPath = path.join(__dirname, row.file_path);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    }

    await pool.query(`DELETE FROM data_requests WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete data request error:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.post('/api/data-requests/:id/files', requireAuth,
  dataRequestUpload.single('file'),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = '/uploads/data-requests/' + req.file.filename;
    const fileSize = formatFileSize(req.file.size);

    try {
      await pool.query(
        `INSERT INTO data_request_files
          (data_request_id, filename, file_path, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [id, req.file.originalname, filePath, fileSize]
      );

      res.json({
        success:  true,
        filename: req.file.originalname,
        file_path: filePath,
        file_size: fileSize,
      });
    } catch (err) {
      console.error('Data request file upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

app.get('/api/user/data-requests', async (req, res) => {
  const { code } = req.query;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Request code is required' });
  }

  try {
    const requestResult = await pool.query(
      `SELECT
         id,
         request_code,
         first_name,
         surname,
         purpose,
         status,
         delivery_link,
         admin_notes,
         created_at
       FROM data_requests
       WHERE TRIM(request_code) = $1
       LIMIT 1`,
      [code.trim()]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ request: null });
    }

    const request = requestResult.rows[0];

    const datasetsResult = await pool.query(
      `SELECT dataset_title, format, coverage, year
       FROM data_request_datasets
       WHERE data_request_id = $1
       ORDER BY id ASC`,
      [request.id]
    );

    const filesResult = await pool.query(
      `SELECT filename, file_path, file_size, uploaded_at
       FROM data_request_files
       WHERE data_request_id = $1
       ORDER BY uploaded_at DESC`,
      [request.id]
    );

    request.datasets        = datasetsResult.rows;
    request.delivered_files = filesResult.rows;

    res.json({ request });

  } catch (err) {
    console.error('User data request lookup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- DATASET CATALOGUE ---------- */

// ── GET /api/datasets ────────────────────────────────────────────
//  Public — active datasets only (used by data request form)

app.get('/api/datasets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, data_desc, cat, format, coverage,
         scale, crs, year, size, file_path, preview_url,
         is_active, created_at, updated_at
       FROM datasets
       WHERE is_active = TRUE
       ORDER BY cat ASC, title ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch datasets error:', err);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});


// ── GET /api/datasets/all ────────────────────────────────────────
//  Admin only — includes inactive datasets

app.get('/api/datasets/all', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id, title, data_desc, cat, format, coverage,
         scale, crs, year, size, file_path, preview_url,
         is_active, created_at, updated_at
       FROM datasets
       ORDER BY cat ASC, title ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch all datasets error:', err);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});


// ── POST /api/datasets ───────────────────────────────────────────
//  Admin — add a new dataset (metadata only; file uploaded separately)

app.post('/api/datasets', requireAuth, async (req, res) => {
  const {
    title, data_desc, cat, format, coverage,
    scale, crs, year, size
  } = req.body;

  if (!title || !cat || !format || !coverage) {
    return res.status(400).json({ error: 'title, cat, format, and coverage are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO datasets
         (title, data_desc, cat, format, coverage, scale, crs, year, size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        title.trim(),
        data_desc || null,
        cat,
        format,
        coverage.trim(),
        scale     || null,
        crs       || null,
        year      || null,
        size      || null,
      ]
    );

    res.status(201).json({ success: true, id: result.rows[0].id });

  } catch (err) {
    console.error('Add dataset error:', err);
    res.status(500).json({ error: 'Failed to add dataset' });
  }
});


// ── POST /api/datasets/:id/file ──────────────────────────────────
//  Admin — upload the actual GIS dataset file
//  Auto-sets preview_url for browser-renderable types (PDF, CSV, image)
//  Leaves preview_url = NULL for GIS binaries (SHP, TIFF, GPKG, etc.)

app.post('/api/datasets/:id/file', requireAuth,
  datasetFileUpload.single('datasetFile'),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = '/uploads/dataset-files/' + req.file.filename;
    const fileSize = formatFileSize(req.file.size);

    // Auto-set preview_url for browser-renderable types; null for GIS binaries
    const PREVIEWABLE = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.csv'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    const previewUrl = PREVIEWABLE.includes(ext) ? filePath : null;

    try {
      // Delete old file from disk if one existed
      const existing = await pool.query(
        `SELECT file_path FROM datasets WHERE id = $1`, [id]
      );
      if (existing.rows.length > 0 && existing.rows[0].file_path) {
        const oldAbs = path.join(__dirname, existing.rows[0].file_path);
        if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
      }

      await pool.query(
        `UPDATE datasets
         SET file_path   = $1,
             size        = $2,
             preview_url = $3,
             updated_at  = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [filePath, fileSize, previewUrl, id]
      );

      res.json({ success: true, file_path: filePath, size: fileSize, preview_url: previewUrl });

    } catch (err) {
      console.error('Dataset file upload error:', err);
      res.status(500).json({ error: 'File upload failed' });
    }
  }
);


// ── PUT /api/datasets/:id ────────────────────────────────────────
//  Admin — update dataset metadata ONLY
//  Does NOT touch file_path or preview_url (those are set by file upload)

app.put('/api/datasets/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    title, data_desc, cat, format, coverage,
    scale, crs, year, is_active
  } = req.body;

  if (!title || !cat || !format || !coverage) {
    return res.status(400).json({ error: 'title, cat, format, and coverage are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE datasets
       SET title      = $1,
           data_desc  = $2,
           cat        = $3,
           format     = $4,
           coverage   = $5,
           scale      = $6,
           crs        = $7,
           year       = $8,
           is_active  = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [
        title.trim(),
        data_desc || null,
        cat,
        format,
        coverage.trim(),
        scale     || null,
        crs       || null,
        year      || null,
        is_active !== undefined ? is_active : true,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Update dataset error:', err);
    res.status(500).json({ error: 'Failed to update dataset' });
  }
});


// ── DELETE /api/datasets/:id ─────────────────────────────────────
//  Admin — delete dataset + its file from disk

app.delete('/api/datasets/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT file_path FROM datasets WHERE id = $1`, [id]
    );
    if (result.rows.length > 0 && result.rows[0].file_path) {
      const absPath = path.join(__dirname, result.rows[0].file_path);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }

    const del = await pool.query(`DELETE FROM datasets WHERE id = $1`, [id]);
    if (del.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});


/* ---------- STATIC FILES ---------- */
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

/* ---------- GLOBAL ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 500MB.'
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Server error' });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});