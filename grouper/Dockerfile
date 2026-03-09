FROM python:3.11.15-slim AS main
WORKDIR /ai/grouper
COPY ./grouper/requirements.txt ./
RUN pip install -r requirements.txt
COPY ./grouper .
WORKDIR /ai
COPY ./.env ./
COPY ./assets  ./assets
CMD [ "python", "-m", "grouper.main" ]
