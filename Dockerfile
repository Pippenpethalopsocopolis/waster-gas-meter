FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

#CMD ["node", "--loader", "ts-node/esm", "src/index.ts"]
#CMD ["nodemon", "--exec", "tsx", "src/index.ts"]
CMD ["npx", "tsx", "src/index.ts"]