#!/usr/bin/env python3
"""
Sans Tabac — Photo Manifest Generator
======================================
Scans the photos/ directory and generates data/photos.json.
Run automatically by GitHub Actions on every push that touches photos/.

Filename convention:
  YEAR_Constructor_Brand_[full|sans]_optional-description.ext
  e.g. 1988_McLaren_Marlboro_full_monaco-pitlane.jpg
       1994_Williams_Rothmans_sans_france-qualifying.jpg

Rules:
  - YEAR       : 4-digit year (1984–2005)
  - Constructor: Team name, spaces as hyphens (e.g. BAR-Honda)
  - Brand      : Tobacco brand, spaces as hyphens (e.g. Lucky-Strike, John-Player-Special)
  - Livery     : exactly "full" or "sans"
  - Description: optional, anything, hyphens become spaces in display
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path

PHOTOS_DIR = Path(__file__).parent.parent / "photos"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "photos.json"
SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Canonical constructor names (case-insensitive match → display name)
CONSTRUCTOR_ALIASES = {
    "mclaren": "McLaren",
    "ferrari": "Ferrari",
    "williams": "Williams",
    "lotus": "Lotus",
    "benetton": "Benetton",
    "bar": "BAR Honda",
    "bar-honda": "BAR Honda",
    "tyrrell": "Tyrrell",
    "renault": "Renault",
    "jordan": "Jordan",
    "arrows": "Arrows",
    "minardi": "Minardi",
    "prost": "Prost",
    "ligier": "Ligier",
    "brabham": "Brabham",
    "toleman": "Toleman",
    "march": "March",
    "lola": "Lola",
    "footwork": "Footwork",
    "sauber": "Sauber",
    "stewart": "Stewart",
    "jaguar": "Jaguar",
    "toyota": "Toyota",
    "honda": "Honda",
}

BRAND_ALIASES = {
    "marlboro": "Marlboro",
    "jps": "John Player Special",
    "john-player-special": "John Player Special",
    "johnplayerspecial": "John Player Special",
    "rothmans": "Rothmans",
    "camel": "Camel",
    "west": "West",
    "lucky-strike": "Lucky Strike",
    "luckystrike": "Lucky Strike",
    "gauloises": "Gauloises",
    "mild-seven": "Mild Seven",
    "mildseven": "Mild Seven",
    "benson-hedges": "Benson & Hedges",
    "benson-and-hedges": "Benson & Hedges",
    "elf": "Elf",
    "winston": "Winston",
    "555": "555",
    "reemtsma": "Reemtsma",
    "viceroy": "Viceroy",
    "ambassador": "Ambassador",
}

ERRORS = []

def parse_filename(stem):
    """Parse a filename stem into metadata. Returns dict or None."""
    parts = stem.split("_")
    if len(parts) < 4:
        ERRORS.append(f"  ✗ Too few parts (need at least 4): {stem}")
        return None

    year_str, constructor_raw, brand_raw, livery_raw = parts[0], parts[1], parts[2], parts[3]
    description_raw = "_".join(parts[4:]) if len(parts) > 4 else ""

    # Year
    if not re.match(r"^\d{4}$", year_str):
        ERRORS.append(f"  ✗ Invalid year '{year_str}': {stem}")
        return None
    year = int(year_str)
    if not (1950 <= year <= 2030):
        ERRORS.append(f"  ✗ Year out of range ({year}): {stem}")
        return None

    # Constructor
    constructor_key = constructor_raw.lower()
    constructor = CONSTRUCTOR_ALIASES.get(constructor_key, constructor_raw.replace("-", " ").title())

    # Brand
    brand_key = brand_raw.lower()
    brand = BRAND_ALIASES.get(brand_key, brand_raw.replace("-", " ").title())

    # Livery type
    livery = livery_raw.lower()
    if livery not in ("full", "sans"):
        ERRORS.append(f"  ✗ Livery must be 'full' or 'sans', got '{livery_raw}': {stem}")
        return None

    # Description
    description = description_raw.replace("-", " ").strip() if description_raw else ""

    return {
        "year": year,
        "constructor": constructor,
        "brand": brand,
        "livery": livery,
        "description": description,
    }


def main():
    print(f"\nSans Tabac — Manifest Generator")
    print(f"Scanning: {PHOTOS_DIR}\n")

    if not PHOTOS_DIR.exists():
        print("⚠  photos/ directory not found. Creating it.")
        PHOTOS_DIR.mkdir(parents=True)

    photos = []
    skipped = 0
    processed = 0

    for f in sorted(PHOTOS_DIR.iterdir()):
        if f.suffix.lower() not in SUPPORTED_EXTS:
            continue
        if f.name.startswith(".") or f.name.startswith("_"):
            continue

        meta = parse_filename(f.stem)
        if meta is None:
            skipped += 1
            continue

        # Get file size and modification time
        stat = f.stat()
        added = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")

        photo = {
            "id": f.stem,
            "file": f"photos/{f.name}",
            "year": meta["year"],
            "constructor": meta["constructor"],
            "brand": meta["brand"],
            "livery": meta["livery"],
            "description": meta["description"],
            "added": added,
        }
        photos.append(photo)
        processed += 1
        print(f"  ✓ {f.name}")

    # Sort by year desc, then constructor
    photos.sort(key=lambda p: (-p["year"], p["constructor"]))

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as fh:
        json.dump(photos, fh, indent=2)

    print(f"\n{'─'*40}")
    print(f"✓ Manifest written to {OUTPUT_FILE}")
    print(f"  {processed} photos indexed, {skipped} skipped")

    if ERRORS:
        print(f"\nErrors ({len(ERRORS)}):")
        for e in ERRORS:
            print(e)
        print("\nFilename format: YEAR_Constructor_Brand_[full|sans]_description.jpg")

    # Print summary stats for the manifest
    if photos:
        years = sorted(set(p["year"] for p in photos))
        constructors = sorted(set(p["constructor"] for p in photos))
        brands = sorted(set(p["brand"] for p in photos))
        print(f"\nArchive stats:")
        print(f"  Years: {years[0]}–{years[-1]}")
        print(f"  Constructors: {', '.join(constructors)}")
        print(f"  Brands: {', '.join(brands)}")
        full = sum(1 for p in photos if p["livery"] == "full")
        sans = sum(1 for p in photos if p["livery"] == "sans")
        print(f"  Full livery: {full} | Sans tabac: {sans}")


if __name__ == "__main__":
    main()
