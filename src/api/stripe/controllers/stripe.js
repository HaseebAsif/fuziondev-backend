"use strict";
const stripe = require("stripe")(
  "sk_test_51MEyWvHY8tWxz7xLuadZg4iTYqNcHTydtSGVHzUY1WhWnfnG9vL4lDJ6gqVz4fGgMuc10YRppk9y5gmzsO5iMIuT00HUgc448U"
);
/**
 * A set of functions called "actions" for `stripe`
 */
const utils = require("@strapi/utils");
const { ValidationError, ApplicationError } = utils.errors;
const _ = require("lodash");
const { getService } = require("@strapi/plugin-users-permissions/server/utils");

var passwordChars =
  "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
module.exports = {
  checkout: async (ctx, next) => {
    const { product, userEmail } = ctx.request.body;

    try {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: `${userEmail}` } });
      if (!user) {
        throw new ValidationError("Incorrect email provided");
      }
      let customerID;
      if (user.customerID) {
        customerID = user.customerID;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
        });
        customerID = customer.id;
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              recurring: { interval: "year" },
              product_data: {
                name: product.name,
                images: [product.image],
              },
              unit_amount: product.amount * 100,
            },
            quantity: product.quantity ? product.quantity : 1,
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        customer: customerID,
        mode: "subscription",
        success_url: `${
          process.env.WEB_URL || "http://localhost:3000"
        }/success`,
        cancel_url: `${process.env.WEB_URL || "http://localhost:3000"}/login`,
      });
      await strapi.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { customerID },
      });
      return { sessionUrl: session.url, sessionId: session.id };
    } catch (err) {
      ctx.body = err;
    }
  },
  retriveCheckout: async (ctx, next) => {
    const { username, sessionId } = ctx.request.body;
    try {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { username: `${username}` },
        });
      if (!user) {
        ValidationError("Invalid username");
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const customer = await stripe.customers.retrieve(session.customer);
      console.log(user);
      stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 1 },
        async function (err, lineItems) {
          console.log(lineItems);
          try {
            await strapi.query("plugin::users-permissions.user").update({
              where: { username: `${username}` },
              data: {
                isAdmin: "admin",
                Licenses:
                  (lineItems.data[0].quantity || 1) + (user.Licenses || 0),
                ActivationDate: new Date().toISOString(),
                endDate: new Date(
                  new Date().setFullYear(new Date().getFullYear() + 1)
                ).toISOString(),
              },
            });

            const resultUser = [];

            await strapi.query("plugin::users-permissions.user").createMany({
              data: resultUser,
            });
          } catch (error) {
            console.error(error);
          }
        }
      );

      return { customer };
    } catch (error) {
      console.error(error);
    }
  },
  retrivePreviousPays: async (ctx, next) => {
    const { customerID, userEmail } = ctx.request.body;
    try {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: { customerID: `${customerID}`, email: `${userEmail}` },
        });
      if (!user) {
        throw new ValidationError("Incorrect customer Id or email provided");
      }
      const customer = await stripe.charges.search({
        query: `customer:"${customerID}"`,
      });
      return { customer };
    } catch (error) {
      console.error(error);
    }
  },
};
