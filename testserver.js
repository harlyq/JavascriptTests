var app = require('express')();
var http = require('http').Server(app);
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // parse JSON

var count = 0;
app.get('/', function(req, res) {
  console.log('index');
  res.sendfile('testclient.html');
});

app.get('/test.dat', function(req, res) {
  console.log('get');
  res.send('<h1>Hello World' + count + '</h1>');
});

app.post('/test.dat', function(req, res) {
  console.log('post:' + JSON.stringify(req.body));
  res.send('roger');
  count = req.body.Age;
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});