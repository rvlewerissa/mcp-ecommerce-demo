# Use Ubuntu as base for better Python/Node compatibility
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18.18.0
ENV PYTHON_VERSION=3.11

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    software-properties-common \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Playwright system dependencies and additional Camoufox requirements
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libatspi2.0-0 \
    libxss1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Create non-root user first
RUN groupadd -r mcp && useradd -r -g mcp -m -d /home/mcp -s /bin/bash mcp

# Install Node.js dependencies
RUN npm ci --only=production

# Switch to mcp user and install Python packages in user space
USER mcp

# Install Python dependencies for Camoufox in user space
RUN pip3 install --user --no-cache-dir "playwright==1.53.0" \
 && pip3 install --user --no-cache-dir "camoufox[geoip]==0.4.11"

# Fetch Camoufox browser binary as mcp user
RUN python3 -m camoufox fetch

# Add user's Python bin to PATH
ENV PATH="/home/mcp/.local/bin:$PATH"

# Switch back to root to copy files
USER root

# Copy test script for triggering downloads
COPY test_imports.py ./

# Switch back to mcp user to trigger downloads
USER mcp

# Pre-download browserforge data files as mcp user
RUN python3 test_imports.py || echo "Browserforge data download completed with warnings"

# Switch back to root for final setup
USER root

# Copy source code and startup script
COPY src/ ./src/
COPY start.sh ./
RUN chmod +x start.sh \
    && chown -R mcp:mcp /app \
    && chmod -R 755 /app

# Switch to non-root user
USER mcp

# Expose any ports if needed (though MCP typically uses stdio)
# EXPOSE 3000

# Set the default command to run the MCP server
CMD ["./start.sh"]