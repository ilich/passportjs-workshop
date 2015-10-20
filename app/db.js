var MongoClient = require("mongodb").MongoClient;

var db = null;

module.exports = {
    connect: function (url, done) {
        if (db) {
            return done();
        }
        
        MongoClient.connect(url, function (err, result) {
           if (err) {
               return done(err);
           }
           
           db = result;
           done();
        });
    },
    
    get: function () {
        return db;
    },
    
    close: function (done) {
        if (!db) {
            return;
        }
        
        db.clone(function (err, result) {
            if (err) {
                return done(err);
            }
            
            db = null;
            done();
        });
    }
};