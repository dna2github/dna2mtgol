const path = require('path');

const express = require('express');
const body_parser = require('body-parser');

const api = require('./server/api');


const port = process.env.PORT || 9090;
const addr = process.env.ADDR || '127.0.0.1';
const app = express();

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.use('/api', api);

app.use((req, res, next) => {
   let err = new Error('Not Found');
   err.status = 404;
   next(err);
});
app.use((err, req, res, next) => {
   res.status(err.status || 500);
   res.render('error', {
      message: err.message,
      error: err    // dev
      // error: {}     // prod
   });
});

app.listen(port, port, () => {
   console.log(`The service of NodeBase modules is listening at ${addr}:${port}`);
});
