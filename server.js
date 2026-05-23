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

// Processamento nativo em JavaScript Puro
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL ausente' });
    }

    // Valida se o link realmente é do YouTube para não quebrar o script
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Link do YouTube inválido' });
    }

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    try {
        // Cria o fluxo de download puxando apenas o áudio na maior qualidade disponível
        const stream = ytdl(url, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        // Grava o arquivo direto no disco do servidor do Render
        const writeStream = fs.createWriteStream(caminhoCompleto);
        stream.pipe(writeStream);

        writeStream.on('finish', () => {
            // Quando terminar de gravar, envia o link para o site baixar
            return res.json({ fileUrl: `/files/${nomeArquivo}` });
        });

        writeStream.on('error', (err) => {
            console.error("Erro na gravação do arquivo:", err);
            return res.status(500).json({ error: 'Erro ao gravar o arquivo de áudio' });
        });

    } catch (error) {
        console.error("Erro no download nativo:", error);
        return res.status(500).json({ error: 'Falha interna ao processar streaming da mídia' });
    }
});

app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
