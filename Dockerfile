# PRAKALP-DRISHTI — reproducible, air-gap-capable deployment image
#
# Two-stage: the frontend is compiled in a Node stage and only its static output is
# copied forward, so Node and node_modules never reach the runtime image.
#
# AIR-GAP NOTE: this Dockerfile pulls from npm and PyPI at BUILD time only. Build once
# on a connected machine, export with `docker save`, and load inside the secure network.
# The running container makes no outbound requests -- fonts are self-hosted, satellite
# imagery and geocodes are baked in as static artifacts, and no model calls a remote API.

# ---------- stage 1: frontend ----------
FROM node:20-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- stage 2: runtime ----------
FROM python:3.12-slim AS runtime

# libGL/libglib are required by opencv-python for image decode. Without them the
# satellite CV import fails at runtime with an opaque shared-object error.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so the layer caches independently of source changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY analytics_engine/ ./analytics_engine/
COPY modules/ ./modules/
COPY backend/ ./backend/
COPY data_pipeline/ ./data_pipeline/
COPY satellite_pipeline/ ./satellite_pipeline/
COPY paimana_extracted/ ./paimana_extracted/
COPY artifacts/ ./artifacts/
COPY --from=frontend /build/dist ./frontend/dist

# Run as non-root: government deployment baseline.
RUN useradd --create-home --uid 10001 prakalp \
    && mkdir -p /app/artifacts/briefings \
    && chown -R prakalp:prakalp /app
USER prakalp

ENV PYTHONUNBUFFERED=1 \
    PRAKALP_HOST=0.0.0.0 \
    PRAKALP_PORT=8000 \
    PRAKALP_WORKERS=1

EXPOSE 8000

# Engines build their in-memory state on first request; ~16s cold start with the
# cached force-directed layout. start-period accommodates that before probing.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=4).status==200 else 1)"

CMD ["python", "backend/server.py"]
