#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_BIN="$HOME/.local/bin/samalla"
ICON_DIR="$HOME/.local/share/icons/hicolor"
DESKTOP_DIR="$HOME/.local/share/applications"

# Pick the best available binary
if [[ -f "$REPO_DIR/src-tauri/target/release/samalla" ]]; then
    BIN="$REPO_DIR/src-tauri/target/release/samalla"
    echo "→ Using release build"
elif [[ -f "$REPO_DIR/src-tauri/target/debug/samalla" ]]; then
    BIN="$REPO_DIR/src-tauri/target/debug/samalla"
    echo "→ Using debug build (run 'make build' for a release binary)"
else
    echo "No binary found. Run 'make build' first."
    exit 1
fi

mkdir -p "$HOME/.local/bin" \
         "$ICON_DIR/32x32/apps" \
         "$ICON_DIR/128x128/apps" \
         "$ICON_DIR/256x256/apps" \
         "$DESKTOP_DIR"

install -m 755 "$BIN" "$INSTALL_BIN"
cp "$REPO_DIR/src-tauri/icons/32x32.png"     "$ICON_DIR/32x32/apps/samalla.png"
cp "$REPO_DIR/src-tauri/icons/128x128.png"   "$ICON_DIR/128x128/apps/samalla.png"
cp "$REPO_DIR/src-tauri/icons/128x128@2x.png" "$ICON_DIR/256x256/apps/samalla.png"

cat > "$DESKTOP_DIR/samalla.desktop" << 'EOF'
[Desktop Entry]
Name=samalla
Comment=llama.cpp desktop GUI — load, chat, monitor
Exec=samalla
Icon=samalla
Terminal=false
Type=Application
Categories=Utility;Science;
Keywords=llama;ai;llm;chat;
EOF

update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true

echo "✓ samalla installed to $INSTALL_BIN"
echo "  Search for 'samalla' in your app launcher, or just run: samalla"
