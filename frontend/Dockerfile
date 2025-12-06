FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM nginx:alpine
ENV PORT=8000
EXPOSE 8000
# Nginx will listen on $PORT and serve the SPA; path fallback -> index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/client /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]