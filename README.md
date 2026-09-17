# SaveFrom YouTube – Free Video Downloader

A modern, fast YouTube video downloader that supports MP4 (video) and MP3 (audio) downloads in multiple qualities (360p to 4K).

## Features

- **Multiple Formats**: Download as MP4 video or MP3 audio
- **Quality Selection**: 360p, 480p, 720p, 1080p, and 4K where available
- **Current download API**: Uses a Cobalt instance you operate or are authorized to use
- **Handles Restricted Videos**: Works with age-gated, private (if accessible), and region-locked videos
- **No Registration**: 100% free, no sign-up required
- **Modern UI**: Dark theme with smooth animations
- **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

**Frontend:**
- Pure HTML5, CSS3, JavaScript (no frameworks)
- Modern CSS with animations and responsive design
- Accessible (ARIA labels, keyboard navigation)

**Backend (Serverless API):**
- Node.js with Vercel Serverless Functions
- Cobalt API connected to an instance you operate or are authorized to use

## How It Works

1. User pastes YouTube URL
2. Frontend sends request to backend API (`/api/download`)
3. Backend requests a download URL from the configured Cobalt instance
4. Backend returns the download URL to the frontend
5. User clicks download to save the file

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and set `COBALT_API_URL`. Do not use the
   retired public `api.cobalt.tools/api/json` endpoint: Cobalt requires an instance
   you operate or whose owner has granted you API access. Set `COBALT_API_KEY` too
   when that instance uses API-key authentication.
4. Start development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Deployment to Vercel

**One-Click Deploy:**

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com) and sign in with GitHub
3. Click "New Project"
4. Import your `SaveFrom-Youtube` repository
5. Click "Deploy"

Vercel will automatically:
- Detect the `vercel.json` configuration
- Install dependencies from `package.json`
- Deploy both frontend and backend API
- Provide a live URL (e.g., `https://your-project.vercel.app`)

Before deploying, add `COBALT_API_URL` (and, if needed, `COBALT_API_KEY`) under
**Project Settings → Environment Variables**. These values are server-only and
must never be added to `index.html`.

**Manual Deploy via CLI:**
```bash
npm i -g vercel
vercel --prod
```

## Project Structure

```
/
├── index.html           # Frontend (single-page app)
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment config
├── .gitignore          # Git ignore rules
└── api/
    └── index.js        # Backend serverless function
```

## API Endpoint

**GET** `/api/download?url={youtubeUrl}&format={format}&quality={quality}`

**Parameters:**
- `url` (required): YouTube video URL
- `format` (optional): `mp4` (video) or `mp3` (audio), default: `mp4`
- `quality` (optional): `360`, `480`, `720`, `1080`, `max`, or `best`, default: `720`

**Response:**
```json
{
  "success": true,
  "url": "https://download.example.com/video.mp4",
  "filename": "video.mp4",
  "source": "Cobalt",
  "quality": "720"
}
```

## License

MIT License – Free for personal and commercial use.

## Disclaimer

This tool is for personal use only. Please respect YouTube's Terms of Service and content creators' rights. Only download videos that you have permission to download.
