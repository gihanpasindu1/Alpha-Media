#!/bin/sh
# Start the bgutil PO token server in the background on port 4416
echo "Starting bgutil PO token server..."
cd /root/bgutil-ytdlp-pot-provider/server/node_modules || exit 1
deno run --allow-env --allow-net --allow-ffi=. --allow-read=. ../src/main.ts &

# Wait a moment for the server to start
sleep 3

# Go back to app and start FastAPI
cd /app
echo "Starting FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
