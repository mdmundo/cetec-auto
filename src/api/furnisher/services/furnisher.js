'use strict';

/**
 * furnisher service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::furnisher.furnisher');
