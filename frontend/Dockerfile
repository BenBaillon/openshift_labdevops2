FROM node:20-alpine

WORKDIR /opt/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

ENV PORT=3000
ENV FRONTEND_VERSION="v1"
ENV APP_ENV="container"
ENV BACKEND_URL="http://localhost:8080"

EXPOSE 3000

RUN chgrp -R 0 /opt/app && chmod -R g=u /opt/app

USER 1001

CMD ["npm", "start"]