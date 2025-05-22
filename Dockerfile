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
ENV NODE_ENV=production

# Create client app directory and set as WORKDIR
WORKDIR /app/client-new

# Copy client package files
COPY client-new/package.json client-new/package-lock.json* ./ 
# Copy client-specific config files that might be needed at client-new root for build
COPY client-new/tsconfig.json ./
COPY client-new/config-overrides.js ./
# Copy client source code and public assets
COPY client-new/src/ ./src/
COPY client-new/public/ ./public/

# Copy shared common code. Relative path from /app/client-new to /app/common is ../common
# Ensure the tsconfig/webpack alias `solarerp: '../common'` resolves correctly.
COPY common/ ../common/ 

# Install client dependencies directly in this stage to ensure freshness
RUN npm install

# Run the client build (uses client-new/package.json scripts)
# The script is "tsc --noEmit && react-app-rewired build"
RUN CI=false DISABLE_ESLINT_PLUGIN=true npm run build

# After client build, artifacts are in /app/client-new/build.
# Reset WORKDIR to /app for any subsequent global operations or for clarity.
WORKDIR /app

# Ensure the root package.json is available in /app if needed by other parts of multi-stage build,
# though it's not directly used by this client-focused builder stage anymore.
COPY package.json ./package.json 
# The production stage will copy its own package.json from the build context.

# The primary output of this stage is /app/client-new/build


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
