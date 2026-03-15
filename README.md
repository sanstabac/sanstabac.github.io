# Sans Tabac — Formula One Tobacco Livery Archive

A static photo archive for GitHub Pages. Upload images with structured filenames and they automatically populate the site.

---

## Quickstart

### 1. Fork / clone this repository

### 2. Enable GitHub Pages
Settings → Pages → Source: **Deploy from branch** → Branch: `main`, folder: `/ (root)`

### 3. Add photos
Drop image files into the `photos/` directory and push. A GitHub Action will automatically regenerate `data/photos.json`.

---

## Filename Convention

Images must follow this pattern exactly:

```
YEAR_Constructor_Brand_[full|sans]_optional-description.jpg
```

| Part | Description | Examples |
|------|-------------|---------|
| `YEAR` | 4-digit season year | `1988`, `2005` |
| `Constructor` | Team name, hyphens for spaces | `McLaren`, `BAR-Honda`, `Lotus` |
| `Brand` | Tobacco brand, hyphens for spaces | `Marlboro`, `Lucky-Strike`, `John-Player-Special` |
| `full` or `sans` | Whether tobacco branding is visible | `full` = ads shown, `sans` = ads hidden/removed |
| `description` | Optional, hyphens become spaces | `monaco-pitlane`, `qualifying-session` |

### Examples

```
1988_McLaren_Marlboro_full_monaco-pitlane.jpg
1994_Williams_Rothmans_sans_france-qualifying.jpg
2005_Ferrari_Marlboro_sans_european-gp-scrutineering.jpg
1984_Lotus_John-Player-Special_full.jpg
1999_BAR-Honda_Lucky-Strike_full_pit-stop.jpg
```

### Supported formats

`.jpg` `.jpeg` `.png` `.webp` `.gif`

---

## How It Works

```
photos/                         ← Drop images here
  1988_McLaren_Marlboro_full.jpg
  1994_Williams_Rothmans_sans.jpg
  ...

↓  (GitHub Action runs on push)

data/photos.json                ← Auto-generated index

↓  (Browser reads JSON)

index.html  → live stats, constructor/year/brand grids
browse.html → filterable photo grid, lightbox
```

### URL parameters for browse.html

| URL | Shows |
|-----|-------|
| `browse.html` | All photos |
| `browse.html?constructor=McLaren` | McLaren only |
| `browse.html?year=1994` | 1994 season |
| `browse.html?brand=Marlboro` | Marlboro sponsored cars |
| `browse.html?livery=sans` | Sans Tabac liveries only |
| `browse.html?livery=full` | Full livery only |
| `browse.html?q=monaco` | Search across all fields |
| `browse.html?group=constructor` | Grouped by team |
| `browse.html?group=year` | Grouped by year |
| `browse.html?group=brand` | Grouped by brand |

---

## Generating the Manifest Locally

If you want to regenerate `data/photos.json` without pushing:

```bash
python scripts/generate-manifest.py
```

Requires Python 3.6+, no dependencies.

---

## Adding a New Constructor or Brand

The manifest generator automatically handles unknown names (capitalising them). To add a canonical alias, edit the `CONSTRUCTOR_ALIASES` or `BRAND_ALIASES` dictionaries in `scripts/generate-manifest.py`.

---

## Repository Structure

```
sans-tabac/
├── index.html                  ← Homepage
├── browse.html                 ← Photo grid / filter page
├── js/
│   └── app.js                  ← Shared utilities
├── data/
│   └── photos.json             ← Auto-generated, do not edit by hand
├── photos/
│   └── .gitkeep                ← Drop images here
├── scripts/
│   └── generate-manifest.py   ← Manifest generator
└── .github/
    └── workflows/
        └── generate-manifest.yml  ← GitHub Action
```

---

## Copyright

All photographs remain the property of their respective creators. This site provides an index only. Not affiliated with Formula One Group, any constructor, or any tobacco company.
