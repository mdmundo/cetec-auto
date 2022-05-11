module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("PUBLIC_URL"),
  app: {
    keys: env.array("APP_KEYS"),
  },
  cron: {
    enabled: env.bool("CRON_ENABLED", false),
    tasks: {
      robot: {
        task: ({ strapi }) => {
          console.log("I'm gonna call the bot right now...");
          /* Call robot with axios sending everything on queue */
          /* Robot should send another request to indicate success that will be used to clear queue */
        },
        options: {
          rule: "0 0 0 * * *",
          tz: "America/Araguaina",
        },
      },
    },
  },
});
