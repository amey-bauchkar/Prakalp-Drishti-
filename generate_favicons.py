import os
import io
import base64
from PIL import Image, ImageDraw

def generate_favicons():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_path = os.path.join(base_dir, 'frontend', 'public', 'logos', 'prakalp_drishti_emblem.png')
    public_dir = os.path.join(base_dir, 'frontend', 'public')

    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found")
        return

    src = Image.open(src_path).convert('RGBA')
    w, h = src.size
    dim = max(w, h)

    # Square canvas with transparent background
    sq = Image.new('RGBA', (dim, dim), (255, 255, 255, 0))
    offset_x = (dim - w) // 2
    offset_y = (dim - h) // 2
    sq.paste(src, (offset_x, offset_y))

    # Center of emblem in square canvas
    cx = offset_x + 508.5
    cy = offset_y + 497.0
    radius = 492.0

    # Antialiased circular mask
    mask = Image.new('L', (dim * 2, dim * 2), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((int((cx - radius) * 2), int((cy - radius) * 2), int((cx + radius) * 2), int((cy + radius) * 2)), fill=255)
    mask = mask.resize((dim, dim), Image.Resampling.LANCZOS)

    master = sq.copy()
    master.putalpha(mask)

    # 1. Save master 512x512
    im512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    im512.save(os.path.join(public_dir, 'favicon-512x512.png'), 'PNG', optimize=True)
    im512.save(os.path.join(public_dir, 'favicon.png'), 'PNG', optimize=True)

    # 2. 192x192 (PWA)
    im192 = master.resize((192, 192), Image.Resampling.LANCZOS)
    im192.save(os.path.join(public_dir, 'favicon-192x192.png'), 'PNG', optimize=True)

    # 3. 180x180 (Apple Touch Icon)
    im180 = master.resize((180, 180), Image.Resampling.LANCZOS)
    im180.save(os.path.join(public_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)

    # 4. 48x48
    im48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    im48.save(os.path.join(public_dir, 'favicon-48x48.png'), 'PNG', optimize=True)

    # 5. 32x32
    im32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    im32.save(os.path.join(public_dir, 'favicon-32x32.png'), 'PNG', optimize=True)

    # 6. 16x16
    im16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    im16.save(os.path.join(public_dir, 'favicon-16x16.png'), 'PNG', optimize=True)

    # 7. Multi-resolution ICO (16, 32, 48, 64)
    master.save(os.path.join(public_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    # 8. High-resolution SVG embedding the 512x512 PNG
    buf = io.BytesIO()
    im512.save(buf, format='PNG', optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="512" height="512" />
</svg>
'''
    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    # 9. site.webmanifest
    manifest_content = '''{
  "name": "PRAKALP-DRISHTI — MoSPI Central Sector Mega-Projects Decision Intelligence",
  "short_name": "PRAKALP-DRISHTI",
  "description": "MoSPI Central Sector Mega-Projects Decision Intelligence System for Cabinet Secretariat, PMO, and MoSPI.",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#1E2A45",
  "background_color": "#F7F8FA",
  "display": "standalone",
  "start_url": "/"
}
'''
    with open(os.path.join(public_dir, 'site.webmanifest'), 'w', encoding='utf-8') as f:
        f.write(manifest_content)

    print("Successfully generated all favicon assets from official emblem logo!")

if __name__ == '__main__':
    generate_favicons()
