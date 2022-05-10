# URL must be passed as --build-arg
FROM strapi/base
WORKDIR /app
COPY package.json package.json
RUN ["yarn", "--no-lockfile"]
COPY . .
ARG URL
ENV NODE_ENV=production
RUN ["yarn", "build"]
EXPOSE 1337
CMD ["yarn", "start"]
