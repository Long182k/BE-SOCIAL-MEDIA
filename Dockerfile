# Use Node.js v20.15.0 as the base image
FROM node:20.15.0-alpine

# Install OpenSSL and other necessary build dependencies
RUN apk add --no-cache openssl libc6-compat

# Install pnpm globally
RUN npm install -g pnpm@9.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with no frozen lockfile to avoid issues
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start:prod"] 