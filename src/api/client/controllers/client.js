"use strict";

/**
 *  client controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::client.client", ({ strapi }) => ({
  async profile(ctx) {
    try {
      const email = ctx.state?.user?.email;

      if (email) {
        const entry = await strapi.db.query("api::client.client").findOne({
          select: ["email"],
          where: { email },
        });

        if (entry) {
          ctx.body = entry;
        }
      }
    } catch (err) {
      ctx.body = err;
    }
  },
}));
