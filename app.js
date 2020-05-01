const express = require('express');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const errorToString = (error) => typeof error === 'object' ? JSON.stringify(error) : error;

paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id:
    'AUVNWdANFGOk4qdo1wUTSRs_l-qxNYuMloRDX4IVsjR3q2NzDvjFWD_-Vd3G21AIfpof5z5BXJjK7wKm',
  client_secret:
    'EEprYfHoSp65TlhBAgamrUkN5pDH5TP8kLGoF_YpzqJrjL2ww2hagNYf1L-q8idBxF-SsbfIvJGjL06p'
});

app.get('/paypal', (req, res) => {
  const {
    query: {
      linkingUri,
      // orderId,
      amount,
    },
  } = req;

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `http://localhost:3000/success?linkingUri=${linkingUri}&amount=${amount}`,
      cancel_url: `http://localhost:3000/cancel?linkingUri=${linkingUri}`
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: 'item',
              sku: 'item',
              price: amount,
              currency: 'EUR',
              quantity: 1
            }
          ]
        },
        amount: {
          currency: 'EUR',
          total: amount
        },
        description: 'This is the payment description.'
      }
    ]
  };

  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      res.redirect(301, `${linkingUri}?status=error&error=${errorToString(error)}`)
    } else {
      // console.log('Create Payment Response');
      // console.log(payment);
      res.redirect(payment.links[1].href);
    }
  });
});

app.get('/success', (req, res) => {
  const {
    query: {
      linkingUri,
      amount,
      PayerID,
      paymentId,
    },
  } = req;
  const execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          currency: 'EUR',
          total: amount
        }
      }
    ]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(
    error,
    payment
  ) {
    if (error) {
      console.log(error.response);
      res.redirect(301, `${linkingUri}?status=error22&error=${errorToString(error)}`)
    } else {
      console.log('Get Payment Response');
      console.log(JSON.stringify(payment));
      res.redirect(301, `${linkingUri}?status=success`)
    }
  });
});

app.get('cancel', (req, res) => {
  const {
    query: {
      linkingUri,
    },
  } = req;

  res.redirect(301, `${linkingUri}?status=cancel`)
});

app.listen(3000, () => {
  console.log('Server is running');
});
