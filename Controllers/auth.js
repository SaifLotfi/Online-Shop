const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const techError = require('../util/tech-error.js');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.TRANSPORTER_EMAIL,
        pass: process.env.TRANSPORTER_PASSWORD
    },
});

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMsg: req.flash('login-error')[0],
        validationErrors: [],
    });
};

exports.postLogin = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMsg: result.array()[0].msg,
            validationErrors: result.array(),
        });
    }
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then((user) => {
            if (user) {
                bcrypt.compare(password, user.password).then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user; // SAVING DATA ONLY.
                        return req.session.save((err) => {
                            console.log('sessionSaveErr', err);
                            return res.redirect('/');
                        });
                    } else {
                        return res.status(422).render('auth/login', {
                            pageTitle: 'Login',
                            path: '/login',
                            errorMsg: 'Wrong Email or Password',
                            validationErrors: result.array(),
                        }); //how do login page know that you came by clicking "login" button
                        //or by inserting worng email&pass ??
                    }
                });
            } else {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMsg: 'Wrong Email or Password',
                    validationErrors: result.array(),
                });
            }
        })
        .catch(err=>{
        techError(err,next);
    });
};

exports.postLogout = (req, res, next) => {
    // console.log(csrfToken);
    req.session.destroy((err) => {
        console.log('sessionDestroyErr', err);
        res.redirect('/');
    });
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMsg: req.flash('signupError')[0],
        validationErrors: [],
        // isAuthenticated: false,
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // console.log(result);
        req.flash('signupError', result.array()[0].msg);
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMsg: req.flash('signupError')[0],
            validationErrors: result.array(),
        });
    }
    return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: [],
                },
            });
            return user.save();
        })
        .then((result) => {
            const mailOptions = {
                from: 'dummynowandthen@gmail.com',
                to: email,
                subject: 'Signup Success',
                text: 'Hey there, it’s our first message sent with Nodemailer ',
                html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br />',
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log('mail sending error', error);
                }
                console.log('Message sent: %s', info.messageId);
            });
            return res.redirect('/login');
        })
        .catch(err=>{
        techError(err,next);
    });
};

exports.getResetPassword = (req, res, next) => {
    res.render('auth/reset-password', {
        pageTitle: 'Reset Password',
        path: '/login',
        errorMsg: req.flash('reset-error')[0],
        // isAuthenticated: false,
    });
};

exports.postResetPassword = (req, res, next) => {
    const email = req.body.email;

    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset-password');
        }
        const token = buffer.toString('hex');
        const tokenExpiration = Date.now() + 1000 * 60 * 60;
        User.findOne({
            email: email,
        })
            .then((user) => {
                if (!user) {
                    req.flash('reset-error', 'No Such User with that Email!');
                    return res.redirect('/reset-password');
                }
                user.resetPasswordToken = token;
                user.resetPasswordTokenExpiration = tokenExpiration;
                return user.save();
            })
            .then((result) => {
                res.redirect('/login');
                const mailOptions = {
                    from:process.env.TRANSPORTER_EMAIL ,
                    to: email,
                    subject: 'Password Reset',
                    html: `
                            <p>You Requested a Password Reset</p>
                            <p>Please Click this <a href="http://${process.env.HOST}:${process.env.PORT}/reset-password/${token}">link</a> to reset your password</p>
                        `,
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log('mail sending error', error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
            })
            .catch(err=>{
        techError(err,next);
    });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiration: { $gt: Date.now() },
    }).then((user) => {
        if (!user) {
            req.flash('reset-error', 'Invalid Token!');
            return res.redirect('/reset-password');
        }
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/login',
            errorMsg: req.flash('new-password-error')[0],
            userId: user._id.toString(),
            token: token,
        });
    });
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassowrd = req.body.password;
    const token = req.body.token;
    User.findOne({
        _id: userId, // if no token , I can reach to that page with my own account , then change the userId hidden input field to change some otherone's password!
        resetPasswordToken: token,
        resetPasswordTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            let updatedUser = user;
            return bcrypt.hash(newPassowrd, 12).then((hashedPassword) => {
                updatedUser.password = hashedPassword;
                updatedUser.resetPasswordToken = undefined;
                updatedUser.resetPasswordTokenExpiration = undefined;
                return updatedUser.save();
            });
        })
        .then((result) => {
            return res.redirect('/login');
        })
        .catch(err=>{
        techError(err,next);
    });
};
