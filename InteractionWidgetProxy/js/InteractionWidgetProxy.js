/*
 * NOTE: This sample use ES6
 */
const redirectUri = window.location.protocol + "//" + window.location.hostname + window.location.pathname;

// PureCloud Platform API
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
client.setPersistSettings(true, 'InteractionWidgetProxy');

// Specific Platform API Instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const conversationsApi = new platformClient.ConversationsApi();
const journeyApi = new platformClient.JourneyApi();

var lifecycleStatusMessageTitle = 'Interaction Widget Proxy';
var lifecycleStatusMessageId = 'lifecycle-statusMsg';
var me = null;
var currentConversation = null;
var externalContactId = null;

// Parse the query parameters to get the pcEnvironment variable so we can setup
// the API client against the proper Genesys Cloud region.
//
// Note: Genesys Cloud will send us pcEnvironment, pcLangTag, and pcConversationId
//       when the iframe is first initialized.  However, we'll come through this code
//       again after the implicit grant redirect, and those parameters won't be there
//       So we have to check if we were able to parse out the environment or not.
var integrationQueryString = "";
if ( window.location.search.length !== 0 ) {
    document.querySelector("#status").innerHTML = "Authenticating...";
    integrationQueryString = window.location.search.substring(1);
} else if ( window.location.hash.length !== 0 ) {
    document.querySelector("#status").innerHTML = "Authenticated!";
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
document.querySelector("#pcClientId").innerHTML = appParams.pcClientId;

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
    client.loginImplicitGrant(appParams.pcClientId, redirectUri, { state: integrationQueryString })
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

            document.querySelector("#username").innerHTML = me.username;

            document.querySelector("#status").innerHTML = "Querying Conversation...";

            console.log("Getting initial conversation details for conversation ID: " + appParams.pcConversationId);
            return conversationsApi.getConversation(appParams.pcConversationId);
        }).then((data) => {
            console.log("Conversation details for " + appParams.pcConversationId + ": " + JSON.stringify(data));

            currentConversation = data;

            document.querySelector("#conversationEvent").innerHTML = JSON.stringify(currentConversation, null, 3);

            document.querySelector("#status").innerHTML = "Looking for Proxy URL...";

            // Look to see if a proxy.URL attribute exists in the customer participant data
            // If so redirect to that URL
            var customer = data.participants.find((participant) => participant.purpose === "customer")
            if ( customer !== undefined ) {
                externalContactId = customer.externalContactId;

                var proxyUrl = customer.attributes["proxy.URL"];
                if ( proxyUrl !== undefined ) {
                    window.location.href = proxyUrl;
                }
            }

            // If there was a proxy.URL attribute then we should never get here because of the redirect

            return journeyApi.getExternalcontactsContactJourneySessions(externalContactId, {})
        }).then((data) => {
            console.log(`getExternalcontactsContactJourneySessions success! data: ${JSON.stringify(data, null, 2)}`);

            return notificationsApi.postNotificationsChannels();
        }).then((channel) => {
            // Channel Created

            // Setup WebSocket on Channel
            socket = new WebSocket(channel.connectUri);
            socket.onmessage = onSocketMessage;

            topicConversation = `v2.users.${me.id}.conversations`;
            topicTranscription = `v2.conversations.${appParams.pcConversationId}.transcription`
            topicJourney = `v2.externalcontacts.contacts.${externalContactId}.journey.sessions`

            // Subscribe to conversation events in the queue.
            let topic = [{"id": topicConversation},{"id": topicTranscription},{"id": topicJourney}];

            return notificationsApi.postNotificationsChannelSubscriptions(channel.id, topic);
        }).then( () => {
            myClientApp.lifecycle.bootstrapped();

            myClientApp.alerting.showToastPopup(
                lifecycleStatusMessageTitle,
                'Bootstrap Complete', {
                    id: lifecycleStatusMessageId,
                    type: 'success'
                }
            );

            logLifecycleEvent('Notified Genesys Cloud of Successful App Bootstrap', false);
        }).catch((err) => {
            document.querySelector("#status").innerHTML = "Error, See Console";

            // Handle failure response
            console.log(err);
        });
}

// Handler for every Websocket message
function onSocketMessage(event){
    console.log("WebSocket Event Received: " + event.data);
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    if ( topic === topicConversation && eventBody.id === currentConversation.id ) {
        console.log("Received an event for a Conversation ID that is recognized");

        currentConversation = eventBody;

        document.querySelector("#conversationEvent").innerHTML = JSON.stringify(currentConversation, null, 3);
    }

    if ( topic === topicTranscription && eventBody.conversationId == currentConversation.id ) {
        console.log("Received a transcription event for a Conversation ID that is recognized");
        var transcript = "[" + eventBody.transcripts[0].channel + "]: " + eventBody.transcripts[0].alternatives[0].transcript;
        document.querySelector("#transcriptionEvent").innerHTML = transcript;
    }

    if ( topic === topicJourney && eventBody.externalContact.id == externalContactId ) {
        console.log("Received an app event for an External Contact ID that is recognized");
        document.querySelector("#appEvent").innerHTML = JSON.stringify(eventBody, null, 3);
    }

};

function parseAppParameters(queryString) {
    console.log("Interaction Widget Proxy Query String: " + queryString);

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
