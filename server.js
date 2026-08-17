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
    const cleanPath = req.url.split('?')[0];
    const sessionToken = getSessionToken(req);
    const isAuthenticated = activeSessions.has(sessionToken);

    // 1. PUBLIC INDEX STREAM GATEWAY
    if (cleanPath === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'views', 'index.ejs'), 'utf8', (err, template) => {
            if (err) { res.writeHead(500); return res.end('Template Error'); }
            
            let storyHTML = '';
            const publicStories = db.stories.filter(s => s.visible !== false);
            publicStories.forEach(story => {
                storyHTML += `
                <article class="story-card">
                    <div class="story-meta">[ LOG DATE: ${story.date} ]</div>
                    <h2 class="story-title">${story.title}</h2>
                    <div class="story-rendered-body">${story.content}</div>
                    ${story.image ? `<div class="story-img-wrapper"><img src="${story.image}" class="story-embedded-img"></div>` : ''}
                    ${story.externalLink ? `<div><a href="${story.externalLink}" target="_blank" class="action-link-btn">// View Project Link</a></div>` : ''}
                </article>`;
            });

            const profilePic = db.profileImage || 'https://placeholder.com';
            let rendered = template
                .replace('%PROFILE_IMAGE%', profilePic)
                .replace('%GITHUB%', db.settings.github).replace('%FACEBOOK%', db.settings.facebook)
                .replace('%YOUTUBE%', db.settings.youtube).replace('%WHATSAPP%', db.settings.whatsapp)
                .replace('%EMAIL%', db.settings.email).replace('%STORIES_STREAM%', storyHTML || '<div class="story-card" style="text-align: center; color: var(--text-muted);"><p>[ No logs compiled yet. Go to /admin to update. ]</p></div>');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(rendered);
        });
    }
    // 2. PROTECTED ADMIN ROUTE PATH
    else if (cleanPath === '/admin' && req.method === 'GET') {
        if (!isAuthenticated) {
            fs.readFile(path.join(__dirname, 'views', 'login.ejs'), 'utf8', (err, html) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            });
            return;
        }

        fs.readFile(path.join(__dirname, 'views', 'admin.ejs'), 'utf8', (err, template) => {
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
    // 3. POST CONTROLLER: VERIFY SESSION ENTRANCE KEY
    else if (cleanPath === '/admin/login' && req.method === 'POST') {
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
    else if (cleanPath === '/admin/story/save' && req.method === 'POST') {
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
                image: formData.image || '',
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
    else if (cleanPath === '/admin/settings/save' && req.method === 'POST') {
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
    else if (cleanPath === '/admin/story/delete' && req.method === 'POST') {
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
    else if (cleanPath === '/css/style.css') {
        fs.readFile(path.join(__dirname, 'public', 'css', 'style.css'), (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
    } else {
        res.writeHead(404); res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\x1b[32m[SYSTEM] Pure Offline Node App Core Active on Port ${PORT}!`);
});
