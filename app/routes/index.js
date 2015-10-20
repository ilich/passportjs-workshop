var express = require('express');
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
    
    res.render('register', { 
        scripts: [ '/js/register.js' ], 
        errors: errors 
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
