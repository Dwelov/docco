#!/usr/bin/env bash
# Start the dataset-showcase app with zero friction.
# Usage: ./start.sh [--dev|--prod] [--port N] [--no-install] [--help]
set -euo pipefail

MODE="dev"
PORT="${PORT:-3000}"
DO_INSTALL=1

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --dev          Run 'next dev' (default)
  --prod         Build then run 'next start' (production mode)
  --port N       Port to listen on (default: \$PORT or 3000)
  --no-install   Skip dependency install check
  -h, --help     Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev) MODE="dev"; shift ;;
    --prod) MODE="prod"; shift ;;
    --port) PORT="${2:?--port needs a value}"; shift 2 ;;
    --port=*) PORT="${1#--port=}"; shift ;;
    --no-install) DO_INSTALL=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

# Resolve app dir: ./start.sh lives at repo root, app in ./dataset-showcase.
# If copied inside the app dir, fall back to the script's own directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/dataset-showcase"
if [[ ! -f "$APP_DIR/package.json" ]]; then
  if [[ -f "$SCRIPT_DIR/package.json" ]]; then
    APP_DIR="$SCRIPT_DIR"
  else
    echo "ERROR: cannot find app (looked in $APP_DIR and $SCRIPT_DIR)" >&2
    exit 1
  fi
fi
cd "$APP_DIR"

# --- 1. Toolchain checks -------------------------------------------------
if ! command -v node >/dev/null 2>&1; then echo "ERROR: node not found. Install Node.js 20+." >&2; exit 1; fi
if ! command -v npm >/dev/null 2>&1; then echo "ERROR: npm not found." >&2; exit 1; fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "ERROR: Node 20+ required, found $(node --version)." >&2
  exit 1
fi

# --- 2. Dependencies (missing or stale -> install) ------------------------
needs_install=0
if [[ ! -d node_modules || ! -x node_modules/.bin/next ]]; then
  needs_install=1
elif [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
  needs_install=1
fi
if [[ "$DO_INSTALL" -eq 1 && "$needs_install" -eq 1 ]]; then
  echo "Installing dependencies..."
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
elif [[ "$needs_install" -eq 1 ]]; then
  echo "WARNING: dependencies look stale (lockfile newer than node_modules). Run without --no-install to fix." >&2
fi

# --- 3. Env check (warn only: Phase 1 fixture needs no env) ----------------
if [[ ! -f .env.local && ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    echo "NOTE: no .env or .env.local found. Phase 1 runs without env; for Phase 2+ copy .env.example to .env.local and fill values."
  fi
fi

# --- 4. Port handling (in use -> next free port) ---------------------------
port_in_use() { (command -v ss >/dev/null && ss -ltnH 2>/dev/null | grep -q ":$1 ") || (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
if port_in_use "$PORT"; then
  ORIG="$PORT"
  for _ in $(seq 1 20); do
    PORT=$((PORT + 1))
    if ! port_in_use "$PORT"; then break; fi
  done
  if port_in_use "$PORT"; then echo "ERROR: no free port near $ORIG." >&2; exit 1; fi
  echo "Port $ORIG in use, using $PORT instead."
fi
export PORT

# --- 5. Run ----------------------------------------------------------------
cleanup() { :; }
trap cleanup INT TERM

echo "Starting dataset-showcase ($MODE) in $APP_DIR on http://localhost:$PORT"
if [[ "$MODE" == "prod" ]]; then
  npm run build
  exec npm run start -- --port "$PORT"
else
  exec npm run dev -- --port "$PORT"
fi
