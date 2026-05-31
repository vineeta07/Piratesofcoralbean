FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm config set fetch-retry-maxtimeout 600000 && npm install

# Copy all files
COPY . .

# Build the Next.js app
RUN npm run build

EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]
