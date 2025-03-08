FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the client application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5002

# Command to run the application
CMD ["npm", "start"]
