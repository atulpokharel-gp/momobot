#!/bin/bash
set -e

echo ""
echo "========================================"
echo "   MomoBot Platform - Linux/Mac Setup"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found! Install from https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js $(node --version)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install server dependencies
echo ""
echo "[1/3] Installing server dependencies..."
cd "$SCRIPT_DIR/server" && npm install

# Install client dependencies
echo ""
echo "[2/3] Installing client dependencies..."
cd "$SCRIPT_DIR/client" && npm install

# Install agent dependencies
echo ""
echo "[3/3] Installing agent dependencies..."
cd "$SCRIPT_DIR/momobot-agent" && npm install

echo ""
echo "========================================"
echo "   Starting MomoBot Platform"
echo "========================================"
echo ""

# Start server
cd "$SCRIPT_DIR/server"
npm run dev &
SERVER_PID=$!
echo "[OK] Server started (PID: $SERVER_PID)"

sleep 2

# Start client
cd "$SCRIPT_DIR/client"
npm run dev &
CLIENT_PID=$!
echo "[OK] Client started (PID: $CLIENT_PID)"

echo ""
echo "  Server:    http://localhost:4000"
echo "  Dashboard: http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop"

trap "echo 'Stopping...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT

wait
