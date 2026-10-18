require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_ROUTE = process.env.ADMIN_ROUTE || '/scientist-portal';

// File Upload Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

const upload = multer({ storage: storage });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dynamic SEO Sitemap Route
app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://the-smartphone-scientist.onrender.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.status(200).send(xmlContent);
});

// Robots.txt Route
app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(`User-agent: *\nAllow: /\nSitemap: https://the-smartphone-scientist.onrender.com/sitemap.xml`);
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 * 24 }
}));

// Auth Guard Middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Database Helpers
const DATA_FILE = path.join(__dirname, 'data.json');

function getDatabase() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            config: {
                facebook: "https://facebook.com",
                youtube: "https://youtube.com/@Ezra_Wanyama",
                github: "https://github.com/ezrawanyama74-commits",
                whatsapp: "https://wa.me/0748907929",
                email: "scientist@domain.com"
            },
            logs: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveDatabase(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Public Routes
app.get('/', (req, res) => {
    const db = getDatabase();
    res.render('index', { config: db.config, logs: db.logs });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        return res.redirect(ADMIN_ROUTE);
    }
    res.render('login', { error: 'Invalid Scientist Passcode or Identifier.' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Secret Admin Routes
app.get(ADMIN_ROUTE, requireAuth, (req, res) => {
    const db = getDatabase();
    res.render('admin', { config: db.config, logs: db.logs, adminRoute: ADMIN_ROUTE });
});

app.post(ADMIN_ROUTE + '/config', requireAuth, (req, res) => {
    const db = getDatabase();
    db.config = {
        facebook: req.body.facebook || db.config.facebook,
        youtube: req.body.youtube || db.config.youtube,
        github: req.body.github || db.config.github,
        whatsapp: req.body.whatsapp || db.config.whatsapp,
        email: req.body.email || db.config.email
    };
    saveDatabase(db);
    res.redirect(ADMIN_ROUTE);
});

app.post(ADMIN_ROUTE + '/logs', requireAuth, upload.array('attachments', 5), (req, res) => {
    const db = getDatabase();
    
    const uploadedFiles = req.files ? req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: '/uploads/' + file.filename,
        mimetype: file.mimetype,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    })) : [];

    const newLog = {
        id: Date.now().toString(),
        title: req.body.title,
        category: req.body.category || "SCIENCE LOG",
        date: new Date().toLocaleDateString('en-US'),
        content: req.body.content,
        externalUrl: req.body.externalUrl || "",
        visibility: req.body.visibility || "LIVE",
        files: uploadedFiles
    };

    db.logs.unshift(newLog);
    saveDatabase(db);
    res.redirect(ADMIN_ROUTE);
});

app.post(ADMIN_ROUTE + '/logs/delete/:id', requireAuth, (req, res) => {
    const db = getDatabase();
    db.logs = db.logs.filter(l => l.id !== req.params.id);
    saveDatabase(db);
    res.redirect(ADMIN_ROUTE);
});

app.listen(PORT, () => {
    console.log(`\n [ SMARTPHONE SCIENTIST SERVER RUNNING ]`);
    console.log(` Public URL: http://localhost:${PORT}`);
    console.log(` Protected Portal Path: ${ADMIN_ROUTE}`);
});
