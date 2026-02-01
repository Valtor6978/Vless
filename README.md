# ⚡ VLESS Converter Pro

A free, open-source tool that converts VLESS subscription URLs into individual ready-to-use configs.

> 🌐 **Live Demo:** [http://shadowtechteam.ir/](http://shadowtechteam.ir/)

---

## What Does It Do?

Given a VLESS subscription URL (JSON or Base64), this tool:

- Fetches the subscription server-side — no CORS issues
- Extracts every VLESS outbound config automatically
- Converts each one into a valid, copyable VLESS URI
- Names each config with a unique emoji: `🚀 Made By Valtor 1`

---

## Two Versions, One Tool

This repo includes two fully identical versions of the same application. Pick whichever fits your hosting:

| Version | Best For | Hosting |
|---|---|---|
| **Python (Flask)** | VPS, Liara, Railway, Render | Any platform that runs Python |
| **PHP** | Shared hosting, cPanel | Any server with PHP 7.0+ |

Both versions share the same UI, the same logic, and the same features. The only difference is the backend language.

---

## 🐍 Python Version

### Project Structure

```
python/
├── main.py                 ← Flask app (backend + routes)
├── requirements.txt        ← Python dependencies
├── static/
│   ├── style.css           ← Styles
│   └── script.js           ← Frontend logic
└── templates/
    └── index.html          ← Main page
```

### Requirements

- Python 3.7 or higher
- pip

### How to Run

**Step 1 — Install dependencies**

```bash
pip install -r requirements.txt
```

**Step 2 — Start the server**

```bash
python main.py
```

**Step 3 — Open in browser**

```
http://localhost:5000
```

That's it. The server starts on port `5000` by default. If that port is taken, set the `PORT` environment variable:

```bash
PORT=5000 python main.py
```

### Deploy to Liara

1. Push the `python/` folder contents to your repo
2. Create a new Python app on [Liara](https://liara.ir)
3. Set the start command to `python main.py`
4. Deploy — Liara handles the `PORT` variable automatically

### Deploy to Railway / Render

Same as Liara. The app reads `PORT` from the environment, so it works on any PaaS out of the box.

---

## 🛠️ PHP Version

### Project Structure

```
php/
├── index.html              ← Main page
├── api.php                 ← Backend API (handles fetch + conversion)
├── .htaccess               ← Apache config (compression, caching, security)
└── assets/
    ├── css/
    │   └── style.css       ← Styles
    └── js/
        └── script.js       ← Frontend logic
```

### Requirements

- PHP 7.0 or higher
- cURL extension enabled
- Any web server (Apache / Nginx)

### How to Run Locally

If you have PHP installed, you can use the built-in development server:

```bash
cd php/
php -S localhost:8000
```

Then open:

```
http://localhost:8000
```

No extra setup needed. No database. No config files.

### Deploy to cPanel (Shared Hosting)

**Step 1 — Log into cPanel → File Manager**

**Step 2 — Go to `public_html`**

**Step 3 — Create the folder structure**

```
public_html/
├── index.html
├── api.php
├── .htaccess
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

**Step 4 — Upload files**

Upload each file into its correct folder. Make sure `.htaccess` is in the root (`public_html/`), not inside `assets/`.

**Step 5 — Done**

Visit `https://yourdomain.com` — it should work immediately.

> ⚠️ If the page loads but conversion fails, check that **cURL is enabled** in your PHP. Go to cPanel → *Select PHP Version* → *Extensions* → enable `curl`.

### Deploy to a Subdirectory

If you want it at `yourdomain.com/converter` instead of the root:

1. Create a folder called `converter` inside `public_html`
2. Upload everything into that folder
3. Visit `https://yourdomain.com/converter`

---

## ✨ Features

- **Search** — filter configs by name or URI in real time
- **Filter by type** — WebSocket, gRPC, TCP, TLS / Reality
- **Copy All** — copies every config to clipboard in one click
- **Download** — exports all configs as a `.txt` file
- **Custom prefix** — replace the default name with your own
- **Location flags** — shows country flags when detectable from the config
- **Config details** — toggle to see IP, port, network type, and security
- **Expand / Collapse** — open or close all cards at once
- **Keyboard shortcuts** — `Ctrl+K` search, `Ctrl+A` copy all, `Esc` clear
- **Caching** — repeated requests to the same URL are cached for 5 minutes
- **Mobile first** — designed and tested on mobile from the start

---

## 🔧 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Blank page | PHP not running | Make sure your server supports PHP |
| "Failed to fetch" | cURL disabled or firewall | Enable cURL, or check outgoing connections |
| Configs not appearing | Invalid subscription URL | Double-check the URL in your browser first |
| Timeout | Subscription server is slow | Wait and retry — the timeout is 15 seconds |
| Copy doesn't work | Browser permission | Allow clipboard access when prompted |

---

## 📁 Repo Structure

```
VLESS-Converter-Pro/
├── python/                 ← Python (Flask) version
│   ├── main.py
│   ├── requirements.txt
│   ├── static/
│   └── templates/
├── php/                    ← PHP version
│   ├── index.html
│   ├── api.php
│   ├── .htaccess
│   └── assets/
└── README.md               ← This file
```

---

## 🌐 Live

The hosted version is available at:

**[http://shadowtechteam.ir/](http://shadowtechteam.ir/)**

---

## 📜 License

MIT — use it, modify it, deploy it, do whatever you want.

---

*Made with 💜 by Valtor*
