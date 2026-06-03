# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG CONFIG=production
RUN npm run build -- --configuration=$CONFIG

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist/orthoflow-front/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
