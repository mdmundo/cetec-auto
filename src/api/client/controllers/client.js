"use strict";

/**
 *  client controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { parseMultipartData } = require("@strapi/utils");

module.exports = createCoreController("api::client.client", ({ strapi }) => ({
  async profile(ctx) {
    try {
      const email = ctx.state?.user?.email;

      if (email) {
        const entry = strapi.db.query("api::client.client").findOne({
          where: { email },
        });

        if (entry) return entry;
      }
    } catch (err) {
      console.error(err);
      throw new Error("Could'nt fetch profile");
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
      console.error(err);
      throw new Error("Could'nt find client");
    }
  },
  async createWithSheets(ctx) {
    try {
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);

        // É obrigatório o envio dos dados abaixo
        if (
          data.code &&
          data.email &&
          files.contas &&
          files.historicosContabeis
        ) {
          const hasClient = await strapi.db
            .query("api::client.client")
            .findOne({
              where: { code: data.code },
            });

          const matchEmail = hasClient?.email === data.email;

          const clientData = await strapi
            .service("api::client.client")
            .populateFromSheets(
              files.contas.path,
              files.historicosContabeis.path
            );

          if (!hasClient) {
            const client = await strapi.entityService.create(
              "api::client.client",
              {
                data: {
                  code: data.code,
                  email: data.email,
                  ...clientData,
                },
              }
            );

            return client.id;
          } else if (!matchEmail) {
            const client = await strapi.entityService.update(
              "api::client.client",
              hasClient.id,
              { data: { email: data.email, ...clientData } }
            );

            return client.id;
          } else {
            await strapi.entityService.update(
              "api::client.client",
              hasClient.id,
              { data: clientData }
            );

            return hasClient.id;
          }
        }
      }
    } catch (err) {
      console.error(err);
      throw new Error("Could'nt create client");
    }
  },
}));
