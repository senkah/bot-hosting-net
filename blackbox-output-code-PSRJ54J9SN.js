const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client();
let qrCode = '';
let isRunning = false;
let logs = ['Bot belum dimulai.'];

client.on('qr', (qr) => {
    qrCode = qr;
    logs.push('QR code generated. Scan dengan WhatsApp.');
    console.log('Scan QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isRunning = true;
    logs.push('Bot WA siap!');
    console.log('Bot ready!');
});

client.on('message', (msg) => {
    logs.push(`Pesan dari ${msg.from}: ${msg.body}`);
});

client.on('disconnected', () => {
    isRunning = false;
    logs.push('Bot terputus.');
});

// API
app.get('/status', (req, res) => res.json({ running: isRunning, qr: qrCode }));

app.post('/start', (req, res) => {
    if (!isRunning) {
        client.initialize();
        logs.push('Bot dimulai.');
        res.json({ message: 'Bot dimulai.' });
    } else {
        res.json({ message: 'Bot sudah running.' });
    }
});

app.post('/stop', (req, res) => {
    if (isRunning) {
        client.destroy();
        isRunning = false;
        logs.push('Bot dihentikan.');
        res.json({ message: 'Bot dihentikan.' });
    } else {
        res.json({ message: 'Bot sudah stop.' });
    }
});

app.get('/logs', (req, res) => res.json({ logs }));

app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    if (isRunning && number && message) {
        try {
            await client.sendMessage(`${number}@c.us`, message);
            logs.push(`Pesan dikirim ke ${number}: ${message}`);
            res.json({ success: true });
        } catch (err) {
            logs.push(`Error: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    } else {
        res.status(400).json({ error: 'Bot tidak running atau data tidak lengkap.' });
    }
});

app.listen(3001, () => console.log('Backend running on port 3001'));