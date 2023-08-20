const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/order');
const ObjectId = require('mongodb').ObjectId;
const techError = require('../util/tech-error');
const stripe = require('stripe')( process.env.STRIPE_KEY);
const PRODUCTS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    // console.log('In Another MiddleWare!');
    const page = +req.query.page || 1;
    let numOfProducts;
    Product.countDocuments()
        .then((number) => {
            numOfProducts = number;
            return Product.find()
                .skip((page - 1) * PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE);
        })
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
                curPage: page,
                lastPage: Math.ceil(numOfProducts / PRODUCTS_PER_PAGE),
                firstPage: 1,
                nextPage: page + 1,
                previousPage: page - 1,
                totalNumOfProducts: numOfProducts,
                hasNextPage:
                    page < Math.ceil(numOfProducts / PRODUCTS_PER_PAGE),
                hasPreviousPage: page > 1,
            });
        })
        .catch(next);
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let numOfProducts;
    Product.countDocuments()
        .then((number) => {
            numOfProducts = number;
            return Product.find()
                .skip((page - 1) * PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE);
        })
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'shop',
                path: '/',
                curPage: page,
                lastPage: Math.ceil(numOfProducts / PRODUCTS_PER_PAGE),
                firstPage: 1,
                nextPage: page + 1,
                previousPage: page - 1,
                totalNumOfProducts: numOfProducts,
                hasNextPage:
                    page < Math.ceil(numOfProducts / PRODUCTS_PER_PAGE),
                hasPreviousPage: page > 1,
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    // console.log('productId', productId);
    Product.findById(productId)
        .then((product) => {
            res.render('shop/product-details', {
                pageTitle: product.title,
                path: '/products',
                product: product,
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.getCart = (req, res, next) => {
    // console.log(req.session.user);
    req.session.user
        .populate('cart.items.productId')
        .then((user) => {
            console.log(user.cart.items);
            res.render('shop/cart', {
                pageTitle: 'Cart',
                path: '/cart',
                products: user.cart.items,
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;

    Product.findById(productId)
        .then((product) => {
            return req.session.user.addToCart(product);
        })
        .then((result) => {
            res.redirect('/cart');
        })
        .catch(next);
};

exports.postDeleteCartProduct = (req, res, next) => {
    const productId = req.params.productId;
    console.log('postDeleteCartProduct', productId);
    req.session.user.removeFromCart(productId).then((user) => {
        // console.log(user);
        res.redirect('/cart');
    });
};

// exports.getCheckout = (req, res, next) => {
//     req.session.user
//         .populate('cart.items.productId')
//         .then((user) => {
//             const products = user.cart.items;
//             console.log(products)
//             let total = 0;
//             products.forEach((p) => {
//                 total += p.quantity * p.productId.price;
//             });
//             res.render('shop/checkout', {
//                 path: '/checkout',
//                 pageTitle: 'Checkout',
//                 products: products,
//                 totalSum: total,
//             });
//         })
//         .catch((err) => {
//             const error = new Error(err);
//             error.httpStatusCode = 500;
//             return next(error);
//         });
// };

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.session.user
        .populate('cart.items.productId')
        .then((user) => {
            products = user.cart.items;
            total = 0;
            products.forEach((p) => {
                total += p.quantity * p.productId.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: products.map((p) => {
                    return {
                        quantity: p.quantity,
                        price_data: {
                            currency: 'usd',
                            unit_amount: p.productId.price * 100,
                            product_data: {
                                name: p.productId.title,
                                description: p.productId.description,
                            },
                        },
                    };
                }),
                customer_email: req.session.user.email,
                success_url:
                    req.protocol +
                    '://' +
                    req.get('host') +
                    '/checkout/success',
                cancel_url:
                    req.protocol + '://' + req.get('host') + '/checkout/cancel',
            });
        })
        .then((session) => {
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
                sessionId: session.id,
            });
        })
        .catch(next);
};

exports.getOrders = (req, res, next) => {
    req.session.user
        .getOrders()
        .then((orders) => {
            // console.log(orders);
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders,
            });
        })
        .catch((err) => {
            techError(err, next);
        });
};

exports.postOrder = (req, res, next) => {
    req.session.user
        .addOrder()
        .then((user) => {
            res.redirect('/orders');
        })
        .catch(next);
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error('No Order with Such Id!'));
            }
            if (order.userId.toString() !== req.session.user._id.toString()) {
                return next(new Error('Unauthorized!'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const p = path.join('data', 'invoices', invoiceName);
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=${invoiceName}`
            );
            doc.pipe(res);

            // Set the title of the invoice
            const invoiceTitle = 'Invoice';

            // Calculate the total price of all products
            const totalPrice = order.items.reduce(
                (acc, product) => acc + product.price,
                0
            );

            // Set the document title and filename
            doc.info.Title = invoiceTitle;
            const filename = `${invoiceTitle}.pdf`;

            // Pipe the PDF document to a writable stream
            doc.pipe(fs.createWriteStream(p));

            // Set the font size and color
            doc.fontSize(16);
            doc.fillColor('#333');

            // Add the invoice title to the document
            doc.text(invoiceTitle, { align: 'center' });
            doc.moveDown();

            // Set up the table headers
            doc.font('Helvetica-Bold');
            doc.text('Product', { width: 250 });
            doc.text('Price', { width: 100, align: 'right' });
            doc.moveDown();

            // Loop through the products and add them to the table
            doc.font('Helvetica');
            order.items.forEach((product) => {
                doc.text(product.title, { width: 250 });
                doc.text(product.price.toFixed(2), {
                    width: 100,
                    align: 'right',
                });
                doc.moveDown();
            });

            // Add the total price to the document
            doc.text(`Total: ${totalPrice.toFixed(2)}`, { align: 'right' });

            // Finalize the PDF document
            doc.end();
            // fs.readFile(p, (err, data) => {
            //     if (err) {
            //         return next(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader(
            //         'Content-Disposition',
            //         `attachment; filename=${invoiceName}`
            //     );
            //     res.send(data);
            // });
            // const file = fs.createReadStream(p);
            // res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader(
            //         'Content-Disposition',
            //         `attachment; filename=${invoiceName}`
            //     );
            // file.pipe(res);
        })
        .catch(next);
};
