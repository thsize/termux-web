const express = require('express');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const downloadsDir = path.join(__dirname, 'public_downloads');
if (!fs.existsSync(downloadsDir)){
    fs.mkdirSync(downloadsDir);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url || !ytdl.validateURL(url)) return res.status(400).json({ error: 'Link inválido' });

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    try {
        const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
        const writeStream = fs.createWriteStream(caminhoCompleto);
        stream.pipe(writeStream);
        writeStream.on('finish', () => res.json({ fileUrl: `/files/${nomeArquivo}` }));
        writeStream.on('error', (err) => res.status(500).json({ error: 'Erro no stream' }));
    } catch (error) {
        res.status(500).json({ error: 'Falha no servidor' });
    }
});

app.use('/files', express.static(downloadsDir));

// A MUDANÇA CRUCIAL ESTÁ AQUI:
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
