'use strict';

/**
 * the-service router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::the-service.the-service');
