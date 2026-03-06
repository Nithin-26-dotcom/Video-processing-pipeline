FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "worker.js"]