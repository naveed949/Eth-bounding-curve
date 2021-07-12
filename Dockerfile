FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

#Installing app dependencies
RUN npm install

# Bundle app source
COPY . .
#Command to run tests
CMD [ "npm", "run","test" ]