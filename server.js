const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = "Vision";

let activeSessions = new Set();

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initial = { settings: { facebook: "#", youtube: "#", github: "#", whatsapp: "#", email: "#" }, profileImage: "", stories: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
            return initial;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return { settings: { facebook: "#", youtube: "#", github: "#", whatsapp: "#", email: "#" }, profileImage: "", stories: [] };
    }
}

function writeDatabase(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeHTML(html) {
    if (!html) return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[REMOVED]');
}

function getSessionToken(req) {
    const list = {}, rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    return list.session_token;
}

const server = http.createServer((req, res) => {
    const db = readDatabase();
    const cleanPath = req.url.split('?');
    const sessionToken = getSessionToken(req);
    const isAuthenticated = activeSessions.has(sessionToken);

    // 1. PUBLIC INDEX STREAM GATEWAY (WITH HORIZONTAL SCROLLING CARD STRIP LOGIC)
    if (cleanPath[0] === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'views', 'index.ejs'), 'utf8', (err, template) => {
            if (err) { res.writeHead(500); return res.end('Template Error'); }
            
            let storyHTML = '';
            const publicStories = db.stories.filter(s => s.visible !== false);
            
            publicStories.forEach(story => {
                let imagesContainer = '';
                if (story.image) {
                    try {
                        // Unpack the parsed multi-image JSON array payload string
                        const imagesArray = JSON.parse(story.image);
                        if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                            imagesContainer = '<div class="gallery-strip">';
                            imagesArray.forEach(imgData => {
                                imagesContainer += `<div class="gallery-img-card"><img src="${imgData}" class="story-embedded-img"></div>`;
                            });
                            imagesContainer += '</div>';
                        }
                    } catch (e) {
                        // Fallback string parser if previous logs contain single raw Base64 data lines
                        imagesContainer = `<div class="gallery-strip"><div class="gallery-img-card"><img src="${story.image}" class="story-embedded-img"></div></div>`;
                    }
                }

                storyHTML += `
                <article class="story-card">
                    <div class="story-meta">[ LOG DATE: ${story.date} ]</div>
                    <h2 class="story-title">${story.title}</h2>
                    <div class="story-content-wrap">
                        <div class="story-rendered-body">${story.content}</div>
                        <button type="button" class="see-more-btn">See More...</button>
                    </div>
                    ${imagesContainer}
                    ${story.externalLink ? `<div><a href="${story.externalLink}" target="_blank" class="action-link-btn">// View Project Link</a></div>` : ''}
                </article>`;
            });

            const profilePic = db.profileImage || 'https://placeholder.com';
            
            // Hardened mail header validation mapping logic check
            let cleanEmail = db.settings.email.trim();
            if (cleanEmail !== '#' && !cleanEmail.toLowerCase().startsWith('mailto:')) {
                cleanEmail = 'mailto:' + cleanEmail;
            }

            let rendered = template
                .replace('%PROFILE_IMAGE%', profilePic)
                .replace('%GITHUB%', db.settings.github)
                .replace('%FACEBOOK%', db.settings.facebook)
                .replace('%YOUTUBE%', db.settings.youtube)
                .replace('%WHATSAPP%', db.settings.whatsapp)
                .replace('%EMAIL%', cleanEmail)
                .replace('%STORIES_STREAM%', storyHTML || '<div class="story-card" style="text-align: center; color: var(--text-muted);"><p>[ No logs compiled yet. Go to /admin to update. ]</p></div>');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(rendered);
        });
    }

    // 2. PROTECTED ADMIN HUB CONTROLLER ROUTE
    else if (cleanPath[0] === '/admin' && req.method === 'GET') {
        if (!isAuthenticated) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>[ LOCKED GATEWAY ]</title>
                    <style>
                        body { background: #090d12; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 15px; box-sizing: border-box; }
                        .lock-box { background: #121820; border: 1px solid #232d38; padding: 25px; border-radius: 6px; width: 100%; max-width: 360px; text-align: center; box-shadow: 0 0 15px rgba(0,243,255,0.1); }
                        input[type="password"] { width: 100%; background: #090d12; border: 1px solid #232d38; color: #fff; padding: 10px; border-radius: 4px; font-family: inherit; margin: 15px 0; box-sizing: border-box; text-align: center; }
                        button { background: transparent; border: 2px solid #39ff14; color: #39ff14; padding: 10px 20px; font-weight: bold; border-radius: 4px; cursor: pointer; font-family: inherit; width: 100%; }
                        button:hover { background: #39ff14; color: #000; box-shadow: 0 0 10px #39ff14; }
                    </style>
                </head>
                <body>
                    <div class="lock-box">
                        <h2 style="color:#00f3ff; margin:0 0 10px 0; font-size:1.2rem;">[ CORE GATEWAY AUTH ]</h2>
                        <form action="/admin/login" method="POST">
                            <input type="password" name="password" placeholder="Enter Security Key" required autocomplete="current-password">
                            <button type="submit">Authorize System Access</button>
                        </form>
                    </div>
                </body>
                </html>
            `);
        }

        fs.readFile(path.join(__dirname, 'views', 'admin.ejs'), 'utf8', (err, template) => {
            if (err) { res.writeHead(500); return res.end('Admin Template Error'); }
            
            let controlRows = '';
            db.stories.forEach(story => {
                controlRows += `
                <div class="row-item">
                    <div>
                        <span class="badge ${story.visible !== false ? 'badge-live' : 'badge-hidden'}">${story.visible !== false ? 'LIVE' : 'DRAFT'}</span>
                        <strong style="color:#fff; margin-left:8px;">${story.title}</strong>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="btn-edit" onclick="populateEditForm('${story.id}', '${encodeURIComponent(story.title)}', '${encodeURIComponent(story.content)}', '${story.externalLink}', '${story.visible !== false}')">Edit</button>
                        <form action="/admin/story/delete" method="POST" style="margin:0;">
                            <input type="hidden" name="id" value="${story.id}">
                            <button type="submit" class="btn-danger">Delete</button>
                        </form>
                    </div>
                </div>`;
            });

            let rendered = template
                .replace('%FACEBOOK%', db.settings.facebook).replace('%YOUTUBE%', db.settings.youtube)
                .replace('%GITHUB%', db.settings.github).replace('%WHATSAPP%', db.settings.whatsapp)
                .replace('%EMAIL%', db.settings.email).replace('%LOGS_COUNT%', db.stories.length)
                .replace('%STORIES_TABLE%', controlRows || '<p style="color:var(--text-muted); text-align:center; padding:15px;">[ Database Empty ]</p>');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(rendered);
        });
    }
    // 3. POST HANDLER: LOGIN VERIFICATION & COOKIE ISSUANCE
    else if (cleanPath[0] === '/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = querystring.parse(body);
            if (formData.password === ADMIN_PASSWORD) {
                const token = 'tok_' + Math.random().toString(36).substring(2);
                activeSessions.add(token);
                res.writeHead(302, { 'Set-Cookie': `session_token=${token}; Path=/; HttpOnly; SameSite=Strict`, 'Location': '/admin' });
                res.end();
            } else {
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.end('<h3>ACCESS DENIED.</h3><a href="/admin">Try Again</a>');
            }
        });
    }
    // 4. ACTION PROCESSORS: DATA SAVES & DELETIONS
    else if (cleanPath[0] === '/admin/story/save' && req.method === 'POST') {
        if (!isAuthenticated) { res.writeHead(401); return res.end('UNAUTHORIZED'); }
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const dbState = readDatabase();
            const targetStory = {
                id: formData.id || Date.now().toString(),
                title: formData.title || 'Untitled Log',
                content: formData.content || '',
                image: formData.image || '', // Holds multiple compressed image string arrays cleanly
                externalLink: formData.externalLink || '',
                visible: formData.visible === 'false' ? false : true,
                date: new Date().toLocaleDateString()
            };
            if (formData.id) {
                const index = dbState.stories.findIndex(s => s.id === formData.id);
                if (index !== -1) dbState.stories[index] = targetStory;
            } else {
                dbState.stories.unshift(targetStory);
            }
            writeDatabase(dbState);
            res.writeHead(302, { 'Location': '/admin' });
            res.end();
        });
    }
    else if (cleanPath[0] === '/admin/settings/save' && req.method === 'POST') {
        if (!isAuthenticated) { res.writeHead(401); return res.end('UNAUTHORIZED'); }
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const dbState = readDatabase();
            dbState.settings = { facebook: formData.facebook || '#', youtube: formData.youtube || '#', github: formData.github || '#', whatsapp: formData.whatsapp || '#', email: formData.email || '#' };
            writeDatabase(dbState);
            res.writeHead(302, { 'Location': '/admin' });
            res.end();
        });
    }
    else if (cleanPath[0] === '/admin/story/delete' && req.method === 'POST') {
        if (!isAuthenticated) { res.writeHead(401); return res.end('UNAUTHORIZED'); }
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const dbState = readDatabase();
            dbState.stories = dbState.stories.filter(s => s.id !== formData.id);
            writeDatabase(dbState);
            res.writeHead(302, { 'Location': '/admin' });
            res.end();
        });
    }
    // 5. STATIC STYLE ASSET DELIVERY
    else if (cleanPath[0] === '/css/style.css') {
        fs.readFile(path.join(__dirname, 'public', 'css', 'style.css'), (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
    } else {
        res.writeHead(404); res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\x1b[32m[SYSTEM] Hardened Multi-Media Pipeline Online!`);
});
