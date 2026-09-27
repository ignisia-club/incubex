# INCUBEX 2026

Static site for INCUBEX, Ignisia’s national tech launchpad at MIT-WPU, Pune.

## Run locally

```bash
python3 -m http.server 43123 --bind 0.0.0.0
```

Open http://127.0.0.1:43123

After changing a Tailwind class in `index.html`, rebuild the stylesheet:

```bash
npm run build:css
```
