Meteor.users.allow({
  update : function (userId, doc, fields, modifier) {
    // allow user to empty the resume.loginTokens field
    var modifierKeys = Object.keys(modifier);
    var modifierSetKeys = Object.keys(modifier.$set);
    var valid =
           modifierKeys.length == 1
        && modifierKeys[0] == '$set'
        && modifierSetKeys.length == 1
        && modifierSetKeys[0] == 'resume.loginTokens'
        && Array.isArray(modifier.$set['resume.loginTokens'])
        && modifier.$set['resume.loginTokens'].length == 0;
    return valid;
  }
})