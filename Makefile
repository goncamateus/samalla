.PHONY: dev build check install uninstall hooks clean

# ── Development ──────────────────────────────────────────────────────────────

dev:
	npm run tauri dev

build:
	npm run tauri build

# ── Local CI (mirrors .github/workflows/ci.yml) ───────────────────────────

check:
	@echo "▶ cargo check"
	@cargo check --manifest-path src-tauri/Cargo.toml --quiet
	@echo "▶ clippy"
	@cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
	@echo "▶ tsc"
	@npx tsc --noEmit
	@echo "✓ all checks passed"

# ── Desktop install ───────────────────────────────────────────────────────

install:
	@bash install.sh

uninstall:
	@rm -f ~/.local/bin/samalla
	@rm -f ~/.local/share/applications/samalla.desktop
	@rm -f ~/.local/share/icons/hicolor/32x32/apps/samalla.png
	@rm -f ~/.local/share/icons/hicolor/128x128/apps/samalla.png
	@rm -f ~/.local/share/icons/hicolor/256x256/apps/samalla.png
	@update-desktop-database ~/.local/share/applications 2>/dev/null || true
	@echo "✓ samalla uninstalled"

# ── Git hooks ────────────────────────────────────────────────────────────

hooks:
	@mkdir -p .git/hooks
	@cp .githooks/pre-push .git/hooks/pre-push
	@chmod +x .git/hooks/pre-push
	@echo "✓ pre-push hook installed — 'make check' will run before every push"

# ── Cleanup ──────────────────────────────────────────────────────────────

clean:
	cargo clean --manifest-path src-tauri/Cargo.toml
	rm -rf dist
