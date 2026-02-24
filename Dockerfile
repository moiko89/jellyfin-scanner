# Dockerfile
FROM node:18-alpine

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Pakete kopieren (ohne node_modules)
COPY package*.json ./
COPY .env ./

# Abhängigkeiten installieren
RUN npm install

# Restliche Dateien kopieren
COPY . .

# Public-Ordner kopieren
COPY public/ ./public/

# Port freigeben
EXPOSE 3000

# Container starten
CMD ["node", "server.js"]
