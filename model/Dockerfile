FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY model/requirements.txt ./model/requirements.txt
RUN pip install --no-cache-dir -r model/requirements.txt

COPY assets/ ./assets/
COPY model/ ./model/

EXPOSE 8001

ENV PYTHONPATH=/app

CMD ["python", "model/api.py"]
