FROM node:20-alpine

WORKDIR /app

# Install Python and build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

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

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /data

# Expose port 80
EXPOSE 80

# Run migrations and start server
CMD npm run migrate && npm start
