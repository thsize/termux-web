FROM node:18-slim

# Instala pacotes do sistema
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install --upgrade yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
