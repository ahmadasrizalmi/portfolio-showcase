# Portfolio Showcase Chrome Extension

Create beautiful portfolio galleries from your photos. Generate shareable HTML pages.

## Features

- Create multiple portfolio galleries
- Drag-drop photo upload
- Auto-resize photos to 1200px width
- Generate self-contained HTML gallery page
- Lightbox photo viewer
- Export as downloadable HTML file
- Brand name customization
- No server needed - works entirely client-side
- Apple-style UI (light theme, no AI slop)

## Install

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `portfolio-showcase` folder

## Usage

1. Click extension icon → Side panel opens
2. Click "+ New" to create portfolio
3. Enter title, description, brand name
4. Drag-drop photos or click to select
5. Click "Save"
6. Click "Export HTML" to download
7. Open HTML file in browser or host it

## Generated HTML

The exported HTML file is:
- Self-contained (all photos embedded as base64)
- Responsive (works on mobile + desktop)
- Has lightbox viewer (click photo to enlarge)
- Apple-style design
- No external dependencies

## Hosting

You can host the HTML file on:
- Cloudflare Pages (recommended)
- GitHub Pages
- Any static hosting
- Or just share the HTML file directly

## Tech

- Chrome Extension Manifest V3
- Canvas API for image resizing
- FileReader API for base64 encoding
- chrome.downloads for file export
- No external dependencies
