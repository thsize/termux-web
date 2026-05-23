const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

// Configurações básicas
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Garante que a pasta de downloads exista
const downloadsDir = path.join(__dirname, 'public_downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Rota de Health Check (Necessária para o Back4app não matar o container)
app.get('/health', (req, res) => res.status(200).send('OK'));

// Rota principal da página
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de Download
app.post('/api/download', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL necessária' });

    const idUnico = Date.now();
    const nomeArquivo = `audio_${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    // Executa o comando yt-dlp do sistema Linux
    // O --no-cache-dir e --geo-bypass ajudam a contornar bloqueios do YouTube
    const comando = `yt-dlp -x --audio-format mp3 --no-cache-dir --geo-bypass -o "${caminhoCompleto}" "${url}"`;

    console.log(`[TERMINAL] Executando: ${comando}`);

    exec(comando, (error, stdout, stderr) => {
        if (error) {
            console.error("[ERRO DO TERMINAL]:", stderr);
            return res.status(500).json({ error: 'Falha ao processar download via yt-dlp' });
        }
        
        console.log(`[SUCESSO] Arquivo gerado: ${nomeArquivo}`);
        return res.json({ fileUrl: `/files/${nomeArquivo}` });
    });
});

// Servir arquivos baixados
app.use('/files', express.static(downloadsDir));

// Porta dinâmica (Obrigatória para o Back4app)
const PORT = process.env.PORT || 3000;

// O '0.0.0.0' é fundamental para o container aceitar requisições externas
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ativo e ouvindo em 0.0.0.0:${PORT}`);
});
