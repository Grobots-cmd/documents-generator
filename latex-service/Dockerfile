FROM node:20-slim

# Install TexLive (full - includes all commonly used packages)
RUN apt-get update && apt-get install -y \
    texlive-full \
    texlive-lang-other \
    texlive-xetex \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY index.js ./

EXPOSE 3001

CMD ["node", "index.js"]
