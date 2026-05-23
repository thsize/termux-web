const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());

// Entrega a pasta principal onde vai ficar o index.html
app.use(express.static(path.join(__dirname)));

// Pasta temporária para armazenar as músicas processadas
const downloadsDir = path.join(__dirname, 'public_downloads');
if (!fs.existsSync(downloadsDir)){
    fs.mkdirSync(downloadsDir);
}

// Rota principal: Entrega o arquivo index.html separado
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint da API: Executa o comando de terminal do Termux nos bastidores
app.post('/api/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL ausente' });
    }

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    // Comando mestre do yt-dlp
    const comandoBash = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${caminhoCompleto}" "${url}"`;

    exec(comandoBash, (error, stdout, stderr) => {
        if (error) {
            console.error("Erro no terminal:", error);
            return res.status(500).json({ error: 'Não foi possível extrair a mídia' });
        }

        // Devolve o link do arquivo estático gerado para o front-end baixar
        return res.json({ fileUrl: `/files/${nomeArquivo}` });
    });
});

// Torna a pasta de downloads acessível para o navegador baixar o MP3
app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
