const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_FILE = path.join(__dirname, 'data.json');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\x1b[35m==================================================");
console.log("   🔬 THE SMARTPHONE SCIENTIST LOGO CHATBOT  ");
console.log("==================================================\x1b[0m");

rl.question("\x1b[36m👉 Paste your image file path here:\n(e.g., /storage/emulated/0/Personal/Ezra.jpg)\n\x1b[32mPath: \x1b[0m", (filePath) => {
    filePath = filePath.trim();
    if (!fs.existsSync(filePath)) {
        console.log("\x1b[31m\n❌ [ERROR] Could not trace a file at that path!\x1b[0m");
        rl.close(); return;
    }
    try {
        const fileExt = path.extname(filePath).toLowerCase();
        let mime = 'image/jpeg';
        if (fileExt === '.png') mime = 'image/png';
        const base64Str = fs.readFileSync(filePath).toString('base64');
        const embeddedString = `data:${mime};base64,${base64Str}`;
        
        let db = { settings: { facebook: "#", youtube: "#", github: "#", whatsapp: "#", email: "#" }, profileImage: "", stories: [] };
        if (fs.existsSync(DATA_FILE)) db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        db.profileImage = embeddedString;
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log("\x1b[32m\n🎯 [SUCCESS] Logo saved permanently into storage configuration loops!\x1b[0m");
    } catch (e) {
        console.log("\x1b[31m\n❌ [FAULT] conversion failed: " + e.message + "\x1b[0m");
    }
    rl.close();
});
