var trimInput = function(val) {
  return val.replace(/^\s*|\s*$/g, "");
}

var isValidPassword = function(val) {
  if (val.length >= 6) {
    return true;
  } else {
    Session.set('loginDisplayError', 'password must be at least 6 characters long');
    return false; 
  }
}

var isValidUsername = function (val) {
  if (val.length < 5) {
    Session.set('loginDisplayError', 'usernames must be at least 5 characters long');
    return false;
  }
  else if (/^[a-z][a-z0-9]*/.test(val)) {
    return true;
  }
  else {
    Session.set('loginDisplayError', 'usernames must be all lowercase, and only contain letters and numbers');
    return false;
  }
}

var isValidEmail = function (val) {
  if (/(.+)@(.+){2,}\.(.+){2,}/.test(val)) {
    return true;
  }
  else {
    Session.set('loginDisplayError', 'please provide a valid email');
    return false;
  }
}

//  reset password token is held in the url and provided by Accounts
if (Accounts._resetPasswordToken) {
  Session.set('resetPassword', Accounts._resetPasswordToken);
  Session.set('loginCurrentForm', 'recover');
}

Template.loginPage.helpers({
  registering : function () {
    return Session.get('loginCurrentForm') === "register";
  },
  recovering : function () {
    return Session.get('loginCurrentForm') === "recover";
  },
  loginDisplayMessage : function () {
    return Session.get('loginDisplayMessage');
  },
  loginDisplayError : function () {
    return Session.get('loginDisplayError');
  },
  anyLoginServiceActive : function () {
    for (var method in Meteor) {
      if (method.slice(0, 9) === 'loginWith'
      &&  method.slice(9) !== 'Token') {
        return true;
      }
    }
    return false;
  }
});

Template.loginPage.onRendered(function () {
  //  expire the login display message
  this.autorun(function () {
    if (Session.get('loginDisplayMessage')) {
      Meteor.setTimeout(function () {
        Session.set('loginDisplayMessage', null);
      }, 3000);
    }
    if (Session.get('loginDisplayError')) {
      Meteor.setTimeout(function () {
        Session.set('loginDisplayError', null);
      }, 3000);
    }
  })
});

Template.loginPage.events({
  'tap #login-form-button' : function () {
    Session.set('loginCurrentForm', "login");
  },
  'tap #register-form-button' : function () {
    Session.set('loginCurrentForm', "register");
  },
  'tap #recover-form-button' : function () {
    Session.set('loginCurrentForm', "recover");
  }
});

Template.loginThirdParty.helpers({
  canLoginWith : function (service) {
    return Meteor['loginWith' + service[0].toUpperCase() + service.slice(1)] !== undefined;
  },
  loginServices : function () {
    var services = [];
    for (var method in Meteor) {
      if (method.slice(0, 9) === 'loginWith') {
        if (method.slice(9) !== 'Password'
        &&  method.slice(9) !== 'Token'   ) {
          services.push(method.slice(9).toLowerCase());
        }
      }
    }
    return services;
  },
  iconFor : function (service) {
    var serviceIcons = {
      'facebook' : 'facebook',
      'google' : 'google',
      'twitter' : 'twitter'
    }
    return serviceIcons[service];
  }
});

Template.loginThirdParty.events({
  'tap .third-party-login-button' : function (event, template) {
    var service = $(event.target).closest('.third-party-login-button').attr('data-service');
    Meteor['loginWith' + service[0].toUpperCase() + service.slice(1)](function (error) {
      if (error) {
        Session.set('loginDisplayError', error.message);
      }
    });
  }
})

Template.loginForm.events({

  'submit #login-form' : function(event, template) {
    event.preventDefault();
    // retrieve the input field values
    var email = template.find('#login-email-or-username').value
    var password = template.find('#login-password').value;

    email = trimInput(email);

    // If validation passes, supply the appropriate fields to the
    // Meteor.loginWithPassword() function.
    Meteor.loginWithPassword(email, password, function(error){
      if (error) {
        // The user might not have been found, or their passwword
        // could be incorrect. Inform the user that their
        // login attempt has failed.
        Session.set('loginDisplayError', error.reason);
      }
      else {
        // The user has been logged in.
      }
    });
    return false; 
  }
});

Template.registerForm.events({
  'submit #register-form' : function(e, t) {
    e.preventDefault();
    var username = t.find('#account-username').value;
    var email = t.find('#account-email').value;
    var password = t.find('#account-password').value;
    var password2 = t.find('#confirm-account-password').value;

    if (password !== password2) {
      Session.set('loginDisplayError', 'passwords do not match');
    }
    else if (isValidUsername(username)
    &&       isValidPassword(password)
    &&       isValidEmail(email)) {
      // Trim and validate the input
      Accounts.createUser({
        username : username,
        email: email,
        password : password
      }, function(error){
        if (error) {
          // Inform the user that account creation failed
          Session.set('loginDisplayError', error.reason);
        } else {
          // Success. Account has been created and the user
          // has logged in successfully. 
        }

      });
    }

    return false;
  }
});

Template.recoverPassword.helpers({
  resetPassword : function(t) {
    return Session.get('resetPassword');
  }
});

Template.recoverPassword.events({

  'submit #recovery-form' : function(e, t) {
    e.preventDefault()
    var email = trimInput(t.find('#recovery-email').value)

    if (isValidEmail(email)) {
      Session.set('loading', true);
      Accounts.forgotPassword({email: email}, function(err){
       if (err)
         Session.set('loginDisplayError', 'Password Reset Error')
        else {
          Session.set('loginDisplayMessage', 'Email Sent. Please check your email.')
        }
        Session.set('loading', false);
      });
    }
    return false; 
  },

  'submit #new-password' : function(e, t) {
    e.preventDefault();
    var pw = t.find('#new-password-password').value;
    if (isValidPassword(pw)) {
      Session.set('loading', true);
      Accounts.resetPassword(Session.get('resetPassword'), pw, function(err){
        if (err)
          Session.set('loginDisplayError', 'Password Reset Error & Sorry');
        else {
          Session.set('resetPassword', null);
        }
        Session.set('loading', false);
      });
    }
    return false; 
  }
});
