# Dockerfile otimizado para Easypanel
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --no-audit --no-fund

# Copy source
COPY . .

# Build args
ARG VITE_API_URL=https://synca-api.aucta.tech
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_REDIRECT_URI
ARG VITE_GOOGLE_SECRET
ARG GIT_SHA

# Set env vars for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_REDIRECT_URI=$VITE_GOOGLE_REDIRECT_URI
ENV VITE_GOOGLE_SECRET=$VITE_GOOGLE_SECRET

# Build app
RUN npm run build

# Production image
FROM nginx:alpine

# Install curl for health check
RUN apk add --no-cache curl

# Create basic nginx config
RUN cat > /etc/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        # Health check
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        # API proxy
        location /api/ {
            proxy_pass https://api.kronaai.tech/api/;
            proxy_set_header Host api.kronaai.tech;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_ssl_verify off;
        }

        # Static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]