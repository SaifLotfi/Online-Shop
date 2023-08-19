const express = require('express');

const path = require('path');

const router = express.Router();

const adminController = require('../Controllers/admin');

const isAuth = require('../middleware/is-auth');

const { check,body } = require('express-validator');

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post(
    '/add-product',
    isAuth,
    [
        body('title', 'Enter a valid product name')
            .trim()
            .notEmpty()
            .isString()
            .isLength({ min: 3 }),
        body('price', 'Enter a valid price')
            .trim()
            .notEmpty()
            .isFloat({ no_symbols: true })
            .isLength({ max: 6 }),
        body('description', 'Enter a valid description')
            .trim()
            .notEmpty()
            .isLength({ min: 5, max: 1000 }),
    ],
    adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getAdminProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product/:productId',
    isAuth,
    [
        body('title', 'Enter a valid product name')
            .trim()
            .notEmpty()
            .isString()
            .isLength({ min: 3 }),
        body('price', 'Enter a valid price')
            .trim()
            .notEmpty()
            .isNumeric({ no_symbols: true })
            .isFloat({ no_symbols: true })
            .isLength({ max: 6 }),
        body('description', 'Enter a valid description')
            .trim()
            .notEmpty()
            .isLength({ min: 5, max: 1000 }),
    ],
    adminController.postEditProduct
);

router.delete(
    '/delete-product/:productId',
    isAuth,
    adminController.deleteProduct
);

module.exports = router;
