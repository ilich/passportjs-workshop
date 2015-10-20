var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs')
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user._id);    
    });
    
    passport.deserializeUser(function (id, done) {
        var users = db.get().collection('users');
        users.findOne(new ObjectID(id), function (err, user) {
            if (err) {
                done(err);
            } else if (user === null) {
                done(null, false);
            } else {
                done(null, user);
            }
        });  
    });
    
    passport.use('local-signin', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function (username, password, done) {
            var users = db.get().collection('users');
            users.findOne({ username: username }, function (err, user) {
                if (err) {
                    done(err);
                } else if (user === null) {
                    done(null, false, { message: 'Incorrect username or password.' });
                } else {
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (err) {
                            return done(err);
                        } else if (result) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Incorrect username or password.' });
                        }
                    });
                }
            });  
        }
    ));
};