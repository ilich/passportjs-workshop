var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var bcrypt = require('bcrypt-nodejs');
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var config = require('./config')
var tokensStorage = require('../utils/token');

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
    
    // Login using MongoDB
    
    passport.use('local-signin', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function (username, password, done) {
            process.nextTick(function () {
                var users = db.get().collection('users');
                users.findOne({ username: username, type: 'local' }, function (err, user) {
                    if (err) {
                        done(err);
                    } else if (user === null) {
                        done(null, false, { message: 'Incorrect username or password.' });
                    } else {
                        bcrypt.compare(password, user.password, function (err, result) {
                            if (err) {
                                return done(err);
                            } else if (result) {
                                user.counter++;
                                users.update({ _id: new ObjectID(user._id) }, { $set: { counter: user.counter } }, function (err) {
                                    if (err) {
                                        return done(err);
                                    }    
                                    
                                    return done(null, user);    
                                });
                            } else {
                                return done(null, false, { message: 'Incorrect username or password.' });
                            }
                        });
                    }
                });
            });
        }
    ));
    
    // Create new account
    
    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {
            process.nextTick(function () {
                var errors = [];
        
                if (!/^[A-Za-z0-9_]+$/g.test(req.body.username)) {
                    errors.push('Invalid username.');
                }
                
                if (req.body.password.length === 0) {
                    errors.push('Password is required.');
                }
                
                if (req.body.password !== req.body.confirmPassword) {
                    errors.push('Passwords do not match.')    
                }
                
                if (errors.length > 0) {
                    return done(null, false, { message: errors.join('|') });  
                }
                
                var users = db.get().collection('users');
                users.findOne({ username: req.body.username, type: 'local' }, function (err, user) {
                    if (err) {
                        return done(err);    
                    }
                    
                    if (user !== null) {
                        return done(null, false, { message: 'Invalid username.' });
                    }
                    
                    bcrypt.hash(req.body.password, null, null, function (err, hash) {
                        if (err) {
                            return done(err);    
                        }
                        
                        var user = {
                            username: req.body.username,
                            password: hash,
                            type: 'local',
                            counter: 1
                        }
                        
                        users.insert(user, function (err) {
                            if (err) {
                                return done(err);
                            }
                            
                            return done(null, user);
                        });
                    });
                });
            });
        }
    ));
    
    // Remember Me
    
    passport.use(new RememberMeStrategy(
        function (token, done) {
            process.nextTick(function() {
                tokensStorage.consume(token, done);
            });
        },
        function (user, done) {
            process.nextTick(function() {
                tokensStorage.create(user, done);
            });
        }
    ));
    
    // Twitter Authentication
    
    passport.use(new TwitterStrategy({
            consumerKey: config.twitter.consumerKey,
            consumerSecret: config.twitter.consumerSecret,
            callbackURL: config.twitter.callbackURL
        }, function(token, tokenSecret, profile, done) {
            process.nextTick(function () {
                var users = db.get().collection('users');
                users.findOne({ username: profile.username, type: 'twitter' }, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    
                    if (user === null) {
                        
                        // First login. Create an account
                        
                        var photo = '';
                        if (profile.photos.length > 0) {
                            photo = profile.photos[0].value;
                        }
                        
                        user = {
                            username: profile.username,
                            type: 'twitter',
                            counter: 1,
                            twitter: {
                                displayName: profile.displayName,
                                photo: photo
                            }
                        }
                        
                        users.insert(user, function (err) {
                            if (err) {
                                return done(err);
                            }
                            
                            return done(null, user);
                        });
                        
                    } else {
                        
                        // Known user. Update statistics
                        
                        user.counter++;
                        users.update({ _id: new ObjectID(user._id) }, { $set: { counter: user.counter } }, function (err) {
                            if (err) {
                                return done(err);
                            }
                            
                            return done(null, user);    
                        });
                    }
                });
            });
        }
    ));
};