const express = require('express');
const router = express.Router();

const path = require('path');
const rootDir = require('../util/path');

const shopController = require('../Controllers/shop');

const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getIndex);

router.get('/products',shopController.getProducts);

router.get('/products/:productId',shopController.getProduct)

router.get('/cart',isAuth, shopController.getCart);

router.post('/cart',isAuth,shopController.postCart);

router.post('/cart/delete-product/:productId',isAuth,shopController.postDeleteCartProduct);

router.get('/orders',isAuth,shopController.getOrders);

router.get('/checkout',isAuth,shopController.getCheckout);

router.get('/checkout/success',isAuth,shopController.postOrder);

router.get('/checkout/cancel',isAuth,shopController.getCheckout);

router.get('/orders/:orderId',isAuth,shopController.getInvoice);

module.exports = router;
