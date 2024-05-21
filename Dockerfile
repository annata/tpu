FROM node:alpine
ENV TZ Asia/Shanghai
WORKDIR /data
COPY . .
RUN yarn install
CMD ["node","index.js"]