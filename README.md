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

## Installation
```bash
git clone https://github.com/moiko89/jellyfin-scanner.git
cd jellyfin-scanner
npm install
```

## Configuration
Create a .env file:
```bash
JELLYFIN_URL=http://your-ip:8096
JELLYFIN_API_KEY=your_key
JUNK_REGEX=/(\[.*?\]|\(.*?\)|1080p|720p|WEB-DL|x264|x265)/gi
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
