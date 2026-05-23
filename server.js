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

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    // COMANDO REAL DO TERMINAL LINUX
    const comando = `yt-dlp -x --audio-format mp3 -o "${caminhoCompleto}" "${url}"`;

    exec(comando, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'Falha ao baixar' });
        return res.json({ fileUrl: `/files/${nomeArquivo}` });
    });
});

app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Terminal rodando na porta ${PORT}`));
