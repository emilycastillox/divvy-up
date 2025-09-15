# Production Dockerfile for Server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/server/ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
