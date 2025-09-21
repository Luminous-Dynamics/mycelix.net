# Multi-stage Docker build for Mycelix Holochain
FROM rust:1.75 as builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    protobuf-compiler \
    libprotobuf-dev \
    cmake \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install wasm target
RUN rustup target add wasm32-unknown-unknown

# Install Holochain tools
RUN cargo install --version 0.3.0 holochain
RUN cargo install --version 0.3.0 holochain_cli_bundle

WORKDIR /build

# Copy source code
COPY mycelix-dna/ ./mycelix-dna/
COPY gateway/ ./gateway/

# Build DNA
WORKDIR /build/mycelix-dna
RUN cargo build --release --target wasm32-unknown-unknown
RUN hc dna pack . -o mycelix.dna

# Build gateway
WORKDIR /build/gateway
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 mycelix

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /build/mycelix-dna/mycelix.dna ./
COPY --from=builder /build/gateway/target/release/mycelix-gateway ./
COPY --from=builder /usr/local/cargo/bin/holochain /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/hc /usr/local/bin/

# Copy configuration
COPY conductor-config.yaml ./
COPY run.sh ./
RUN chmod +x run.sh mycelix-gateway

# Create data directories
RUN mkdir -p holochain-data lair-keystore && \
    chown -R mycelix:mycelix /app

USER mycelix

# Expose ports
EXPOSE 8765 8888 4444

# Environment variables
ENV RUST_LOG=info
ENV HOLOCHAIN_CONDUCTOR_URL=ws://localhost:8888
ENV HOLOCHAIN_APP_ID=mycelix

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8765/health || exit 1

# Start services
CMD ["./run.sh"]