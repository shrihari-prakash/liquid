FROM node:alpine
LABEL org.opencontainers.image.source=https://github.com/shrihari-prakash/liquid
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src /app/src
RUN ls -a
RUN npm ci
RUN npm run build
RUN npm prune --production
EXPOSE 2000
CMD [ "node", "./build/index.js" ]
