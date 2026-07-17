# Static UniZ docs — VitePress build, nginx serve (no Mintlify)
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/.vitepress/dist /usr/share/nginx/html/docs
# Also expose at site root for probes that hit /
COPY --from=build /usr/src/app/.vitepress/dist /usr/share/nginx/html
EXPOSE 3333
CMD ["nginx", "-g", "daemon off;"]
