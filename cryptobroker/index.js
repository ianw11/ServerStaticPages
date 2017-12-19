var ENDPOINT = '/crypto/';

window.onload = function() {
    setUpToggles();
    setUpButtons();
};

function setUpToggles() {
    var middleElems = document.getElementsByClassName('middle');
    var toggleElems = document.getElementsByClassName('loginToggle');
    
    for (var ndx = 0; ndx < toggleElems.length; ++ndx) {
        toggleElems[ndx].onclick = function() {
            for (var midNdx = 0; midNdx < middleElems.length; ++midNdx) {
                middleElems[midNdx].classList.toggle('hidden');
            }
        };
    }
};

function setUpButtons() {
    document.getElementById('loginButton').onclick = login;
    document.getElementById('registerButton').onclick = register;
};

function login() {
    var self = this;
    toggle(self);
    var loginSpinner = document.getElementById('loginSpinner');
    toggle(loginSpinner);
    
    var emailElem = document.getElementById('email_login');
    var passwordElem = document.getElementById('password_login');
    
    var email = emailElem.value;
    var password = passwordElem.value;
    
    //emailElem.innerHTML = '';
    passwordElem.innerHTML = '';
    
    performLogin(email, password, function(message) {
        toggle(self);
        toggle(loginSpinner);
        if (message !== undefined) {
            document.getElementById('loginError').innerHTML = message;
        }
    });
    return false;
};

function performLogin(email, password, callback) {
    var param = {
        email: email,
        password: password
    };
    
    sendRequest('POST', 'login', JSON.stringify(param), function(result) {
        callback();
        window.location.href = '/cryptobroker/overview.html';
    }, function(result) {
        callback(result);
    });
};

function register() {
    var self = this;
    toggle(self);
    var registerSpinner = document.getElementById('registerSpinner');
    toggle(registerSpinner);
    
    var firstnameElem = document.getElementById('firstname');
    var lastnameElem = document.getElementById('lastname');
    var emailElem = document.getElementById('email');
    var passwordElem = document.getElementById('password');
    
    var firstname = firstnameElem.value;
    var lastname = lastnameElem.value;
    var email = emailElem.value;
    var password = passwordElem.value;
    
    //firstnameElem.innerHTML = '';
    //lastnameElem.innerHTML = '';
    //emailElem.innerHTML = '';
    passwordElem.innerHTML = '';
    
    var registerSuccessElem = document.getElementById('registerSuccess');
    var registerErrorElem = document.getElementById('registerError');
    
    performRegister(firstname, lastname, email, password, function(success, message) {
        toggle(self);
        toggle(registerSpinner);
        
        registerSuccessElem.innerHTML = '';
        registerErrorElem.innerHTML = '';
        
        if (success) {
            self.disabled = true;
            registerSuccessElem.innerHTML = 'Success! Logging you in';
            performLogin(email, password, function(message) {
                if (message !== undefined) {
                    regiserErrorElem.innerHTML = message;
                }
            });
        } else {
            registerErrorElem.innerHTML = message;
        }
    });
    
    return false;
};

function performRegister(firstname, lastname, email, password, callback) {
    var param = {
        email: email,
        password: password,
        first_name: firstname,
        last_name: lastname
    };
    
    sendRequest('POST', 'register', JSON.stringify(param), function() {
        callback(true);
    }, function(message) {
        callback(false, message);
    });
};
