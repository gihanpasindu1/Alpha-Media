FROM python:3.10-slim

# Install system dependencies (ffmpeg is essential for video/audio processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the requirements and install them
COPY ./requirements.txt requirements.txt
# --no-cache-dir saves RAM and disk space during the Docker build
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Pre-download the rembg AI model so it doesn't spike RAM during the first user request
RUN mkdir -p /root/.u2net && \
    curl -L -o /root/.u2net/u2net.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx

# Copy the rest of the application
COPY . /app

# Railway dynamically injects a $PORT environment variable. 
# We run Uvicorn with a single worker (default) to keep RAM usage well under 500MB.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
