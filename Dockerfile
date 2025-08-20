FROM node:20-alpine

WORKDIR /app

# Install server dependencies first for better layer caching
COPY package*.json ./
ENV NODE_ENV=production
RUN npm install --production

# Copy source code
COPY . .

# Optionally build the client application (skipped by default)
ARG SKIP_CLIENT_BUILD=true
RUN if [ "$SKIP_CLIENT_BUILD" = "true" ]; then \
      echo "Skipping client build"; \
    else \
      npm run build; \
    fi

EXPOSE 5002
CMD ["npm", "start"]
