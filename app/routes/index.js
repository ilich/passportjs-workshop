var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var passport = require('passport');
var db = require('../db');
var ObjectID = require('mongodb').ObjectID;
var tokensStorage = require('../utils/token');
var secure = require('../middleware/secure');
var router = express.Router();
var base32 = require('thirty-two');
var util = require('util');

function getErrors(req) {
    var fail = req.flash('error');
    if (fail.length === 0) {
        return []
    }
    
    return fail[0].split('|');
}

router.get('/', function(req, res, next) {
    if (req.isAuthenticated() && 
        (req.user.type == 'twitter' || 
            (req.user.type === 'local' && req.user.key && req.session.isAuthenticated))) {
        return res.redirect('/profile');
    }
    
    var errors = getErrors(req);
    
    res.render('index', { 
        scripts: [], 
        errors: errors 
    });
});

// 2FA: Step 1 - check username and password

router.post('/', passport.authenticate('local-signin', {
    failureRedirect: '/',
    failureFlash: true,
    badRequestMessage: 'Incorrect username or password.'
}), function (req, res, next) {
    
    // Check if user has Google Authenticator setup
    if (!req.user.key) {
        return res.redirect('/google-authenticator');
    } else {
        req.session.remember = req.body.remember;
        return res.redirect('/2fa');
    }
});

// 2FA: Step 2 - check code generated by Google Authenticator

router.get('/2fa', secure.isLoggedIn, function (req, res, next) {
    if (!req.user.key) {
        // User hasn't setup his Google Authenticator yet
        req.logout();
        return res.redirect('/');
    }
    
    res.render("2fa", { scripts: [] });
});

router.post('/2fa', secure.isLoggedIn, passport.authenticate('totp', {
    failureRedirect: '/' 
}),
function (req, res, next) {
    
    req.session.isAuthenticated = true;
    
    // If Remember Me is set we have to save initial remember_me cookie
    if (!req.session.remember) {
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

router.get('/google-authenticator', secure.isLoggedIn, function (req, res, end) {
    if (req.user.key) {
        // We do not need to setup Google Authenticator. User has been setup already.
        return res.redirect('/profile');
    }
    
    var key = base32.encode(crypto.randomBytes(32));
    key = key.toString().replace(/=/g, '');  // Google Authenticator ignores '='
    
    var qr = util.format('otpauth://totp/%s?secret=%s', req.user.username, key);
    var qrUrl = util.format('https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=%s', qr);
    
    res.render('google-authenticator', { 
        scripts: [],
        key: key,
        qrUrl: qrUrl
    });
});

router.post('/google-authenticator', secure.isLoggedIn, function (req, res, end) {
    if (!req.body.key) {
        // Bad request
        req.logout();
        return res.redirect('/')
    }
    
    if (req.user.key) {
        // We do not need to setup Google Authenticator. User has been setup already.
        return res.redirect('/profile');
    }
    
    var users = db.get().collection('users');
    users.findOne(new ObjectID(req.user._id), function (err, user) {
        if (err) {
            req.logout();
            return res.redirect('/')
        }
        
        users.update(user, { $set: { key: req.body.key } }, function (err) {
            if (err) {
                req.logout();
                return res.redirect('/')
            }
            
            req.session.isAuthenticated = true;
            return res.redirect('/profile');
        });  
    });
});


// User registration and profile

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

router.get('/profile', secure.canAccess, function (req, res, next) {
    res.render('profile', { 
        scripts: [],
        user: req.user
    });
});

router.get('/logout', function (req, res, next) {
    tokensStorage.logout(req, res, function () {
        req.session.isAuthenticated = false;
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
