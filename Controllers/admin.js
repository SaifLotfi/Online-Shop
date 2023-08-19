const Product = require('../models/product');
const deleteFile = require('../util/file');
const { validationResult } = require('express-validator');
const techError = require('../util/tech-error');
const product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    console.log('reached!');
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        errorMsg: '',
        validationErrors: [],
        hasError: false,
    });
};

exports.postAddProduct = (req, res, next) => {
    const parsedBody = req.body;
    const { title, price, description } = parsedBody;
    const image = req.file;

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMsg: 'Enter A Valid Image',
            validationErrors: [],
            product: {
                title: title,
                price: price,
                description: description,
                userId: req.session.user._id,
            },
            hasError: true,
        });
    }

    const newProduct = new Product({
        title: title,
        imageUrl: image.path,
        price: price,
        description: description,
        userId: req.session.user._id,
    });
    // console.log(req.file);
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // console.log(result);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMsg: result.array()[0].msg,
            validationErrors: result.array(),
            product: newProduct,
            hasError: true,
        });
    }
    newProduct
        .save()
        .then((result) => {
            // console.log('cont', result);
            res.redirect('/admin/products');
        })
        .catch(next);
};

exports.getAdminProducts = (req, res, next) => {
    Product.find()
        // .select('-_id')
        // .populate('userId','name')
        .then((products) => {
            // console.log(products);
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (editMode !== 'true') {
        return res.redirect('/');
    }
    const result = validationResult(req);
    const productId = req.params.productId;
    Product.findById(productId)
        .then((product) => {
            if (
                !product ||
                product.userId.toString() !== req.session.user._id.toString()
            ) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                errorMsg: null,
                validationErrors: [],
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.postEditProduct = (req, res, next) => {
    const parsedBody = req.body;
    const { title, price, description } = parsedBody;
    const productId = req.params.productId;

    const image = req.file;

    const result = validationResult(req);
    if (!result.isEmpty()) {
        console.log(result);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'edit Product',
            path: '/admin/add-product',
            editing: true,
            errorMsg: result.array()[0].msg,
            validationErrors: result.array(),
            product: {
                _id: productId,
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
        });
    }

    Product.findById(productId)
        .then((product) => {
            if (product.userId.toString() !== req.session.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = title;
            if (image) {
                deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.price = price;
            product.description = description;
            return product.save().then((result) => {
                console.log('Product Was Updated!');
                res.redirect('/admin/products');
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.deleteProduct = (req, res, next) => {
    const deletedProductId = req.params.productId;
    console.log('Deleting Product #', deletedProductId);
    Product.findById(deletedProductId)
        .then((product) => {
            if (!product) {
                return next(new Error('Product Not Found!'));
            }
            deleteFile(product.imageUrl);
            return Product.deleteOne({
                _id: deletedProductId,
                userId: req.session.user._id,
            });
        })
        .then((result) => {
            console.log('Product is Deleted');
            return res.status(200).json({
                message: 'Success!',
            });
        })
        .catch((result) => {
            res.status(500).json({
                message: 'Failed!',
            });
        });
};
