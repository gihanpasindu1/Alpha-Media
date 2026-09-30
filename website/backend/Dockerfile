FROM ghcr.io/jim60105/yt-dlp:pot

# Switch to root to install extra packages
USER root

# Install Python, ffmpeg, and OpenCV dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python requirements
COPY ./requirements.txt requirements.txt
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

# Pre-download rembg model during build to save RAM at runtime
RUN mkdir -p /root/.u2net && \
    curl -L -o /root/.u2net/u2net.onnx \
    https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx || true

COPY . /app

# Railway injects $PORT at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
