"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/custom/me",
      handler: "client.profile",
    },
  ],
};
