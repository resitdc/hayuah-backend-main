FROM node:20-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

RUN --mount=type=secret,id=npm_token \
  export NPM_TOKEN=$(cat /run/secrets/npm_token) && \
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
  echo "@resitdc:registry=https://npm.pkg.github.com" >> .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
  pnpm install --frozen-lockfile && \
  rm -f .npmrc

COPY . .
RUN pnpm build

FROM node:20-slim
WORKDIR /app
COPY tsconfig.json ./ 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

EXPOSE 10001

CMD ["npm", "run", "prod:start"] 