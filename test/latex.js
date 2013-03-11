var mockery = require('mockery'),
    request = require('supertest'),
    express = require('express'),
    StringStream = require('string-stream'),
    mistore;
require('should');
describe('LaTeX Backend', function () {
  before(function () {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });
    mockery.registerMock('node-tex', function (stream, deps, callback) {
      var stringStream = new StringStream();
      stringStream.on('end', function () {
        var pdfStream = new StringStream('PDF Stream');
        stringStream.toString().should.equal('Hello Tester');
        callback(null, pdfStream);
      });
      stream.pipe(stringStream);
    });
    mockery.registerAllowable('..', true);
    mockery.registerAllowable('../backend/latex', true);
    mistore = require('..');
  });
  it('should render correctly', function (done) {
    var app = express();

    /*! First the mistore machinery is installed.  This will load the ejs
     * backend automatically so that we can test it. */

    mistore(app, function () {
      mistore.backend['ejs-latex'](app, function () {
        mistore.backend['latex'](app, function () {
          app.get('*', function (req, res) {
            req.mistore.render(
              {
                type: 'latex',
                template: 'Hello <%= name %>'
              },
              res,
              {
                name: 'Tester'
              },
              function (error) {
                if (error) {
                  done(error);
                }
              }
            );
          });
          request(app)
            .get('/')
            .expect('PDF Stream', done);
        });
      });
    });
  });
});
