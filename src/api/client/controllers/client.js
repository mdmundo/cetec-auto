"use strict";

/**
 *  client controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { parseMultipartData } = require("@strapi/utils");
const XLSX = require("xlsx");

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
  async createWithXLSX(ctx) {
    try {
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);

        // É obrigatório o envio do email e do code.
        if (data.code && data.email) {
          const contas = XLSX.readFile(files.contas.path);
          const historicosContabeis = XLSX.readFile(
            files.historicosContabeis.path
          );

          const hasClient = await strapi.db
            .query("api::client.client")
            .findOne({
              where: { code: data.code },
            });

          const matchEmail = hasClient?.email === data.email;

          const { accounts, furnishers, histories } = await populateFromSheets(
            contas,
            historicosContabeis
          );

          if (!hasClient) {
            const clientDescription = contas.Preamble["F1"].v;
            const clientCNPJ = contas.Preamble["F2"].v;

            const client = await strapi.entityService.create(
              "api::client.client",
              {
                data: {
                  code: data.code,
                  email: data.email,
                  description: clientDescription,
                  cnpj: clientCNPJ,
                },
              }
            );

            await strapi.entityService.update("api::client.client", client.id, {
              data: {
                accounts,
                furnishers,
                histories,
              },
            });

            return client.id;
          } else if (!matchEmail) {
            const client = await strapi.entityService.update(
              "api::client.client",
              hasClient.id,
              { data: { email: data.email } }
            );

            await strapi.entityService.update("api::client.client", client.id, {
              data: {
                accounts,
                furnishers,
                histories,
              },
            });

            return client.id;
          } else {
            await strapi.entityService.update(
              "api::client.client",
              hasClient.id,
              {
                data: {
                  accounts,
                  furnishers,
                  histories,
                },
              }
            );

            return hasClient.id;
          }
        }
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  },
}));

const populateFromSheets = async (contas, historicosContabeis) => {
  const sheetAccounts = Array.from(
    { length: contas.Preamble["!rows"].length },
    (v, i) =>
      contas.Preamble[`H${i + 1}`]?.v?.match(/^1\.1\.01\.00[1-2]\.\d{3}$/) && {
        code: contas.Preamble[`A${i + 1}`].v,
        description: contas.Preamble[`P${i + 1}`].v,
      }
  ).filter((account) => account?.code && account?.description);

  const sheetFurnishers = Array.from(
    { length: contas.Preamble["!rows"].length },
    (v, i) =>
      contas.Preamble[`H${i + 1}`]?.v?.match(/^2\.1\.01\.00[2-6]\.\d{3}$/) && {
        code: contas.Preamble[`A${i + 1}`].v,
        description: contas.Preamble[`P${i + 1}`].v,
      }
  ).filter((furnisher) => furnisher?.code && furnisher?.description);

  const sheetHistories = Array.from(
    { length: historicosContabeis.Preamble["!rows"].length },
    (v, i) =>
      !isNaN(historicosContabeis.Preamble[`A${i + 1}`]?.v) && {
        code: historicosContabeis.Preamble[`A${i + 1}`].v,
        description: historicosContabeis.Preamble[`C${i + 1}`].v,
      }
  ).filter((history) => history?.code && history?.description);

  return {
    accounts: sheetAccounts,
    furnishers: sheetFurnishers,
    histories: sheetHistories,
  };
};
