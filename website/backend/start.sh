#!/bin/sh
# Start the bgutil PO token server in the background on port 4416
npx --yes @imputnet/bgutil-ytdlp-pot-provider serve &

# Wait a moment for the server to start
sleep 3

# Start the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
