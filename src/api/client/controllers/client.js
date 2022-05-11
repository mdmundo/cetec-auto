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
        ctx.query = {
          populate: "*",
          filters: { email: { $eq: email } },
        };

        const {
          data: [data],
        } = await super.find(ctx);

        return data;
      }
    } catch (err) {
      return err;
    }
  },
  async findOneByCode(ctx) {
    try {
      const { code } = ctx.params;

      if (code) {
        const entry = await strapi.db.query("api::client.client").findOne({
          select: ["email"],
          where: { code },
        });

        if (entry) {
          return entry;
        }
      }
    } catch (err) {
      return err;
    }
  },
}));
