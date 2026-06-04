# Base image
FROM node:22-alpine

ENV NODE_OPTIONS=--max_old_space_size=2048

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

RUN npm run db:migrate

# Start the server using the production build
CMD [ "node", "dist/src/main.js" ]
