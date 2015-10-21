var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var db = require('../db');
var tokensStorage = require('../utils/token');
var secure = require('../middleware/secure');
var router = express.Router();

function getErrors(req) {
    var fail = req.flash('error');
    if (fail.length === 0) {
        return []
    }
    
    return fail[0].split('|');
}

router.get('/', function(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    
    var errors = getErrors(req);
    
    res.render('index', { 
        scripts: [], 
        errors: errors 
    });
});

router.post('/', passport.authenticate('local-signin', {
    failureRedirect: '/',
    failureFlash: true,
    badRequestMessage: 'Incorrect username or password.'
}), function (req, res, next) {
    
    // If Remember Me is set we have to save initial remember_me cookie
    if (!req.body.remember) {
        return res.redirect('/profile');
    }
    
    tokensStorage.create(req.user, function (err, token) {
        if (err) {
            return next(err);
        }
        
        res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 });
        return res.redirect('/profile');
    });
});

router.get('/register', function(req, res, next) {
    var errors = getErrors(req);
    
    res.render('register', { 
        scripts: [ '/js/register.js' ], 
        errors: errors
    });
});

router.post('/register', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/register',
    failureFlash: true
}));

router.get('/profile', secure, function (req, res, next) {
    res.render('profile', { 
        scripts: [],
        user: req.user
    });
});

router.get('/logout', function (req, res, next) {
    tokensStorage.logout(req, res, function () {
        req.logout();
        res.redirect('/');    
    });
});

// Twitter authentication

// Redirect the user to Twitter for authentication.
router.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.
router.get('/auth/twitter/callback',  passport.authenticate('twitter', { 
    successRedirect: '/profile', 
    failureRedirect: '/' }));

module.exports = router;
