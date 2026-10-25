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

// Ensure data.json exists on startup to prevent read errors
const dataPath = path.join(__dirname, 'data.json');
if (!fs.existsSync(dataPath)) {
    const initialData = {
        landing: {
            name: "Ezra Wanyama Waswa",
            tagline: "\"Turn your phone into a super computer\"",
            aboutParagraphs: [
                "Ezra Wanyama Waswa, popularly known as \"THE SMARTPHONE SCIENTIST,\" is a Kenyan innovator, tech developer, and computer science student.",
                "Operating without a traditional laptop, Ezra converts standard Android hardware into a high-powered technical workstation using Termux, Pydroid, and GitHub to engineer full-stack web platforms, databases, and AI systems."
            ],
            specializations: ["Web Development (PWA)", "Artificial Intelligence", "Embedded Robotics & IoT", "Termux Mobile Engineering", "Database Architecture", "Community Empowerment"],
            philosophy: "Continuous learning and turning your phone into a super computer."
        },
        socials: {
            github: "https://github.com/ezrawanyama74",
            whatsapp: "https://wa.me/254",
            email: "contact@thesmartphonescientist.com"
        },
        projects: [
            {
                name: "Navakholo TerraHub Initiative",
                icon: "fas fa-network-wired",
                devicesAndApps: ["Android Smartphone", "Termux", "Node.js", "Git"],
                why: "To drive grassroots economic growth, community skilling, and digital sovereignty in Kakamega County.",
                solved: "Provides a decentralized digital ecosystem and community blueprints bridging the digital divide.",
                link: "https://blueprints4nti.onrender.com/"
            }
        ]
    };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

app.get('/admin.html', (req, res) => {
    res.status(404).send('404 Not Found');
});

app.get(SECRET_ADMIN_ROUTE, (req, res) => {
    res.sendFile(path.join(__dirname, 'secret-admin.html'));
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/api/projects', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
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

app.post('/api/admin/landing/update', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newLanding = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.landing = newLanding;
        fs.writeFile(dataPath, JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

app.post('/api/admin/socials/update', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newSocials = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.socials = newSocials;
        fs.writeFile(dataPath, JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

app.post('/api/admin/projects/add', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const newProject = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        let json = { landing: {}, socials: {}, projects: [] };
        if (!err && data) json = JSON.parse(data);
        
        json.projects.push(newProject);
        fs.writeFile(dataPath, JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

app.post('/api/admin/projects/edit', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const { index, updatedProject } = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        let json = JSON.parse(data);
        if (json.projects && json.projects[index] !== undefined) {
            json.projects[index] = updatedProject;
            fs.writeFile(dataPath, JSON.stringify(json, null, 2), (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ success: false });
        }
    });
});

app.post('/api/admin/projects/delete', (req, res) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSWORD) return res.status(403).json({ success: false });

    const { index } = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        let json = JSON.parse(data);
        if (json.projects && json.projects[index] !== undefined) {
            json.projects.splice(index, 1);
            fs.writeFile(dataPath, JSON.stringify(json, null, 2), (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ success: false });
        }
    });
});

app.listen(PORT, () => {
    console.log(`[SERVER] Online on port ${PORT}`);
});
