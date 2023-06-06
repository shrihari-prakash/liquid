FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY gulpfile.js ./
COPY src /app/src
RUN ls -a
RUN npm ci
RUN npm run build
RUN npm prune --production
EXPOSE 2000
CMD [ "node", "./build/index.js" ]
