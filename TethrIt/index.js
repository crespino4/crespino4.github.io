var express = require('express');
var app = express();
var https = require('https');
const fs = require('fs')

var keypath = '/etc/nginx/ssl/tethrlite.key'; //live
var certpath = '/etc/nginx/ssl/tethrlitelive_orig.crt'; //live

if(__dirname==='/var/www/html/Genesys'){
    var keypath = '/var/www/html/Signaling/ssl/phase_2_key.key'; //pp
    var certpath = '/var/www/html/Signaling/ssl/phase_2_cert.pem'; //pp
}else if(__dirname==='/var/www/html/tethr_lite_video_streaming_platform_004475/Genesys'){
    var keypath = '/var/www/html/tethr_lite_video_streaming_platform_004475/Signaling/ssl/key.pem'; //local
    var certpath = '/var/www/html/tethr_lite_video_streaming_platform_004475/Signaling/ssl/cert.pem'; //local
}

app.use(express.static(__dirname+ '/docs'));

var options = {
    key: fs.readFileSync(keypath),
    cert: fs.readFileSync(certpath)    
  };
server = https.createServer(options, app).listen(8080);
console.log("Listening on 8080");

//app.listen(8080, () => console.log('Listening on 8080'));