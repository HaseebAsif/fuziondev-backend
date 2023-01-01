'use strict';

/**
 * the-service service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::the-service.the-service');
