# Base image
FROM python:3.11-slim

# Environment settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create app directory
WORKDIR /app

# Install OS dependencies for psycopg2 and Excel support
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire app
COPY . .

# Expose Flask port
EXPOSE 5000

# Run with Gunicorn (using app.py or main.py)
# Change "main:app" → "app:app" if you're using app.py
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
