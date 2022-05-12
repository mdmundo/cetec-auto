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

          // const hasClient = await strapi.services.client.findOne({
          //   code: data.code,
          // });

          const hasClient = await strapi.db
            .query("api::client.client")
            .findOne({
              where: { code: data.code },
            });

          const matchEmail = hasClient?.email === data.email;

          if (!hasClient) {
            const clientDescription = contas.Preamble["F1"].v;
            const clientCNPJ = contas.Preamble["F2"].v;

            // const client = await strapi.services.client.create({
            //   code: data.code,
            //   email: data.email,
            //   description: clientDescription,
            //   cnpj: clientCNPJ,
            // });

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

            // await populateFromSheets(contas, historicosContabeis, client);

            return client.id;
          } else if (!!hasClient && matchEmail) {
            // await populateFromSheets(contas, historicosContabeis, hasClient);

            return hasClient.id;
          } else if (!!hasClient) {
            // const client = await strapi.services.client.update(
            //   { id: hasClient.id },
            //   { email: data.email }
            // );

            const client = await strapi.entityService.update(
              "api::client.client",
              hasClient.id,
              { data: { email: data.email } }
            );

            // await populateFromSheets(contas, historicosContabeis, client);

            return client.id;
          }
        }
      }

      async function populateFromSheets(contas, historicosContabeis, client) {
        // Conta
        const dbAccounts = await strapi.services.account.find({
          _limit: "-1",
          _sort: "code:ASC",
          client: client.id,
        });

        const sheetAccounts = Array.from(
          { length: contas.Preamble["!rows"].length },
          (v, i) =>
            contas.Preamble[`H${i + 1}`]?.v?.match(
              /^1\.1\.01\.00[1-2]\.\d{3}$/
            ) && {
              code: contas.Preamble[`A${i + 1}`].v,
              description: contas.Preamble[`P${i + 1}`].v,
              client: client.id,
            }
        ).filter((account) => account?.code && account?.description);

        const toInsertAccounts = sheetAccounts.filter(
          ({ code: codeA }) =>
            !dbAccounts.some(({ code: codeB }) => codeA === codeB)
        );

        if (toInsertAccounts.length !== 0) {
          await strapi
            .query("account")
            .model.query((qb) => {
              qb.insert(toInsertAccounts);
            })
            .fetch();
        }

        // Fornecedor
        const dbFurnishers = await strapi.services.furnisher.find({
          _limit: "-1",
          _sort: "code:ASC",
          client: client.id,
        });

        const sheetFurnishers = Array.from(
          { length: contas.Preamble["!rows"].length },
          (v, i) =>
            contas.Preamble[`H${i + 1}`]?.v?.match(
              /^2\.1\.01\.00[2-6]\.\d{3}$/
            ) && {
              code: contas.Preamble[`A${i + 1}`].v,
              description: contas.Preamble[`P${i + 1}`].v,
              client: client.id,
            }
        ).filter((furnisher) => furnisher?.code && furnisher?.description);

        const toInsertFurnishers = sheetFurnishers.filter(
          ({ code: codeA }) =>
            !dbFurnishers.some(({ code: codeB }) => codeA === codeB)
        );

        if (toInsertFurnishers.length !== 0) {
          await strapi
            .query("furnisher")
            .model.query((qb) => {
              qb.insert(toInsertFurnishers);
            })
            .fetch();
        }

        // Histórico
        const dbHistories = await strapi.services.history.find({
          _limit: "-1",
          _sort: "code:ASC",
          client: client.id,
        });

        const sheetHistories = Array.from(
          { length: historicosContabeis.Preamble["!rows"].length },
          (v, i) =>
            !isNaN(historicosContabeis.Preamble[`A${i + 1}`]?.v) && {
              code: historicosContabeis.Preamble[`A${i + 1}`].v,
              description: historicosContabeis.Preamble[`C${i + 1}`].v,
              client: client.id,
            }
        ).filter((history) => history?.code && history?.description);

        const toInsertHistories = sheetHistories.filter(
          ({ code: codeA }) =>
            !dbHistories.some(({ code: codeB }) => codeA === codeB)
        );

        if (toInsertHistories.length !== 0) {
          await strapi
            .query("history")
            .model.query((qb) => {
              qb.insert(toInsertHistories);
            })
            .fetch();
        }
      }
    } catch (err) {
      console.log(
        "🚀 ~ file: client.js ~ line 204 ~ createWithXLSX ~ err",
        err
      );
      return err;
    }
  },
}));
