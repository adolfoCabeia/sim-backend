FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl tzdata

ENV TZ=Africa/Luanda


FROM base AS deps

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

RUN npm run build

FROM base AS production

ENV NODE_ENV=production
ENV TZ=Africa/Luanda

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY --from=build /app/dist ./dist

COPY --from=build /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/server.js"]