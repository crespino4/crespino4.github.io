/*
 * NOTE: This sample use ES6
 */
const redirectUri = window.location.protocol + "//" + window.location.hostname + window.location.pathname;

// PureCloud Platform API
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, 'AppEventWidget');

// Specific Platform API Instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const conversationsApi = new platformClient.ConversationsApi();
const externalContactsApi = new platformClient.ExternalContactsApi();

var lifecycleStatusMessageTitle = 'App Event Widget';
var lifecycleStatusMessageId = 'lifecycle-statusMsg';
var me = null;
var conversation = null;

// Parse the query parameters to get the pcEnvironment variable so we can setup
// the API client against the proper Genesys Cloud region.
//
// Note: Genesys Cloud will send us pcEnvironment, pcLangTag, and pcConversationId
//       when the iframe is first initialized.  However, we'll come through this code
//       again after the implicit grant redirect, and those parameters won't be there
//       So we have to check if we were able to parse out the environment or not.
var integrationQueryString = "";
if ( window.location.search.length !== 0 ) {
    console.log("AppEventWidget - Authenticating...");
    integrationQueryString = window.location.search.substring(1);
} else if ( window.location.hash.length !== 0 ) {
    console.log("AppEventWidget - Authenticated!");
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
console.log("AppEventWidget - Genesys Cloud API Client Environment: " + client.environment);
console.log("AppEventWidget - Genesys Cloud ClientApp Environment: " + myClientApp.pcEnvironment);
console.log("AppEventWidget - Genesys Cloud ClientApp Version: " + window.purecloud.apps.ClientApp.version);
console.log("AppEventWidget - Genesys Cloud ClientApp About: " + window.purecloud.apps.ClientApp.about());
console.log("AppEventWidget - Genesys Cloud Conversation ID: " + appParams.pcConversationId);
console.log("AppEventWidget - Genesys Cloud Cliend ID: " + appParams.pcClientId);

initializeApplication();

//
// Bootstrap Listener
//
myClientApp.lifecycle.addBootstrapListener(() => {
    logLifecycleEvent('AppEventWidget - App Lifecycle Event: bootstrap', true);
    //initializeApplication();
});

//
// Focus Listener
//
function onAppFocus () {
    logLifecycleEvent('AppEventWidget - App Lifecycle Event: focus', true);

    // myClientApp.alerting.showToastPopup(
    //     lifecycleStatusMessageTitle,
    //     'App Focused', {
    //         id: lifecycleStatusMessageId
    //     }
    // );
}
myClientApp.lifecycle.addFocusListener(onAppFocus);

//
// Blur Listener
//
function onAppBlur () {
    logLifecycleEvent('AppEventWidget - App Lifecycle Event: blur', true);

    // myClientApp.alerting.showToastPopup(
    //     lifecycleStatusMessageTitle,
    //     'App Blurred', {
    //         id: lifecycleStatusMessageId
    //     }
    // );
}
myClientApp.lifecycle.addBlurListener(onAppBlur);

//
// Stop Listener
//
myClientApp.lifecycle.addStopListener(() => {
    logLifecycleEvent('AppEventWidget - App Lifecycle Event: stop', true);

    // Clean up other, persistent listeners
    myClientApp.lifecycle.removeFocusListener(onAppFocus);
    myClientApp.lifecycle.removeBlurListener(onAppBlur);

    myClientApp.lifecycle.stopped();

    // myClientApp.alerting.showToastPopup(
    //     lifecycleStatusMessageTitle,
    //     'App Stopped', {
    //         id: lifecycleStatusMessageId,
    //         type: 'error',
    //         showCloseButton: true
    //     }
    // );

    logLifecycleEvent('AppEventWidget - Notified Genesys Cloud of Successful App Stop', false);
});

function logLifecycleEvent(logText, incommingEvent) {
    console.log(logText)
};

function setAppEventListener(externalContactId){
    let channel = {};
    let topicId = `v2.externalcontacts.contacts.${externalContactId}.journey.sessions`;

    notificationsApi.postNotificationsChannels()
        .then((data) => {
            channel = data;

            return notificationsApi.putNotificationsChannelSubscriptions(
                channel.id, [{'id': topicId}]);
        })
        .then(() => {
            console.log('Subscribed to AppEvents for External Contact!');

            let webSocket = new WebSocket(channel.connectUri);
            webSocket.onmessage = function(event){
                let msg = JSON.parse(event.data);
                if(msg.topicName == topicId){
                    handleAppEvent(msg);
                }
            };
        })
        .catch((err) => {
            console.log('There was a failure.');
            console.error(err);
        });
}

function handleAppEvent(msg){
    console.log('App Event: ', msg);
    let event = msg.eventBody;

    if(event.type == 'app'){
        if(event.lastEvent.eventType == 'crespino_app_event'){
            console.log('App Event: ', event);
        }
    }
}

function initializeApplication() {
    console.log("AppEventWidget - Performing application bootstrapping");

    // Perform Implicit Grant Authentication
    //
    // Note: Pass the query string parameters in the 'state' parameter so that they are returned
    //       to us after the implicit grant redirect.
    client.loginImplicitGrant(appParams.pcClientId, redirectUri, { state: integrationQueryString })
        .then((data) => {
            // User Authenticated
            console.log("AppEventWidget - User Authenticated: " + JSON.stringify(data));
            
            console.log("AppEventWidget - Querying User...");

            // Make request to GET /api/v2/users/me?expand=presence
            return usersApi.getUsersMe({ 'expand': ["presence","authorization"] });
        })
        .then((userMe) => {
            // Me Response
            me = userMe;

            console.log("AppEventWidget - username: "+ me.username);

            console.log("AppEventWidget - Querying Conversation...");

            console.log("AppEventWidget - Getting initial conversation details for conversation ID: " + appParams.pcConversationId);
            return conversationsApi.getConversation(appParams.pcConversationId);
        }).then((data) => {
            console.log("AppEventWidget - Conversation details for " + appParams.pcConversationId + ": " + JSON.stringify(data));
          
            conversation = data;
            
            var externalContactId = getParticipantProperty('customer', 'externalContactId');
            setAppEventListener(externalContactId);

            myClientApp.lifecycle.bootstrapped();

            // myClientApp.alerting.showToastPopup(
            //     lifecycleStatusMessageTitle,
            //     'Bootstrap Complete', {
            //         id: lifecycleStatusMessageId,
            //         type: 'success'
            //     }
            // );

            logLifecycleEvent('AppEventWidget - Notified Genesys Cloud of Successful App Bootstrap', false);
        }).catch((err) => {
            // Handle failure response
            console.log(err);
        });
}

function getParticipantProperty(participantType, property) {
    var participant = conversation.participants.find((participant) => participant.purpose === participantType);
    return participant[property];
}

function parseAppParameters(queryString) {
    console.log("AppEventWidget - Query String: " + queryString);

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
            } else if (currParam[0] === 'pcClientId') {
                appParams.pcClientId = currParam[1];
            } else if (currParam[0] === 'state') {
                console.log("AppEventWidget - Found 'state' query parameter from implicit grant redirect");
                var stateValue = currParam[1];
                console.log("AppEventWidget - state = " + stateValue);
                var stateValueDecoded = decodeURIComponent(stateValue);
                console.log("AppEventWidget - decoded state = " + stateValueDecoded);
                appParams = parseAppParameters(decodeURIComponent(stateValueDecoded));
            }
        }
    }

    return appParams;
};

$(document).ready(function(){
    $("#sendSMS").click(function(){
      console.log("Send SMS Clicked");
    });
});