const express = require('express');

const path = require('path');

const router = express.Router();

const authController = require('../Controllers/auth');

const User = require('../models/user');

const { check } = require('express-validator');

router.get('/login', authController.getLogin);

router.post(
    '/login',
    [
        check('email', 'Enter A Valid Email!')
            .trim()
            .isEmail()
            .normalizeEmail(),
        check('password', 'Enter A Valid Password!')
            .isLength({ min: 8 })
            .isAlphanumeric(),
    ],
    authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .trim()
            .isEmail()
            .withMessage('Please Enter A Valid Email!')
            .custom((value, { req }) => {
                return User.findOne({
                    email: value,
                }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject(
                            'An Account with this email is already reserved!'
                        );
                    }
                });
            })
            .normalizeEmail(),
        check(
            'password',
            'Password Should be at least 8 char Long , and with only numbers and normal characters!'
        )
            .custom((value, { req }) => {
                //custom can send an error if you return (false , throw an error , Promise Rejection)
                if (value.length < 8) {
                    // throw new Error('Password Should be at least 8 char Long!');
                    return false;
                }
                return true;
            })
            .isAlphanumeric(),
        check('confirmPassword', "Passwords don't match!").custom(
            (value, { req }) => {
                if (value !== req.body.password) {
                    return false;
                }
                return true;
            }
        ),
    ],
    authController.postSignup
);

router.get('/reset-password', authController.getResetPassword);

router.post('/reset-password', authController.postResetPassword);

router.get('/reset-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
