FROM node:20-alpine

WORKDIR /app

# Salin seluruh sumber aplikasi (server.js zero-dependency Node core, jadi tidak perlu npm install)
COPY . .

# Coolify akan mengarahkan volume ke /data
ENV NODE_ENV=production \
    PORT=5533 \
    DATA_DIR=/data \
    UPLOADS_DIR=/data/uploads

EXPOSE 5533

CMD ["node", "server.js"]
