FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi
RUN npm run build
CMD ["npm", "start"]
 
