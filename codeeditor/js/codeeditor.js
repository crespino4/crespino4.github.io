/*
 * NOTE: This sample use ES6
 */
const clientId = 'bd1f02b0-bf28-47d4-9a5e-2ef05605d7c2';
const redirectUri = window.location.protocol + "//" + window.location.hostname + window.location.pathname;

if (typeof console  != "undefined") 
    if (typeof console.log != 'undefined')
        console.olog = console.log;
    else
        console.olog = function() {};

console.log = function(message) {
    console.olog(message);
    $('#debugDiv').append('<p>' + message + '</p>');
};
console.error = console.debug = console.info =  console.log

// Parse the query parameters to get the gcHostOrigin and gcTargetEnv variable so we can setup
// the API client against the proper Genesys Cloud region.
//
// Note: Genesys Cloud will send us gcHostOrigin, gcTargetEnv, gcLangTag
//       when the iframe is first initialized.  However, we'll come through this code
//       again after the implicit grant redirect, and those parameters won't be there
//       So we have to check if we were able to parse out the environment or not.
var integrationQueryString = "";
if ( window.location.search.length !== 0 ) {
    integrationQueryString = window.location.search.substring(1);
} else if ( window.location.hash.length !== 0 ) {
    integrationQueryString = window.location.hash.substring(1);
}

var appParams = parseAppParameters(integrationQueryString);

// Create instance of Client App SDK
let myClientApp = new window.purecloud.apps.ClientApp({
    gcHostOrigin: appParams.gcHostOrigin,
    gcTargetEnv: appParams.gcTargetEnv
});

// PureCloud Platform API
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, 'GenesysCloudCodeEditor');
client.setEnvironment(myClientApp.gcEnvironment);

$(document).ready(function() {
    $("#btnExecute").click(function() {
        var code = $("#code").val();
        eval(code);
    });

    initializeApplication();
});

async function initializeApplication() {

    try {

        // Perform Implicit Grant Authentication
        //
        // Note: Pass the query string parameters in the 'state' parameter so that they are returned
        //       to us after the implicit grant redirect.
        
        var loginResponse = await client.loginImplicitGrant(clientId, redirectUri, { state: integrationQueryString });
    } catch(err) {
        // Handle failure response
        console.log(err);
    }
}


function parseAppParameters(queryString) {
    console.log("Genesys Code Editor Query String: " + queryString);

    let appParams = {
        gcLangTag: null,
        gcHostOrigin: null,
        gcTargetEnv: null
    };

    if ( queryString.length != 0 ) {
        const pairs = queryString.split('&');

        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if (currParam[0] === 'gcLangTag') {
                appParams.gcLangTag = currParam[1];
            } else if (currParam[0] === 'gcHostOrigin') {
                appParams.gcHostOrigin = currParam[1];
            } else if (currParam[0] === 'gcTargetEnv') {
                appParams.gcTargetEnv = currParam[1];
            } else if (currParam[0] === 'state') {
                console.log("Found 'state' query parameter from implicit grant redirect");
                var stateValue = currParam[1];
                console.log("state = " + stateValue);
                var stateValueDecoded = decodeURIComponent(stateValue);
                console.log("decoded state = " + stateValueDecoded);
                appParams = parseAppParameters(decodeURIComponent(stateValueDecoded));
            }
        }
    }

    return appParams;
};
