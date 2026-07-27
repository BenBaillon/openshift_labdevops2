FROM node:20-alpine

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=8080
ENV APP_NAME="Coffee Shop Backend"
ENV APP_VERSION="v1"
ENV APP_ENV="container"
ENV APP_MESSAGE="Hello from Coffee Shop Backend"
ENV FAIL_MODE="false"

EXPOSE 8080

RUN chgrp -R 0 /opt/app && chmod -R g=u /opt/app

USER 1001

CMD ["npm", "start"]