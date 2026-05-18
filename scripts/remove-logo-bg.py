"""
Remove solid background from OVA logos so they blend with navbar.
- ova-logo-dark.png: black background -> transparent
- ova-logo-light.png: black background -> transparent (white navbar)
Requires: pip install Pillow
"""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install Pillow")
    raise

PUBLIC = Path(__file__).resolve().parent.parent / "client" / "public" / "images"


def remove_black_bg(path: Path, threshold: int = 30) -> None:
    """Make black/near-black pixels transparent."""
    img = Image.open(path).convert("RGBA")
    data = img.getdata()
    new = []
    for (r, g, b, a) in data:
        if r <= threshold and g <= threshold and b <= threshold:
            new.append((r, g, b, 0))
        else:
            new.append((r, g, b, a))
    img.putdata(new)
    img.save(path, "PNG")
    print(f"Removed black bg: {path.name}")


def remove_white_bg(path: Path, threshold: int = 245) -> None:
    """Make white/near-white pixels transparent."""
    img = Image.open(path).convert("RGBA")
    data = img.getdata()
    new = []
    for (r, g, b, a) in data:
        if r >= threshold and g >= threshold and b >= threshold:
            new.append((r, g, b, 0))
        else:
            new.append((r, g, b, a))
    img.putdata(new)
    img.save(path, "PNG")
    print(f"Removed white bg: {path.name}")


def main():
    dark = PUBLIC / "ova-logo-dark.png"
    light = PUBLIC / "ova-logo-light.png"
    if not dark.exists():
        print(f"Missing: {dark}")
        return
    if not light.exists():
        print(f"Missing: {light}")
        return
    remove_black_bg(dark)
    remove_black_bg(light)  # light logo also has black rect on white navbar
    print("Done.")


if __name__ == "__main__":
    main()
