FROM node:20-alpine

RUN apk add --no-cache openssl docker-cli curl tar && \
    curl -L https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.30.0/crictl-v1.30.0-linux-amd64.tar.gz --output crictl.tar.gz && \
    tar zxvf crictl.tar.gz -C /usr/local/bin && \
    rm crictl.tar.gz
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi
RUN npm run build
CMD ["npm", "start"]
 
