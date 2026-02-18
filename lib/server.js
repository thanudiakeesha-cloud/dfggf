const express = require('express');
const { createServer } = require('http');
const packageInfo = require('../package.json');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

app.use(express.json());

// Simple API to get and update manageable settings stored in data/manage.json
const managePath = path.join(__dirname, '..', 'data', 'manage.json');

app.get('/api/settings', (req, res) => {
        try {
                if (!fs.existsSync(managePath)) return res.json({});
                const raw = fs.readFileSync(managePath, 'utf8');
                const obj = JSON.parse(raw || '{}');
                res.json(obj);
        } catch (e) {
                res.status(500).json({ error: e.message });
        }
});

app.post('/api/settings', (req, res) => {
        try {
                const body = req.body || {};
                const toWrite = JSON.stringify(body, null, 2);
                fs.writeFileSync(managePath, toWrite, 'utf8');
                res.json({ ok: true });
        } catch (e) {
                res.status(500).json({ error: e.message });
        }
});

// Simple dashboard UI
app.get('/dashboard', (req, res) => {
        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Bot Dashboard</title>
            <style>
                body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;background:#0b1220;color:#e6eef8}
                .wrap{max-width:900px;margin:24px auto;padding:18px;background:#071127;border-radius:12px}
                label{display:block;margin-top:12px;color:#9fb0c8}
                input[type=text], textarea{width:100%;padding:8px;border-radius:6px;border:1px solid #234}
                button{margin-top:12px;padding:10px 14px;border-radius:8px;background:#06d6a0;border:none;color:#012}
                .hint{color:#7f9fb2;font-size:0.9rem}
            </style>
        </head>
        <body>
            <div class="wrap">
                <h2>Bot Dashboard</h2>
                <p class="hint">Edit basic bot settings and image URL lists for `.menu` and `.ping`. After changing settings, restart the bot to apply globally.</p>

                <form id="frm">
                    <label>Bot Name<input type="text" id="botName"/></label>
                    <label>Bot Owner<input type="text" id="botOwner"/></label>
                    <label>Connect Note<textarea id="connectNote" rows="2"></textarea></label>
                    <label>Forwarding Score<input type="text" id="forwardingScore"/></label>
                    <label>Newsletter JID<input type="text" id="newsletterJid"/></label>
                    <label>Newsletter Name<input type="text" id="newsletterName"/></label>
                    <label>Menu Image URLs (one per line)<textarea id="menuImageUrls" rows="4"></textarea></label>
                    <label>Ping Image URLs (one per line)<textarea id="pingImageUrls" rows="4"></textarea></label>
                    <button type="button" onclick="save()">Save</button>
                </form>

                <pre id="result" style="margin-top:14px;color:#bfe">Loading...</pre>
            </div>
            <script>
                async function load(){
                    const res = await fetch('/api/settings');
                    const j = await res.json();
                    document.getElementById('botName').value = j.botName || '';
                    document.getElementById('botOwner').value = j.botOwner || '';
                    document.getElementById('connectNote').value = j.connectNote || '';
                    document.getElementById('forwardingScore').value = j.forwardingScore || '';
                    document.getElementById('newsletterJid').value = j.newsletterJid || '';
                    document.getElementById('newsletterName').value = j.newsletterName || '';
                    document.getElementById('menuImageUrls').value = (j.menuImageUrls || []).join('\n');
                    document.getElementById('pingImageUrls').value = (j.pingImageUrls || []).join('\n');
                    document.getElementById('result').textContent = 'Ready';
                }
                async function save(){
                    const body = {
                        botName: document.getElementById('botName').value,
                        botOwner: document.getElementById('botOwner').value,
                        connectNote: document.getElementById('connectNote').value,
                        forwardingScore: parseInt(document.getElementById('forwardingScore').value) || 1,
                        newsletterJid: document.getElementById('newsletterJid').value,
                        newsletterName: document.getElementById('newsletterName').value,
                        menuImageUrls: document.getElementById('menuImageUrls').value.split(/\n+/).filter(Boolean),
                        pingImageUrls: document.getElementById('pingImageUrls').value.split(/\n+/).filter(Boolean)
                    };
                    const res = await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
                    const j = await res.json();
                    document.getElementById('result').textContent = JSON.stringify(j, null, 2);
                }
                load();
            </script>
        </body>
        </html>
        `);
});

app.get('/', (req, res) => {
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${packageInfo.name.toUpperCase()} Status</title>
        <style>
            :root { --primary: #25d366; --bg: #0f172a; --card-bg: rgba(30, 41, 59, 0.7); }
            body { 
                margin: 0; padding: 0; background: var(--bg); color: white; 
                font-family: 'Inter', system-ui, sans-serif;
                display: flex; justify-content: center; align-items: center; min-height: 100vh;
            }
            .container {
                background: var(--card-bg); backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.1); padding: 30px;
                border-radius: 24px; width: 90%; max-width: 400px; text-align: center;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            .status-badge {
                display: inline-flex; align-items: center; background: rgba(37, 211, 102, 0.1);
                color: var(--primary); padding: 5px 15px; border-radius: 50px;
                font-size: 0.8rem; font-weight: bold; margin-bottom: 20px;
            }
            .dot { height: 8px; width: 8px; background: var(--primary); border-radius: 50%; margin-right: 8px; box-shadow: 0 0 10px var(--primary); }
            h1 { margin: 0; font-size: 1.8rem; letter-spacing: 1px; }
            .desc { color: #94a3b8; margin: 10px 0 25px 0; font-size: 0.9rem; }
            .grid { display: grid; gap: 12px; }
            .item { 
                background: rgba(0,0,0,0.2); padding: 12px 18px; border-radius: 12px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 800; }
            .val { font-weight: 600; font-family: monospace; color: #f1f5f9; }
            footer { margin-top: 25px; font-size: 0.7rem; color: #475569; letter-spacing: 1px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status-badge"><span class="dot"></span> SYSTEM ONLINE</div>
            <h1>${packageInfo.name.toUpperCase()}</h1>
            <p class="desc">${packageInfo.description}</p>
            
            <div class="grid">
                <div class="item"><span class="label">Version</span><span class="val">${packageInfo.version}</span></div>
                <div class="item"><span class="label">Author</span><span class="val">${packageInfo.author}</span></div>
                <div class="item"><span class="label">Uptime</span><span class="val">${uptimeString}</span></div>
            </div>

            <footer>POWERED BY GLOBALTECHINFO</footer>
        </div>
    </body>
    </html>
    `);
});

app.get('/process', (req, res) => {
    const { send } = req.query;
    if (!send) return res.status(400).json({ error: 'Missing send query' });
    res.json({ status: 'Received', data: send });
});

app.get('/chat', (req, res) => {
    const { message, to } = req.query;
    if (!message || !to) return res.status(400).json({ error: 'Missing message or to query' });
    res.json({ status: 200, info: 'Message received (integration not implemented)' });
});

module.exports = { app, server, PORT };

