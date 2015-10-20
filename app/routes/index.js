var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var db = require('../db');
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
    var errors = getErrors(req);
    
    res.render('index', { 
        scripts: [], 
        errors: errors 
    });
});

router.post('/', passport.authenticate('local-signin', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true,
    badRequestMessage: 'Incorrect username or password.'
}));

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
    req.logout();
    res.redirect('/');
});

module.exports = router;
