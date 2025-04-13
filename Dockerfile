FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the rest of the application code first so scripts are available
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Install dependencies
RUN npm install --production

# Build the client application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5002

# Command to run the application
CMD ["npm", "start"]
