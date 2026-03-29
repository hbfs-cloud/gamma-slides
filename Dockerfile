# Stage 1: Install Node dependencies
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev

# Stage 2: Runtime with all system dependencies
FROM node:22-bookworm-slim

# Prevent Puppeteer from downloading Chromium (we use system Chromium)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install system deps: Chromium, ffmpeg, Python + edge-tts
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    ffmpeg \
    python3 \
    python3-pip \
    && pip3 install --break-system-packages edge-tts \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copy node_modules from build stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Create output directory
RUN mkdir -p /app/output

VOLUME ["/app/output"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
