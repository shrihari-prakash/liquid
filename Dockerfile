# First Stage: Install Dependencies
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY gulpfile.js ./
COPY src /app/src
RUN npm ci
RUN npm run build
RUN npm prune --production

# Second Stage: Run Application
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=base /app/build .
COPY --from=base /app/node_modules ./node_modules
EXPOSE 2000
CMD [ "node", "./index.js" ]