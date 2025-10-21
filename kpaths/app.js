/********************************************
 * An example Express NodeJS app that 
 * implements Genesys Cloud Open Messaging
 */
const express = require("express")
const https = require('https');
const config = require('./config.js');
const { access } = require("fs");

// Initialize express and define a port
const app = express()
const PORT = 443

// Tell express to use body-parser's JSON parsing
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('web'));

function listen() {
    // Start express on the defined port
    app.listen(PORT, () => {
        console.log(`Server listening on local port ${PORT}`);
    });
}

listen();