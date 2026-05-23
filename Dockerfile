FROM node:18-slim

# Instala ferramentas essenciais do sistema
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Expõe a porta 3000
EXPOSE 3000
CMD ["node", "server.js"]
