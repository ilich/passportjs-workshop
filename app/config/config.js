module.exports = {
    db: 'mongodb://localhost/passportjs-workshop',
    twitter: {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
    }
};