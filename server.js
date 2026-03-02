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
    // console.log('Route /api/map-requests hit! Body:', req.body, 'Files:', req.files);

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


// app.get('/api/map-requests', requireAuth, async (req, res) => {
//   try {
//     const result = await pool.query(
//       `SELECT id, first_name, surname, affiliation, date_needed, map_type, status, created_at
//        FROM map_requests
//        ORDER BY created_at DESC`
//     );
//     res.json({ requests: result.rows });
//   } catch (err) {
//     console.error('Fetch map requests error:', err);
//     res.status(500).json({ error: 'Failed to fetch requests' });
//   }
// });

// GET /api/map-requests/:id - Fetch full details for a single request (for modal)
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
    // 1️⃣ Get the map request
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

    // 2️⃣ Get admin uploaded maps for this request
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

    // 3️⃣ Attach admin maps to request object
    request.admin_maps = filesResult.rows;

    // 4️⃣ Return in correct format for frontend
    res.json({ request });

  } catch (err) {
    console.error('Error fetching map request:', err);
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

// PUT /api/map-requests/:id - Update request status (and optionally other fields)
app.put('/api/map-requests/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;  // Add more fields if needed (e.g., map_type)
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
    // Optionally delete associated files (request_letter_url, signature_url)
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

// POST /api/map-requests/:id/upload - Upload map progress file
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
    // Insert the admin-uploaded map into the new table
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

    // Generate unique request code
    let requestCode;
    let exists = true;

    while (exists) {
      requestCode = generateTrainingRequestId();

      const check = await pool.query(
        'SELECT id FROM training_requests WHERE request_code = $1',
        [requestCode]
      );

      if (check.rows.length === 0) {
        exists = false;
      }
    }

    // Insert into database (MATCHES YOUR TABLE EXACTLY)
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
        req.file.path
      ]
    );

    res.status(201).json({
      success: true,
      requestCode: requestCode
    });

  } catch (err) {
    console.error('Training request error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});