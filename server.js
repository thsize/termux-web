const express = require('express');
const path = require('path');
const fs = require('fs');
const ytDlp = require('yt-dlp-exec');
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

// O motor corrigido usando a biblioteca nativa
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL ausente' });
    }

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}`;
    const caminhoCompleto = path.join(downloadsDir, `${nomeArquivo}.mp3`);

    try {
        // Executa o yt-dlp interno do projeto com os mesmos parâmetros de alta qualidade
        await ytDlp(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0',
            output: path.join(downloadsDir, `${nomeArquivo}.%(ext)s`)
        });

        // Retorna o link para o cliente baixar
        return res.json({ fileUrl: `/files/${nomeArquivo}.mp3` });

    } catch (error) {
        console.error("Erro no motor yt-dlp:", error);
        return res.status(500).json({ error: 'O motor de download falhou ao processar o link' });
    }
});

app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
