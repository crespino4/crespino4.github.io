var express = require('express');
var path = require('path');
var app = express();

app.use(express.static( path.join( __dirname , 'docs/wizard')));


app.listen(8080, () => console.log('Listening on 8080'));