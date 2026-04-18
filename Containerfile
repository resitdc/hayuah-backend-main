FROM node:20-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY .npmrc.build .npmrc 
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN rm .npmrc

COPY . .
RUN pnpm build
RUN cp -r src/emailTemplates dist/src/emailTemplates

FROM node:20-slim
WORKDIR /app
COPY tsconfig.json ./ 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

EXPOSE 4002

CMD ["npm", "run", "prod:start"] 