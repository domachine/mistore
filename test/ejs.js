var mistore = require('..'),
    request = require('supertest'),
    express = require('express');
describe('EJS Backend', function () {
  it('should render correctly', function (done) {
    var app = express();

    /*! First the mistore machinery is installed.  This will load the ejs
     * backend automatically so that we can test it. */

    mistore(app, function () {
      mistore.backend['ejs-latex'](app, function () {
        app.get('*', function (req, res) {
          req.mistore.render(
            {
              type: 'ejs-latex',
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
          .expect('Hello Tester', done);
      });
    });
  });
});
