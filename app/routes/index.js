var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var db = require('../db');
var secure = require('../middleware/secure');
var router = express.Router();

router.get('/', function(req, res, next) {
    var errors = [];
    var fail = req.flash('error'); 
    
    if (fail.length > 0) {
        errors.push(fail);
    }
    
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
    res.render('register', { 
        scripts: [ '/js/register.js' ], 
        errors: [] 
    });
});

router.post('/register', function(req, res, next) {
    var errors = [];
    
    if (!/^[A-Za-z0-9]+$/g.test(req.body.username)) {
        errors.push('Invalid username.');
    }
    
    if (req.body.password.length === 0) {
        errors.push('Password is required.');
    }
    
    if (req.body.password !== req.body.confirmPassword) {
        errors.push('Passwords do not match.')    
    }
    
    if (errors.length > 0) {
        return res.render('register', { 
            scripts: [ '/js/register.js' ], 
            errors: errors 
        });   
    }
    
    var users = db.get().collection('users');
    users.findOne({ username: req.body.username }, function (err, user) {
        if (user !== null) {
            errors.push('Invalid username.');
            
            return res.render('register', { 
                scripts: [ '/js/register.js' ], 
                errors: errors 
            });
        }
        
        bcrypt.hash(req.body.password, null, null, function (err, hash) {
            users.insert({
                username: req.body.username,
                password: hash
            });
            
            res.redirect('/profile');  
        });
    });    
});

router.get('/profile', secure, function (req, res, next) {
    res.render('profile', { 
        scripts: [],
        username: 'Test123',
        counter: 10
    });
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
