FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

# Port arbitraire hors des plages utilisees par les autres exporters
# (9100 node-exporter, 8080 cAdvisor).
EXPOSE 9110

# L'exporter ne fait que lire l'API Jenkins : aucun besoin de root.
USER node

CMD ["node", "src/server.js"]
