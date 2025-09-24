// Obtain a reference to the platformClient object
const platformClient = require('purecloud-platform-client-v2');
var WebSocketClient = require('websocket').client;

var websocket = new WebSocketClient();

// Get client credentials from environment variables
const CLIENT_ID = '0d7ad349-5228-476d-adf7-300eda47598c';
const CLIENT_SECRET = 'xNfZJBR5hOQdIz3ojdoj8DjjBv_FYNBJDHV8tnxdkdU';

// Additional configuration variables
const queueId = '264ce314-37b0-4f14-ba8c-521d827043b5';
const subscriptionTopic = `v2.routing.queues.${queueId}.conversations.messages`;

const client = platformClient.ApiClient.instance;
client.setEnvironment(platformClient.PureCloudRegionHosts.us_east_1);

// API instances
const notificationsApi = new platformClient.NotificationsApi();

client.loginClientCredentialsGrant(CLIENT_ID,CLIENT_SECRET)
.then(()=> {
    return notificationsApi.postNotificationsChannels()
})
.then(data => {
    console.log('Channel created');

    let websocketUri = data.connectUri;
    let channelId = data.id;

    // Creates a new WebSocket connection to the specified URL.
    websocket.connect(websocketUri);

    // Add the subscription for queue events
    let topic = [{id: subscriptionTopic}];
    return notificationsApi.postNotificationsChannelSubscriptions(channelId, topic);
})
.then(data => {
    console.log('Subscribed to Queue');

})
.catch((err) => {
 // Handle failure response
 console.log(err);
});


websocket.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

websocket.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});