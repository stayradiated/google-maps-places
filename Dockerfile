FROM node:16.16.0-alpine as node

RUN apk add --no-cache chromium

WORKDIR /app
COPY ./dist/ ./

RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

USER pptruser

ENTRYPOINT ["node", "./index.js"]
