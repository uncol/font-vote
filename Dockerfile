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
    curl -sSL -o gufo-font.css https://gf.cdn.gufolabs.com/latest/gufo-font.css && \
    FONT_PATH=$(grep -o 'GufoFont[^"\)]*\.woff2' gufo-font.css | head -n 1) && \
    curl -sSL -o GufoFont-Regular.woff2 "https://gf.cdn.gufolabs.com/latest/$FONT_PATH" && \
    sed -i "s|$FONT_PATH|GufoFont-Regular.woff2|g" gufo-font.css && \
    sed -i 's|https://gf.cdn.gufolabs.com/latest/gufo-font.css|/gufo-font.css|g' styles.css

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /data

# Expose port 80
EXPOSE 80

# Run migrations and start server
CMD npm run migrate && npm start
