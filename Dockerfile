# Build stage
# Node 24 ships npm 11, which reads this repo's lockfileVersion-3
# package-lock.json cleanly. npm 10 (node:20-alpine) rejects it as out of sync
# over transitive @emnapi/* optional deps.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG CONFIG=production
RUN npm run build -- --configuration=$CONFIG

# Production stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/orthoflow-front/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
