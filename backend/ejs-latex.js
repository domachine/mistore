var ejs = require('ejs'),
    lescape = require('escape-latex');
module.exports = function (app, next) {
  var options = this.ejs || {};
  function Backend(doc, stream, docCtx) {
    var opts = doc.ejs || {};
    opts.locals = opts.locals || {};
    opts.locals.__proto__ = docCtx || {};
    opts.escape = lescape;
    stream.end(ejs.render(doc.template, opts));
  }
  app.use(function (req, res, next) {
    req.mistore.backend['ejs-latex'] = Backend;
    next();
  });
  next();
};
