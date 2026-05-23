FROM node:18-slim

# Instala Python e dependências necessárias para o terminal e yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
