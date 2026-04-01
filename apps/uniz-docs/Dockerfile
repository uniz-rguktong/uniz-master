FROM node:20-alpine
RUN apk add --no-cache openssl curl bash socat
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# Install mint cli globally for production or use npx
RUN npm install -g mint
COPY . .
EXPOSE 3333
# Ensure mint is on a non-conflicting internal port and socat bridges to 3333
# Use 127.0.0.1 explicitly for mint to avoid any external binding conflicts
CMD (mint dev --port 4000 --no-open &) && socat TCP-LISTEN:3333,fork,reuseaddr TCP:127.0.0.1:4000
