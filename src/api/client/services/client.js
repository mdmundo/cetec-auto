"use strict";

/**
 * client service.
 */

const { createCoreService } = require("@strapi/strapi").factories;
const XLSX = require("xlsx");

module.exports = createCoreService("api::client.client", ({ strapi }) => ({
  async populateFromSheets(contasPath, historicosContabeisPath) {
    try {
      const contas = XLSX.readFile(contasPath);
      const historicosContabeis = XLSX.readFile(historicosContabeisPath);

      const clientDescription = contas.Preamble["F1"].v;
      const clientCNPJ = contas.Preamble["F2"].v;

      const sheetAccounts = Array.from(
        { length: contas.Preamble["!rows"].length },
        (v, i) =>
          contas.Preamble[`H${i + 1}`]?.v?.match(
            /^1\.1\.01\.00[1-2]\.\d{3}$/
          ) && {
            code: contas.Preamble[`A${i + 1}`].v,
            description: contas.Preamble[`P${i + 1}`].v,
          }
      ).filter((account) => account?.code && account?.description);

      const sheetFurnishers = Array.from(
        { length: contas.Preamble["!rows"].length },
        (v, i) =>
          contas.Preamble[`H${i + 1}`]?.v?.match(
            /^2\.1\.01\.00[2-6]\.\d{3}$/
          ) && {
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
        description: clientDescription,
        cnpj: clientCNPJ,
        accounts: sheetAccounts,
        furnishers: sheetFurnishers,
        histories: sheetHistories,
      };
    } catch (err) {
      console.error(err);
      throw new Error("Unable to process files");
    }
  },
}));
