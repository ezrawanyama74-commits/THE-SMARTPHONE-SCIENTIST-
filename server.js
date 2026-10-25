require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

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
});
