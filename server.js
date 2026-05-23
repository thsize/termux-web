const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());

// Pasta temporária para armazenar as músicas processadas
const downloadsDir = path.join(__dirname, 'public_downloads');
if (!fs.existsSync(downloadsDir)){
    fs.mkdirSync(downloadsDir);
}

// Rota principal: Entrega a interface estilo Termux
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Termux Web Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'JetBrains Mono', monospace; }
        .command-line::before { content: "$ "; color: #3b82f6; }
    </style>
</head>
<body class="bg-black text-green-400 min-h-screen p-3 md:p-6 flex flex-col justify-between">

    <div class="w-full max-w-4xl mx-auto flex-grow flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div class="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
            <div class="flex space-x-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span class="text-xs text-zinc-500 font-bold">termux@localhost:~</span>
            <div class="w-10"></div>
        </div>

        <div id="terminalConsole" class="p-4 flex-grow overflow-y-auto text-sm space-y-2 h-[60vh] max-h-[500px]">
            <p class="text-zinc-500">Welcome to Termux Web Environment!</p>
            <p class="text-zinc-500">Initializing yt-dlp core architecture...</p>
            <p class="text-white command-line">pkg install ffmpeg yt-dlp -y <span class="text-green-500">[INSTALLED]</span></p>
            <p class="text-zinc-400">> Aguardando entrada de dados...</p>
        </div>

        <div class="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row gap-2">
            <div class="flex items-center space-x-2 flex-grow bg-black px-3 py-2 border border-zinc-800 rounded">
                <span class="text-blue-500 font-bold">~ $</span>
                <input type="text" id="urlInput" placeholder="Cole o link do YouTube aqui..." 
                    class="bg-transparent border-none outline-none text-green-400 w-full placeholder-zinc-700">
            </div>
            <button onclick="executarTermux()" id="btnRun"
                class="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2 rounded transition-all uppercase text-xs tracking-wider">
                Executar
            </button>
        </div>
    </div>

    <script>
        async function executarTermux() {
            const input = document.getElementById('urlInput');
            const consoleBox = document.getElementById('terminalConsole');
            const btn = document.getElementById('btnRun');
            const url = input.value.trim();

            if (!url) return;

            // Bloqueia interface durante execução
            btn.disabled = true;
            input.disabled = true;

            // Atualiza tela simulando o comando entrando
            consoleBox.innerHTML += \`<p class="text-blue-400 mt-4 command-line">cd /sdcard/Download && yt-dlp -x --audio-format mp3 "\${url}"</p>\`;
            consoleBox.innerHTML += \`<p class="text-yellow-500">> [INFO] Iniciando requisição paralela no child_process...</p>\`;
            consoleBox.scrollTop = consoleBox.scrollHeight;

            try {
                const response = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });

                const data = await response.json();

                if (response.ok && data.fileUrl) {
                    consoleBox.innerHTML += \`<p class="text-green-500">> [SUCCESS] Extração de áudio concluída a 320kbps.</p>\`;
                    consoleBox.innerHTML += \`<p class="text-white">> Disparando download do arquivo gerado para o navegador...</p>\`;
                    
                    // Inicia download direto do arquivo gerado pelo servidor
                    window.location.href = data.fileUrl;
                } else {
                    consoleBox.innerHTML += \`<p class="text-red-500">> [ERROR] Terminal retornou erro de execução: \${data.error}</p>\`;
                }
            } catch (err) {
                consoleBox.innerHTML += \`<p class="text-red-500">> [CRITICAL] Falha na conexão de rede com o terminal remoto.</p>\`;
            } finally {
                btn.disabled = false;
                input.disabled = false;
                input.value = '';
                consoleBox.scrollTop = consoleBox.scrollHeight;
            }
        }
    </script>
</body>
</html>
    `);
});

// Endpoint da API: Executa o comando de terminal do Termux nos bastidores
app.post('/api/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL ausente' });
    }

    const idUnico = Date.now();
    const nomeArquivo = `audio_\${idUnico}.mp3`;
    const caminhoCompleto = path.join(downloadsDir, nomeArquivo);

    // O mesmo comando que você testou e funcionou no Termux original
    const comandoBash = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "\${caminhoCompleto}" "\${url}"`;

    exec(comandoBash, (error, stdout, stderr) => {
        if (error) {
            console.error(\`Erro no terminal: \${error}\`);
            return res.status(500).json({ error: 'Não foi possível extrair a mídia' });
        }

        // Devolve o link do arquivo estático gerado para o front-end baixar
        return res.json({ fileUrl: `/files/\${nomeArquivo}` });
    });
});

// Torna a pasta de downloads acessível para o navegador baixar o MP3
app.use('/files', express.static(downloadsDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Servidor ativo na porta \${PORT}\`));
