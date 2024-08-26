/*
 * NOTE: This sample use ES6
 */

// Set redirect URI in case user must login and we need to get back here
const redirectUri = window.location.protocol + "//" + window.location.hostname + window.location.pathname;
console.log("***** RedirectURI *****: " + redirectUri);

// Parse the query parameters to get the values we can use to setup
// the SDK clients against the proper Genesys Cloud region.
//
// Note: Genesys Cloud will send us gcHostOrigin, gcTargetEnv, gcLangTag, and gcConversationId
//       when the iframe is first initialized.  However, we'll come through this code
//       again after the implicit grant redirect, and those parameters won't be there
//       so we need to get the query parameters based on where they exist.
var integrationQueryString = "";
if ( window.location.search.length !== 0 ) {
    document.querySelector("#status").innerHTML = "Authenticating...";
    integrationQueryString = window.location.search.substring(1);
} else if ( window.location.hash.length !== 0 ) {
    document.querySelector("#status").innerHTML = "Authenticated!";
    integrationQueryString = window.location.hash.substring(1);
}
var appParams = parseAppParameters(integrationQueryString);

// Create and initialize an instance of Client App SDK
let myClientApp = new window.purecloud.apps.ClientApp({
    gcHostOrigin: appParams.gcHostOrigin,
    gcTargetEnv: appParams.gcTargetEnv
});

// Log the Genesys Cloud environment (i.e. AWS Region) and Client Apps SDK version
console.log("Genesys Cloud Client App SDK Environment: " + myClientApp.gcEnvironment);
console.log("Genesys Cloud Client App SDK Version: " + myClientApp.version);

// Create Genesys Cloud Platform SDK instance
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// Point the Platform SDK to make SDK requests to the proper region for the org
console.log("Initializing platform client for region returned by Client App SDK: " + myClientApp.gcEnvironment);
client.setEnvironment(myClientApp.gcEnvironment);

// Set to store OAuth access token in local storage to prevent user from being
// prompted for user credentials multiple times during use of the widget.
client.setPersistSettings(true, 'FavoritesInteractionWidget');

// Specific Platform SDK items utilized by this application
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const conversationsApi = new platformClient.ConversationsApi();
const extContactsApi = new platformClient.ExternalContactsApi();
const routingApi = new platformClient.RoutingApi();

var lifecycleStatusMessageTitle = 'Favorites Interaction Widget';
var lifecycleStatusMessageId = 'lifecycle-statusMsg';
var me = null;
var conversation = null;

initializeApplication();

//
// Bootstrap Listener
//
myClientApp.lifecycle.addBootstrapListener(() => {
    logLifecycleEvent('App Lifecycle Event: bootstrap', true);
    initializeApplication();
});

//
// Focus Listener
//
function onAppFocus () {
    logLifecycleEvent('App Lifecycle Event: focus', true);

    myClientApp.alerting.showToastPopup(
        lifecycleStatusMessageTitle,
        'App Focused', {
            id: lifecycleStatusMessageId
        }
    );
}
myClientApp.lifecycle.addFocusListener(onAppFocus);

//
// Blur Listener
//
function onAppBlur () {
    logLifecycleEvent('App Lifecycle Event: blur', true);

    myClientApp.alerting.showToastPopup(
        lifecycleStatusMessageTitle,
        'App Blurred', {
            id: lifecycleStatusMessageId
        }
    );
}
myClientApp.lifecycle.addBlurListener(onAppBlur);

//
// Stop Listener
//
myClientApp.lifecycle.addStopListener(() => {
    logLifecycleEvent('App Lifecycle Event: stop', true);

    // Clean up other, persistent listeners
    myClientApp.lifecycle.removeFocusListener(onAppFocus);
    myClientApp.lifecycle.removeBlurListener(onAppBlur);

    myClientApp.lifecycle.stopped();

    myClientApp.alerting.showToastPopup(
        lifecycleStatusMessageTitle,
        'App Stopped', {
            id: lifecycleStatusMessageId,
            type: 'error',
            showCloseButton: true
        }
    );

    logLifecycleEvent('Notified Genesys Cloud of Successful App Stop', false);
});

function logLifecycleEvent(logText, incommingEvent) {
    console.log(logText)
};

function initializeApplication() {
    console.log("Performing application bootstrapping");

    // Perform Implicit Grant Authentication
    //
    // Note: Pass the query string parameters in the 'state' parameter so that they are returned
    //       to us after the implicit grant redirect.
    client.loginImplicitGrant(appParams.clientId, redirectUri, { state: integrationQueryString })
        .then((data) => {
            // User Authenticated
            console.log("User Authenticated: " + JSON.stringify(data));

            document.querySelector("#status").innerHTML = "Querying User...";

            // Make request to GET /api/v2/users/me?expand=presence
            return usersApi.getUsersMe({ 'expand': ["presence","authorization"] });
        })
        .then((userMe) => {
            // Me Response
            me = userMe;

            //document.querySelector("#username").innerHTML = me.username;

            document.querySelector("#status").innerHTML = "Querying Conversation...";

            console.log("Getting initial conversation details for conversation ID: " + appParams.gcConversationId);
            return conversationsApi.getConversation(appParams.gcConversationId);
        }).then((data) => {
            console.log("Conversation details for " + appParams.gcConversationId + ": " + JSON.stringify(data));
            //document.querySelector("#conversationEvent").innerHTML = JSON.stringify(data, null, 3);
            conversation = data;

            myClientApp.lifecycle.bootstrapped();

            myClientApp.alerting.showToastPopup(
                lifecycleStatusMessageTitle,
                'Bootstrap Complete', {
                    id: lifecycleStatusMessageId,
                    type: 'success'
                }
            );

            // document.querySelector("#status").innerHTML = "Looking for Proxy URL...";

            // // Look to see if a proxy.URL attribute exists in the customer participant data
            // // If so redirect to that URL
            // var customer = data.participants.find((participant) => participant.purpose === "customer")
            // if ( customer !== undefined ) {
            //     var proxyUrl = customer.attributes["proxy.URL"];
            //     if ( proxyUrl !== undefined ) {
            //         window.location.href = proxyUrl;
            //     }
            // }

            logLifecycleEvent('Notified Genesys Cloud of Successful App Bootstrap', false);

            getExternalOrganization();
        }).catch((err) => {

            document.querySelector("#status").innerHTML = "Error, See Console";

            // Handle failure response
            console.log(err);
            showToast(err.message);
        });
}

function getExternalOrganization() {
    document.querySelector("#status").innerHTML = "Searching for 'Favorites' External Organization...";
    console.log("Getting External Organization named 'Favorites'");
    
    let opts = { 
      'pageSize': 20, // Number | Page size (limited to fetching first 1,000 records; pageNumber * pageSize must be <= 1,000)
      'pageNumber': 1, // Number | Page number (limited to fetching first 1,000 records; pageNumber * pageSize must be <= 1,000)
      'q': "Favorites", // String | Search query
      'expand': ["expand_example"] // [String] | which fields, if any, to expand
    };
  
    extContactsApi.getExternalcontactsOrganizations(opts)
    .then((data) => {
      console.log(`getExternalcontactsOrganizations success! data: ${JSON.stringify(data, null, 2)}`);
      var extOrg = data.entities.find((element, index) => {
        return element.name === "Favorites";
      })
      
      if ( extOrg !== undefined ) {
        getExternalContacts(extOrg);
      }
    })
    .catch((err) => {
      console.log('There was a failure calling getExternalcontactsOrganizations');
      console.error(err);
      showToast(err.message);
    });
}
  
function getExternalContacts(extOrg) {
    document.querySelector("#status").innerHTML = "Searching for 'Favorites' External Contacts...";
    console.log("Getting External Contacts as 'Favorites'"); 
    
    let externalOrganizationId = extOrg.id
    let opts = { 
      'pageSize': 20, // Number | Page size (limited to fetching first 1,000 records; pageNumber * pageSize must be <= 1,000)
      'pageNumber': 1
    };
    
    extContactsApi.getExternalcontactsOrganizationContacts(externalOrganizationId, opts)
      .then((data) => {
        console.log(`getExternalcontactsOrganizationContacts success! data: ${JSON.stringify(data, null, 2)}`);
        
        data.entities.forEach((element, index) => {
            console.log(element.firstName + " - " + element.lastName);
            $('#favorites').append("<p><button type='button'>" + element.firstName + "-" + element.middleName + "-" + element.lastName + "</button></p>");
        });
        
        $("button").click(function(){
            console.log("Button Clicked: " + this.innerHTML);
            GetTransferTarget(this.innerHTML);
        });

        document.querySelector("#status").innerHTML = "";
      })
      .catch((err) => {
        console.log('There was a failure calling getExternalcontactsOrganizationContacts');
        console.error(err);
        showToast(err.message);
      });
}

function GetTransferTarget(target) {
    console.log("Get Transfer Target: " + target);
    var opts = null;
    const regexPattern = new RegExp(".*-.*-(.*)");

    if (target.startsWith('Number')) {
        var number = target.match(regexPattern);
        if ( number !== null ) {
            opts = {
                "address": number[1]
            }
            TransferConversation(opts);
        };
    } else if (target.startsWith('Queue')) {
        var queueName = target.match(regexPattern);
        if ( queueName !== null ) {
            let qopts = { 
                'pageSize': 25, // Number | Page size [max value is 100]
                'pageNumber': 1, // Number | Page number [max value is 5]
                'sortBy': "name", // String | Sort by
                'sortOrder': "asc", // String | Sort order
                'name': queueName[1] // String | Name
            };
            
            routingApi.getRoutingQueuesDivisionviews(qopts)
                .then((data) => {
                    console.log(`getRoutingQueuesDivisionviews success! data: ${JSON.stringify(data, null, 2)}`);
                    xferTargetId = data.entities[0].id;
                    opts = {
                        "queueId": data.entities[0].id
                    }
                    TransferConversation(opts);
                })
                .catch((err) => {
                    console.log('There was a failure calling getRoutingQueuesDivisionviews');
                    console.error(err);
                    showToast(err.message);
                });
        }
    } else if (target.startsWith('User')) {
        var userName = target.match(regexPattern);
        if ( userName !== null ) {
            opts = {
                "address": userName[1]
            }
            TransferConversation(opts);
        }
    } else {
        showToast("Unrecognized Transfer Target.  Valid targets are [Queue, Number, User]");
    }
}

function TransferConversation(opts) {
    console.log("TransferConversation: " + JSON.stringify(opts));

    var participant = conversation.participants.find((element, index) => {
        if ( element.purpose === "agent" ) {
            if (element.userId === me.id) {
                console.log("Found participant for " + me.id + ": " + element.id);
                return true;
            }
        }
    });
    
    let conversationId = conversation.id; // String | conversation ID
    let participantId = participant.id;

    conversationsApi.postConversationParticipantReplace(conversationId, participantId, opts)
      .then(() => {
        console.log('postConversationParticipantReplace returned successfully.');
      })
      .catch((err) => {
        console.log('There was a failure calling postConversationParticipantReplace');
        console.error(err);
        showToast(err.message);
      });        
}

function showToast(message) {
    myClientApp.alerting.showToastPopup(
        lifecycleStatusMessageTitle,
        message, 
        {
            id: lifecycleStatusMessageId
        }
    );
}

function parseAppParameters(queryString) {
    console.log("Interaction Widget Proxy Query String: " + queryString);

    let appParams = {
        gcHostOrigin: null,
        gcTargetEnv: null,
        gcLangTag: null,
        gcConversationId: null,
        clientId: null
    };

    if ( queryString.length != 0 ) {
        const pairs = queryString.split('&');

        for (var i = 0; i < pairs.length; i++)
        {
            var currParam = pairs[i].split('=');

            if (currParam[0] === 'gcLangTag') {
                appParams.gcLangTag = decodeURIComponent(currParam[1]);
                console.log("Query Parameter gcLangTag = " + appParams.gcLangTag);
            } else if (currParam[0] === 'gcHostOrigin') {
                appParams.gcHostOrigin = decodeURIComponent(currParam[1]);
                console.log("Query Parameter gcHostOrigin = " + appParams.gcHostOrigin);
            } else if (currParam[0] === 'gcTargetEnv') {
                appParams.gcTargetEnv = decodeURIComponent(currParam[1]);
                console.log("Query Parameter gcTargetEnv = " + appParams.gcTargetEnv);
            } else if (currParam[0] === 'gcConversationId') {
                appParams.gcConversationId = decodeURIComponent(currParam[1]);
                console.log("Query Parameter gcConversationId = " + appParams.gcConversationId);
            } else if (currParam[0] === 'ClientId') {
                appParams.clientId = decodeURIComponent(currParam[1]);
                console.log("Query Parameter ClientId = " + appParams.clientId);
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
