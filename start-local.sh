#!/bin/bash
# Quick Start Script for Local Testing

echo "=========================================="
echo "  Polymarket Analyzer - Local Test"
echo "=========================================="
echo ""

cd /home/odedbe/polymarket-analyzer

echo "🔍 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting Frontend Development Server..."
echo ""
echo "📱 Frontend will be available at:"
echo "   http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

npm run dev
