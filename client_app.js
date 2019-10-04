/*
*   NOTE: This sample uses ES6.
*/
import appConfig from './config/config.js';

let clientApp = {};

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const analyticsApi = new platformClient.AnalyticsApi();
const routingApi = new platformClient.RoutingApi();


// Will Authenticate through PureCloud and subscribe to User Conversation Notifications
clientApp.setup = function(pagePath){
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');

    let pcEnv = null;
    let langTag = null;

    for (var i = 0; i < pairs.length; i++)
    {
        var currParam = pairs[i].split('=');

        if(currParam[0] === 'langTag') {
            langTag = currParam[1];
        } else if(currParam[0] === 'pcEnvironment') {
            pcEnv = currParam[1];
        } else if(currParam[0] === 'environment' && pcEnv === null) {
            pcEnv = currParam[1];
        }
    }

    // Stores the query parameters into localstorage
    // If query parameters are not provided, try to get values from localstorage
    // Default values if it does not exist.
    if(pcEnv){
        localStorage.setItem(appConfig.appName + ":environment", pcEnv);
    }else if(localStorage.getItem(appConfig.appName + ":environment")){
        pcEnv = localStorage.getItem(appConfig.appName + ":environment");
    } else {
        pcEnv = appConfig.defaultPcEnv;
    }

    if(langTag){
        localStorage.setItem(appConfig.appName + ":langTag", langTag);
    }else if(localStorage.getItem(appConfig.appName + ":langTag")){
        langTag = localStorage.getItem(appConfig.appName + ":langTag");
    } else {
        langTag =  appConfig.defaultLangTag;
    }


    let clientId = appConfig.clientIDs[pcEnv];
    clientApp.langTag = langTag;
    clientApp.pcEnv = pcEnv;

    // Authenticate via PureCloud
    client.setPersistSettings(true);
    client.setEnvironment(pcEnv);
    return client.loginImplicitGrant(clientId, appConfig.redirectUriBase + pagePath)
        .then(data => {
            console.log(data);

            // Get Details of current User and save to Client App
            return usersApi.getUsersMe();
        }).then( userMe => {
            clientApp.userId = userMe.id;

            // Create a Notifications Channel
            return notificationsApi.postNotificationsChannels();
        }).then(data => {
            clientApp.websocketUri = data.connectUri;
            clientApp.channelID = data.id;
            clientApp.socket = new WebSocket(clientApp.websocketUri);
            clientApp.socket.onmessage = clientApp.onSocketMessage;
            clientApp.topicIdAgent = "v2.users." + clientApp.userId + ".conversations.calls";

            // Subscribe to Call Conversations of Current user.
            let topic = [{"id": clientApp.topicIdAgent}];
            return notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
        }).then(data => console.log("Succesfully set-up Client App."))

        // Error Handling
        .catch(e => console.log(e));
};

// Handler for every Websocket message
clientApp.onSocketMessage = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    console.log(topic);
    console.log(eventBody);
};


export default clientApp