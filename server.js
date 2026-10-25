require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
<<<<<<< HEAD

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secret123';
const SECRET_ADMIN_ROUTE = process.env.SECRET_ADMIN_ROUTE || '/lab-control-77x';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname), { index: 'index.html' }));

app.get('/admin.html', (req, res) => {
    res.status(404).send('404 Not Found');
});

app.get(SECRET_ADMIN_ROUTE, (req, res) => {
    res.sendFile(path.join(__dirname, 'secret-admin.html'));
});

// API endpoint to fetch all data
app.get('/api/projects', (req, res) => {
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Could not load data.' });
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password.' });
    }
});

// Admin Update Landing Content Route
app.post('/api/admin/landing/update', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newLanding = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.landing = newLanding;
        fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

// Admin Update Social Links Route
app.post('/api/admin/socials/update', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newSocials = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.socials = newSocials;
        fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

// Admin Add Project Route
app.post('/api/admin/projects/add', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newProject = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.projects.push(newProject);
        fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

// Admin Edit Project Route
app.post('/api/admin/projects/edit', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const { index, updatedProject } = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        let json = JSON.parse(data);
        if (json.projects && json.projects[index] !== undefined) {
            json.projects[index] = updatedProject;
            fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(json, null, 2), (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ success: false });
        }
    });
});

// Admin Delete Project Route
app.post('/api/admin/projects/delete', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const { index } = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        let json = JSON.parse(data);
        if (json.projects && json.projects[index] !== undefined) {
            json.projects.splice(index, 1);
            fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(json, null, 2), (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ success: false });
        }
    });
});

app.listen(PORT, () => {
    console.log(`[SERVER] Online at port ${PORT}`);
    console.log(`[SECRET ADMIN] http://localhost:${PORT}${SECRET_ADMIN_ROUTE}`);
=======
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_ROUTE = process.env.ADMIN_ROUTE || '/scientist-portal';

// ==========================================
// 1. CRITICAL SEO ROUTES (TOP PRIORITY)
// ==========================================
app.get('/robots.txt', (req, res) => {
    console.log('[SEO CRAWLER] Googlebot requested robots.txt');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send("User-agent: *\nAllow: /\n\nSitemap: https://the-smartphone-scientist.onrender.com/sitemap.xml");
});

app.get('/sitemap.xml', (req, res) => {
    console.log('[SEO CRAWLER] Googlebot requested sitemap.xml');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://the-smartphone-scientist.onrender.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    return res.status(200).send(xml);
});

// ==========================================
// 2. STORAGE & MIDDLEWARE
// ==========================================
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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// ==========================================
// 3. APPLICATION ROUTES
// ==========================================
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

// Admin Portal Routes
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
>>>>>>> 7e4480806278f2a3c62c9e44278e1d655f837a67
});

// Explicit route for Google Search Console sitemap
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
