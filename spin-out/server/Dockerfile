FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --workspaces
EXPOSE 4000
CMD ["npm", "run", "dev", "--workspace=server"]
