FROM --platform=linux/amd64 node:20-alpine

WORKDIR /app

# Install Python and build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code and migrations
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY scripts ./scripts
COPY export ./export
COPY public/ ./public/
COPY tsconfig.json ./

# Download gufo-font files from CDN and update styles.css
RUN cd public && \
     curl -sL -o gufo-font.css https://gf.cdn.gufolabs.com/latest/gufo-font.css && \
     curl -sL -o GufoFont-Regular.woff2 https://github.com/gufolabs/gufo_font/raw/main/webfonts/GufoFont-Regular.woff2 && \
    sed -i 's|https://gf.cdn.gufolabs.com/latest/gufo-font.css|/gufo-font.css|g' styles.css

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /data

# Expose port 80
EXPOSE 80

# Run migrations and start server
CMD npm run migrate && npm start
