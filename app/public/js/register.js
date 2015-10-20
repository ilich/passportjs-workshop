(function ($) {
    
    $(document).ready(function () {
        function validatePasswordsMatch() {
            var password = document.getElementById("password").value,
                confirmationBox = document.getElementById("confirmPassword"),
                confirmation = confirmationBox.value;
                
            if (password !== confirmation) {
                confirmationBox.setCustomValidity("Passwords do not match");
            } else {
                confirmationBox.setCustomValidity("");
            }
        }
        
        document.getElementById("password").onchange = validatePasswordsMatch; 
        document.getElementById("confirmPassword").onchange = validatePasswordsMatch;
    });
    
})(jQuery);