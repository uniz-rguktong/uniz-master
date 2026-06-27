FROM node:20-alpine
RUN apk add --no-cache openssl curl bash nginx
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g mint
COPY . .
COPY nginx.conf /etc/nginx/http.d/default.conf
RUN chmod +x docker-entrypoint.sh
EXPOSE 3333
CMD ["./docker-entrypoint.sh"]
