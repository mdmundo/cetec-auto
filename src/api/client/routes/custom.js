"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/custom/me",
      handler: "client.profile",
    },
    {
      method: "GET",
      path: "/custom/:code",
      handler: "client.findOneByCode",
    },
    {
      method: "POST",
      path: "/custom",
      handler: "client.createWithXLSX",
    },
  ],
};
