var express = require('express');
var bcrypt = require('bcrypt-nodejs')
var db = require('../db');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { 
        scripts: [], 
        errors: [] 
    });
});

router.post('/', function(req, res, next) {
    var errors = [];
    
    res.render('index', { 
        scripts: [], 
        errors: errors 
    });  
    
});

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

router.get('/profile', function (req, res, next) {
    res.render('profile', { 
        scripts: [],
        username: 'Test123',
        counter: 10
    });
});

module.exports = router;
