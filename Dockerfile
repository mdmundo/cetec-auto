# PUBLIC_URL must be passed as --build-arg
FROM strapi/base
WORKDIR /app
COPY package.json package.json
RUN ["yarn", "--no-lockfile"]
COPY . .
ARG PUBLIC_URL
ARG NODE_ENV
RUN ["yarn", "build"]
EXPOSE 1337
CMD ["yarn", "start"]
