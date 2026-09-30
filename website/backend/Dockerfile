FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    curl \
    unzip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (used by yt-dlp for JS challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV PATH="/root/.deno/bin:$PATH"

WORKDIR /app

# Copy and install Python requirements
COPY ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Install yt-dlp bgutil pot provider plugin
RUN pip install --no-cache-dir bgutil-ytdlp-pot-provider

# Pre-install bgutil npm package so it's ready without downloading at runtime
RUN npm install -g @imputnet/bgutil-ytdlp-pot-provider

# Pre-download rembg AI model during build (saves RAM spike on first request)
RUN mkdir -p /root/.u2net && \
    curl -L -o /root/.u2net/u2net.onnx \
    https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx || true

COPY . /app

# Make startup script executable
RUN chmod +x /app/start.sh

# Start bgutil server + FastAPI together
CMD ["/bin/sh", "/app/start.sh"]
