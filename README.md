# Jellyfin Media Scanner

A lightweight Node.js application to quickly trigger library scans on your Jellyfin server.

## Features
- 🚀 Fast library scanning via Jellyfin API
- 🧹 Automatic title cleaning using configurable Regex
- 📱 Mobile-friendly interface

## Prerequisites
- Node.js (v16 or higher)
- A running Jellyfin instance
- A Jellyfin API Key
- A TMDB API Key

## Installation
```bash
git clone https://github.com/moiko89/jellyfin-scanner.git
cd jellyfin-scanner
npm install
npm install express axios dotenv
```

## Configuration
Create a .env file:
```bash
JELLYFIN_URL=http://your-ip:8096
JELLYFIN_API_KEY=your_jellyfin_key
TMDB_API_KEY=your_tmdb_key
TMDB_LANG=de-DE #en-US
JUNK_KEYWORDS=deluxe|ext|fan|edition|steelbook|collector|collection|remastered|extended|cut|uncut|version|box|set|limitierte|limited|special|jubiläums|bluray|blu-ray|dvd
PORT=3000
```

## Usage
Start with:
```bash
node index.js
```
Or with PM2:
```bash
pm2 start index.js --name "jellyfin-scanner"
```

## Using Docker Compose
Clone this repo, edit the .env-file with your data.
Run ``docker compose build`` and then run ``docker compose up -d`` in the directory.
Your jellyfin-scanner should be reachable on ``http(s)://your-name-or-ip:3000``
