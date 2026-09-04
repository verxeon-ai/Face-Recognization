# AegisAI Frontend (Next.js)

Premium React/TypeScript UI for the AegisAI video threat platform.

The Flask app remains the API / MJPEG / ML backend. This frontend is the active operator interface.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- lucide-react icons
- qrcode.react

## Run (development)

Terminal 1 — backend (from repo root):

```bash
source venv/bin/activate
python app.py
```

Terminal 2 — UI:

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # if node was installed locally
cd frontend
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

Phone camera QR uses HTTPS proxy: `https://<LAN-IP>:5443/mobile-cam` (accept the certificate once).

## Production UI build

```bash
cd frontend
npm run build
npm run start
```

## Route map

| UI route | Purpose |
|----------|---------|
| `/` | System Hub |
| `/soc` | SOC Threat Triage |
| `/multi-camera` | Multi-Camera Wall |
| `/live-face` | Live Face Cam |
| `/mobile-streamer` | Laptop phone streamer + QR |
| `/mobile-cam` | Phone capture page |
| `/image-triage` | Image upload analysis |
| `/video-scanner` | Video batch analysis |
| `/audit-trail` | Alert audit log |
| `/persons` | Known identities |
| `/persons/add` | Register person |

Legacy Flask HTML routes redirect to these Next.js pages.
