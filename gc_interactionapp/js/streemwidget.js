/*
 * NOTE: This sample use ES6
 */

const clientId = '8af459b7-73b1-4f5e-82b8-94e6a53c1be3';
const redirectUri = 'https://crespino4.github.io/gc_interactionapp/streemwidget.html';

// PureCloud Platform API
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, 'StreemWidget');

// Specific Platform API Instances
const usersApi = new platformClient.UsersApi();
const conversationsApi = new platformClient.ConversationsApi();

// Parse the query parameters to get the pcEnvironment variable so we can setup
// the API client against the proper Genesys Cloud region.
//
// Note: Genesys Cloud will send us pcEnvironment, pcLangTag, and pcConversationId
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

console.log("Initializing platform client for region: " + appParams.pcEnvironment);
client.setEnvironment(appParams.pcEnvironment);

// Create instance of Client App SDK
let myClientApp = new window.purecloud.apps.ClientApp({
    pcEnvironment: appParams.pcEnvironment
});

// Log the PureCloud environment (i.e. AWS Region)
console.log("PureCloud API Client Environment: " + client.environment);
console.log("PureCloud ClientApp Environment: " + myClientApp.pcEnvironment);
console.log("PureCloud ClientApp Version: " + window.purecloud.apps.ClientApp.version);
console.log("PureCloud ClientApp About: " + window.purecloud.apps.ClientApp.about());

document.querySelector("#pcConversationId").innerHTML = appParams.pcConversationId;
document.querySelector("#pcEnvironment").innerHTML = appParams.pcEnvironment;
document.querySelector("#pcLangTag").innerHTML = appParams.pcLangTag;

//if ( window.location.hash.length !== 0 ) {
    initializeApplication();
//}

function initializeApplication() {
    console.log("Performing application initialization");

    // Perform Implicit Grant Authentication
    //
    // Note: Pass the query string parameters in the 'state' parameter so that they are returned
    //       to us after the implicit grant redirect.
    client.loginImplicitGrant(clientId, redirectUri, { state: integrationQueryString })
        .then((data) => {
            // User Authenticated
            console.log("User Authenticated: " + JSON.stringify(data));

            // Make request to GET /api/v2/users/me?expand=presence
            return usersApi.getUsersMe({ 'expand': ["presence","authorization"] });
        })
        .then((userMe) => {
            // Me Response
            console.log("User Info: " + JSON.stringify(userMe));

            me = userMe;

            document.querySelector("#username").innerHTML = me.username;

            // Create a Notifications Channel
            return getEmbedToken(me.id, me.name, me.email);
        }).then((embedInfo) => {
            console.log("Embed Info: " + JSON.stringify(embedInfo));

            token = embedInfo.token;

            window.location.href = 'https://houseclod.swa.prod-us.streem.cloud/embed?redirect=call&source=SFDC&refId=John Doe&callingcode=+1&phone=4252291932&name=John Doe#token=' + token;
        }).catch((err) => {
            // Handle failure response
            console.log(err);
        });
}

function getEmbedToken(user_id, name, email) {
    return new Promise((resolve, reject) => {
        $.ajax({
          url: 'https://housecloud.org/GetToken?user_id=' + user_id + '&ExpertName=ClaudioVacalebre&ExpertEmail=' + email,
          type: 'GET',
          success: function (data) {
            resolve(data)
          },
          error: function (error) {
            reject(error)
          },
        })
      })
}

function parseAppParameters(queryString) {
    console.log("Interaction App Query String: " + queryString);

    let appParams = {
        pcEnvironment: null,
        pcLangTag: null,
        pcConversationId: null
    };

    if ( queryString.length != 0 ) {
        const pairs = queryString.split('&');

        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if (currParam[0] === 'pcLangTag') {
                appParams.pcLangTag = currParam[1];
            } else if (currParam[0] === 'pcEnvironment') {
                appParams.pcEnvironment = currParam[1];
            } else if (currParam[0] === 'pcConversationId') {
                appParams.pcConversationId = currParam[1];
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
