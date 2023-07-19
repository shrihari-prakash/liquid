# First Stage: Install Dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY gulpfile.js ./
COPY src /app/src
RUN ls -a
RUN npm ci
RUN npm run build
RUN npm prune --production

# Second Stage: Run Application
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=base /app .
EXPOSE 2000
CMD [ "node", "./build/index.js" ]