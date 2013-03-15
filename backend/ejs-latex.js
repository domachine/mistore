module.exports = function (app, next) {
  var ejs = require('ejs'),
      lescape = require('escape-latex');
  function Backend() {
  }
  Backend.prototype.start = function (doc, stream, arg, next) {
    var opts = doc.ejs || {};
    opts.locals = opts.locals || {};
    opts.locals.__proto__ = arg || {};
    opts.escape = lescape;
    stream.once('end', next);
    stream.end(ejs.render(doc.template, opts));
  };
  app.use(function (req, res, next) {
    req.mistore.backend['ejs-latex'] = Backend;
    next();
  });
  next();
};
