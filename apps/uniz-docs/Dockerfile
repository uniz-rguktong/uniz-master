FROM node:20-alpine
RUN apk add --no-cache openssl curl bash
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# Install mint cli globally for production or use npx
RUN npm install -g mint
COPY . .
EXPOSE 3333
CMD ["mint", "dev", "--port", "3333", "--no-open"]
