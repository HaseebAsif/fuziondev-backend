'use strict';

/**
 * the-service controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::the-service.the-service');
