// a library for validations
// over time we expect to extract more helpers and move them here.
exports.init = function(newDoc, oldDoc, userCtx, secObj) {
  var v = {};
  
  v.forbidden = function(message) {    
    throw({forbidden : message});
  };

  v.unauthorized = function(message) {
    throw({unauthorized : message});
  };

  v.assert = function(should, message) {
    if (!should) v.forbidden(message);
  }
  
  v.isAdmin = function(dbAdminCheck) {
    /*
      Changes from fork by tcaddy:
        Extend this function to take an optional argument called dbAdminCheck.
        If dbAdminCheck is true and user is not a real admin, we will 
        return the result of v.isDbAdmin()
    */
    if (typeof(dbAdminCheck) === 'undefined') {
      var dbAdminCheck = false; // set to false, by default
    }
    var is_admin = (userCtx.roles.indexOf('_admin') != -1);
    if (is_admin) {
      return true; // real admins don't need additional checks
    } else if(dbAdminCheck) {
      return v.isDbAdmin(); // this will check if user is an admin on given database
    }
    return false; // return false by default
  };
  
  v.isDbAdmin() = function() {
    /*
      Changes from fork by tcaddy:
        Futon lets you define specific username and/or roles that act
        as admins for a single database.  But there is no check for this.
        
        This function will perform the check for us.
    */
    if (typeof(secObj) !== 'undefined') { // if secObj isn't defined, we do nothing
      if (secObj && secObj.admins) { // if secObj.admins isn't defined, we do nothing
        if (secObj.admins.names) {
          if (secObj.admins.names.indexOf(userCtx.name) != -1) {
            return true; // username matches
          }
        }
        if (secObj.admins.roles) {
          for (var i=0, l=secObj.admins.roles.length; i<l; i++) {
            if (v.isRole(secObj.admins.roles[i])) {
              return true; // role matches
            }
          }
        }
      }
    }
    return false; // return false by default
  }
  
  v.isRole = function(role) {
    return userCtx.roles.indexOf(role) != -1
  };

  v.require = function() {
    for (var i=0; i < arguments.length; i++) {
      var field = arguments[i];
      message = "The '"+field+"' field is required.";
      if (typeof newDoc[field] == "undefined") v.forbidden(message);
    };
  };

  v.unchanged = function(field) {
    if (oldDoc && oldDoc[field] != newDoc[field]) 
      v.forbidden("You may not change the '"+field+"' field.");
  };

  v.matches = function(field, regex, message) {
    if (!newDoc[field].match(regex)) {
      message = message || "Format of '"+field+"' field is invalid.";
      v.forbidden(message);    
    }
  };

  // this ensures that the date will be UTC, parseable, and collate correctly
  v.dateFormat = function(field) {
    message = "Sorry, '"+field+"' is not a valid date format. Try: 2010-02-24T17:00:03.432Z";
    v.matches(field, /\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}(\.\d*)?Z/, message);
  }
  
  return v;
};
