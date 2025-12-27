# Build context should be the frontend directory
# Example: docker build -f Dockerfile -t frontend .
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
# Copy package files
COPY package.json pnpm-lock.yaml ./
# Install dependencies (localeeditor will be installed from GitHub)
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
# Copy package files and lockfile
COPY package.json pnpm-lock.yaml ./
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source files
COPY . .
# Build the frontend
RUN pnpm run build

FROM nginx:alpine
ENV PORT=8000
EXPOSE 8000
# Nginx will listen on $PORT and serve the SPA; path fallback -> index.html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/client /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]