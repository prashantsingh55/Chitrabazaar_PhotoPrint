#!/bin/bash
set -e

echo "================================================================="
echo "  Chitrabazaar Production Container (Hugging Face Docker Spaces)  "
echo "  Port: ${PORT:-7860} | Host: ${HOSTNAME:-0.0.0.0}                "
echo "================================================================="

# Trap termination signals to ensure graceful shutdown of all processes
cleanup() {
  echo "-> [Chitrabazaar] Termination signal received. Stopping child processes..."
  if [ -n "$WEB_PID" ]; then
    kill -TERM "$WEB_PID" 2>/dev/null || true
  fi
  if [ -n "$WORKER_PID" ]; then
    kill -TERM "$WORKER_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo "-> [Chitrabazaar] Graceful shutdown complete. Exiting."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Run database migration check if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "-> [Chitrabazaar] Database URL detected. Running schema sync..."
  npx prisma db push --skip-generate || echo "-> [Chitrabazaar] Warning: Schema sync exited with status $?, continuing startup..."
fi

# 1. Start the Next.js Modular Monolith standalone server
echo "-> [Chitrabazaar] Launching Next.js Web Server on port ${PORT:-7860}..."
node server.js &
WEB_PID=$!

# 2. Start the Asynchronous Media & Queue Worker daemon
echo "-> [Chitrabazaar] Launching Headless Sharp Media Worker daemon..."
npx tsx src/worker/index.ts &
WORKER_PID=$!

echo "-> [Chitrabazaar] All services active: Web (PID $WEB_PID), Worker (PID $WORKER_PID)"
echo "-> [Chitrabazaar] Ready to handle photo print requests & darkroom jobs!"

# Wait for either process to terminate
wait -n "$WEB_PID" "$WORKER_PID"
EXIT_CODE=$?
echo "-> [Chitrabazaar] A child process exited with code $EXIT_CODE. Triggering container shutdown..."
cleanup
