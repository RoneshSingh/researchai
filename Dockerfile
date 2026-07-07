FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Playwright Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium and its system dependencies inside the container
RUN playwright install --with-deps chromium

COPY . .

EXPOSE 8000

ENV PORT=8000

# Start FastAPI server
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
