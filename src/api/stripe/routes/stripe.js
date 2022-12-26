module.exports = {
  routes: [
    {
      method: "POST",
      path: "/stripe",
      handler: "stripe.checkout",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/stripe/retrive-checkout",
      handler: "stripe.retriveCheckout",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
