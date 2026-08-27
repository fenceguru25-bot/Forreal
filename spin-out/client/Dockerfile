FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --workspaces
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace=client", "--", "--host", "0.0.0.0"]
