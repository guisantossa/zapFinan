# build
FROM node:18 as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
 