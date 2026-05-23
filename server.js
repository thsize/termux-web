const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const downloadsDir = path.join(__dirname, 'public_downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

app.get('/health', (req, res) => res.status(200).send('OK'));

app.post('/api/download', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL necessária' });

    const id = Date.now();
    const nome = `audio_${id}.mp3`;
    const destino = path.join(downloadsDir, nome);

    // O user-agent é essencial para evitar o bloqueio 403 do YouTube
    const comando = `yt-dlp --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -x --audio-format mp3 -o "${destino}" "${url}"`;

    exec(comando, (error, stdout, stderr) => {
        if (error) {
            console.error("ERRO:", stderr);
            return res.status(500).json({ error: 'Falha no download' });
        }
        res.json({ fileUrl: `/files/${nome}` });
    });
});

app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando em 0.0.0.0:${PORT}`));
