# ---- Base Stage (for common setup) ----
FROM node:18-alpine AS base
WORKDIR /app
# NODE_ENV is set to production by default in many node images,
# but explicitly setting it here for clarity in subsequent stages.
# It will be production in the final stage.
# For builder stage, it might be overridden or doesn't strictly matter as much.


# ---- Dependencies Stage ----
# Install all dependencies for both client and server
FROM base AS deps
# Or unset, to ensure devDependencies are installed
ENV NODE_ENV=development

# Install client dependencies
COPY client-new/package.json client-new/package-lock.json* ./client-new/
RUN cd client-new && npm ci

# Install server dependencies (including dev for build stage)
COPY package.json package-lock.json* ./
RUN npm ci


# ---- Builder Stage ----
# Build the client application
FROM base AS builder
# Set to production for the build script if it respects it
ENV NODE_ENV=production

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client-new/node_modules ./client-new/node_modules

# Copy client source code
COPY client-new/ ./client-new/
# Copy server source code and root package.json (needed for the "build" script)
COPY src/ ./src/
COPY common/ ./common/
COPY package.json ./

# Run the build script from root package.json
# This script is "cd client-new && CI=false npm install && CI=false npm run build"
RUN npm run build


# ---- Production Stage ----
# Create the final lean image
FROM base AS production
ENV NODE_ENV=production

# Copy server package files for production dependencies
COPY package.json package-lock.json* ./
# Install ONLY production server dependencies, ignore scripts as in original Dockerfile
# Using --omit=dev is the modern equivalent of --production
RUN npm ci --omit=dev --ignore-scripts

# Copy built client application from builder stage
COPY --from=builder /app/client-new/build ./client-new/build

# Copy server-side application code from the original build context
COPY src/ ./src/
COPY common/ ./common/
# This ensures src/index.js and src/scripts/verify-build.js are included for the start command.

EXPOSE 5002

# Command to run the application
CMD ["npm", "start"]
