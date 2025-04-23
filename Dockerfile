FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the rest of the application code first so scripts are available
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Ensure nodejs and npm are installed via apk for robustness
RUN apk add --update nodejs npm

# Install dependencies, ignoring scripts (like husky prepare) not needed in production
RUN npm install --ignore-scripts

# Build the client application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5002

# Command to run the application
CMD ["npm", "start"]
