module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        
        res.redirect('/');
    },
    
    canAccess: function (req, res, next) {
        if (req.isAuthenticated() && 
            (req.user.type == 'twitter' || 
                (req.user.type === 'local' && req.user.key && req.session.isAuthenticated))) {  // req.session.isAuthenticated is set after user completes 2FA
            return next();
        }
        
        res.redirect('/');
    }
}