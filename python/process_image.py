#!/usr/bin/env python3
"""
Instagram 3-split banner generator
- free_split   → exact 1/3 cuts (no resize)
- grid_3x4     → perfect 1080×1440 centered crops (NO STRETCHING)
- square       → largest possible centered squares
Works with ANY horizontal image size.
"""

from pathlib import Path
from PIL import Image

# ================================================================
CANDIDATES = Path("candidates")
OUTPUT_ROOT = Path("split_banners")
OUTPUT_ROOT.mkdir(exist_ok=True)

# Target sizes
IG_WIDTH = 1080
IG_GRID_HEIGHT = 1440           # 3:4 ratio → current Instagram grid
ASPECT_3X4 = IG_WIDTH / IG_GRID_HEIGHT

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".gif", ".heic"}
# ================================================================

def split_free(img_path: Path, out_dir: Path):
    """Exact 1/3 vertical strips – zero changes"""
    with Image.open(img_path) as im:
        w, h = im.size
        part_w = w // 3
        im.save(out_dir / "original.jpg", quality=95, optimize=True)

        for i in range(3):
            left = i * part_w
            right = w if i == 2 else left + part_w
            part = im.crop((left, 0, right, h))
            part.save(out_dir / f"{i+1}.jpg", quality=95, optimize=True)


def split_grid_3x4(img_path: Path, out_dir: Path):
    """3 perfect 1080×1440 portraits – centered crop, NO distortion"""
    with Image.open(img_path) as im:
        w, h = im.size
        part_w = w // 3
        im.save(out_dir / "original.jpg", quality=95, optimize=True)

        for i in range(3):
            left = i * part_w
            right = w if i == 2 else left + part_w
            actual_w = right - left

            strip = im.crop((left, 0, right, h))

            # Calculate ideal crop height for 3:4 using full width
            ideal_h = int(actual_w / ASPECT_3X4)

            if ideal_h <= h:
                # We have enough height → crop vertically centered
                top = (h - ideal_h) // 2
                crop_box = (0, top, actual_w, top + ideal_h)
            else:
                # Too short → use full height, crop sides to match 3:4
                crop_w = int(h * ASPECT_3X4)
                side_margin = (actual_w - crop_w) // 2
                crop_box = (side_margin, 0, side_margin + crop_w, h)

            cropped = strip.crop(crop_box)
            final = cropped.resize((IG_WIDTH, IG_GRID_HEIGHT), Image.LANCZOS)
            final.save(out_dir / f"{i+1}.jpg", quality=95, optimize=True)


def split_square(img_path: Path, out_dir: Path):
    """3 largest possible centered squares"""
    with Image.open(img_path) as im:
        w, h = im.size
        side = min(w // 3, h)
        part_w = w // 3
        top = (h - side) // 2
        bottom = top + side

        im.save(out_dir / "original.jpg", quality=95, optimize=True)

        for i in range(3):
            left = i * part_w
            right = w if i == 2 else left + part_w

            square = im.crop((left, top, right, bottom))

            # Handle remainder pixels on the right edge
            if square.width > side:
                offset = (square.width - side) // 2
                square = square.crop((offset, 0, offset + side, side))

            square.save(out_dir / f"{i+1}.jpg", quality=95, optimize=True)


def main():
    if not CANDIDATES.exists():
        print("Error: 'candidates' folder not found!")
        return

    images = [p for p in CANDIDATES.iterdir() if p.suffix.lower() in EXTS and p.is_file()]
    if not images:
        print("No images found in 'candidates' folder.")
        return

    images.sort(key=lambda x: x.name.lower())

    print(f"Found {len(images)} image(s). Starting processing...\n")

    for img_path in images:
        print(f"→ {img_path.name}")

        base_folder = OUTPUT_ROOT / img_path.stem
        base_folder.mkdir(exist_ok=True)

        # 1. free_split
        free_dir = base_folder / "free_split"
        free_dir.mkdir(exist_ok=True)
        split_free(img_path, free_dir)

        # 2. grid_3x4 (1080×1440)
        grid_dir = base_folder / "grid_3x4"
        grid_dir.mkdir(exist_ok=True)
        split_grid_3x4(img_path, grid_dir)

        # 3. square
        sq_dir = base_folder / "square"
        sq_dir.mkdir(exist_ok=True)
        split_square(img_path, sq_dir)

        print(f"   Done → {base_folder.name}/\n")

    print("All images processed! Check the 'split_banners' folder.")
    print("   • free_split   → raw cuts")
    print("   • grid_3x4     → 1080×1440 (best for current IG grid)")
    print("   • square       → perfect squares")


if __name__ == "__main__":
    main()