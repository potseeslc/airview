FROM node:18

# Install Python 3, pip, and python3-full
RUN apt-get update && apt-get install -y python3 python3-pip python3-full && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Install Python requirements using --break-system-packages
COPY requirements.txt .
RUN pip3 install --break-system-packages git+https://github.com/openskynetwork/opensky-api.git#subdirectory=python && \
    pip3 install --break-system-packages requests

EXPOSE 3000
CMD ["npm", "start"]
