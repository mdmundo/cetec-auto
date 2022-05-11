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
        const entry = strapi.db.query("api::client.client").findOne({
          select: ["id", "description", "code", "cnpj", "email"],
          where: { email },
          populate: {
            accounts: { select: ["code", "description"] },
            furnishers: { select: ["code", "description"] },
            histories: { select: ["code", "description"] },
          },
        });

        if (entry) return entry;
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

        if (entry) return entry;
      }
    } catch (err) {
      return err;
    }
  },
}));
