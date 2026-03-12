FROM node:20-alpine
RUN apk add --no-cache openssl docker-cli crictl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi
RUN npm run build
CMD ["npm", "start"]
 
