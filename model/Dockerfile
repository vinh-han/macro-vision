FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install uv

COPY ./requirements.txt .

RUN uv pip install --system --only-binary true --no-cache-dir -r requirements.txt ;\
    rm -rf /root/.cache/uv

COPY ./ ./model/

EXPOSE 8001

ENV PYTHONPATH=/app

CMD ["python", "model/api.py"]
