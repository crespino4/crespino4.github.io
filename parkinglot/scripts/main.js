/* eslint-disable no-undef */
import view from './view.js';

const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// OAuth
const redirectUri = window.location.href;
const clientId = 'dc5c5c9f-5be7-40b2-b1d6-bee95d2eb0f0';

var selectedQueueId = '';

// API instances
const analyticsApi = new platformClient.AnalyticsApi();
const conversationsApi = new platformClient.ConversationsApi();
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const routingApi = new platformClient.RoutingApi();

// User Values
let userId = null;

/**
 * Get queues
 * @param {String} queueId Genesys Cloud Queue ID
 * @returns {Promise} the api response
 */
function getQueues(){

    let opts = {
        'pageSize': 25, // Number | Page size
        'pageNumber': 1, // Number | Page number
        'sortBy': 'name', // String | Sort by
        'name': 'Parking*'
    };

    return routingApi.getRoutingQueues(opts)
        .then((data) => {
            data.entities.forEach((queue) => addQueue(queue));
        })
}

function addQueue(queue){
    var queueList = document.getElementById("queueList");

    var option = document.createElement("option");
    option.text = queue.name;
    option.value = queue.id;
    queueList.options.add(option);
}

/**
 * Get parked calls from queue
 * @param {String} queueId Genesys Cloud Queue ID
 * @returns {Promise} the api response
 */
function getParkedCallsFromQueue(){
    var queueList = document.getElementById('queueList');
    selectedQueueId = queueList.value;

    let intervalTo = moment().utc().add(1, 'h');
    let intervalFrom = intervalTo.clone().subtract(7, 'days');
    let intervalString = intervalFrom.format() + '/' + intervalTo.format();

    let queryBody = {
        'interval': intervalString,
        'order': 'asc',
        'orderBy': 'conversationStart',
        'paging': {
            'pageSize': '100',
            'pageNumber': 1
        },
        'segmentFilters': [
            {
                'type': 'and',
                'predicates': [
                    {
                        'type': 'dimension',
                        'dimension': 'mediaType',
                        'operator': 'matches',
                        'value': 'voice'
                    },
                    {
                        'type': 'dimension',
                        'dimension': 'queueId',
                        'operator': 'matches',
                        'value': selectedQueueId
                    }
                ]
            }
        ],
        'conversationFilters': [
            {
                'type': 'or',
                'predicates': [
                    {
                        'type': 'dimension',
                        'dimension': 'conversationEnd',
                        'operator': 'notExists',
                        'value': null
                    }
                ]
            }
        ]
    };

    return analyticsApi.postAnalyticsConversationsDetailsQuery(queryBody);
}

/**
 * Builds custom parked call objects containing the information from the
 * conversations.
 * @param {Object} conversationsData analytics query results
 * @returns {Promise} array of the custom parked call objects
 */
function buildParkedCallInformation(conversationsData){
    let parkedCalls = [];
    console.log(conversationsData);
    if(!conversationsData.conversations) return [];

    for(let conversation of conversationsData.conversations){
        // If not acd skip, because it might be received by an agent
        if (conversation.participants[conversation.participants.length - 1]
            .purpose != 'acd') continue;

        parkedCalls.push(new Promise((resolve, reject) => {
            // Default Values
            let senderName = '<No Name>';
            let senderEmail = '<No Email>';
            let emailSubject = '<No Subject>';
            let emailBody = '<No Body>';

            // Get duration from conversation start
            let durationMinutes = moment.duration(
                moment().utc().diff(moment(conversation.conversationStart))).as('minutes');
            let daysAgo = Math.floor(durationMinutes / (60 * 24));
            let hoursAgo = Math.floor((durationMinutes / 60) % 24);
            let minutesAgo = Math.floor(durationMinutes % 60);
            let parkedCallDuration = '';
            if(daysAgo >= 1) parkedCallDuration += daysAgo + 'day(s) ';
            if(hoursAgo >= 1) parkedCallDuration += hoursAgo + 'hour(s) ';
            parkedCallDuration += minutesAgo + 'minute(s)';

        }));
    }

    return Promise.all(parkedCalls);
}

/**
 * Assign the parked call to the current agent
 * @param {String} conversationId Genesys Cloud conversationId
 * @param {String} acdParticipantId ParticipantId of the acd participant
 */
function assignParkedCallToAgent(conversationId, acdParticipantId){
    view.showLoader('Assigning Parked Call...');

    let body = {
        'userId': userId,
    };
    conversationsApi.postConversationParticipantReplace(conversationId, acdParticipantId, body)
        .then(() => {

            view.hideParkedCallBox(conversationId);
            view.hideLoader();
        })
        .catch((err) => {
            console.log(err);
        });
}

/**
 * Check Queue for new parked calls
 */
function refreshParkedCalls(){
    view.showLoader('Gathering Parked Calls...');
    view.hideBlankParkedCalls();

    return getParkedCallsFromQueue()
        .then((conversations) => {
            // mutate the information from parked calls to prepare for viewing
            return buildParkedCallInformation(conversations);
        })
        .then((parkedCalls) => {
            // Show the parked call info on the document
            view.clearParkedCallContainer();
            view.hideLoader();

            if(parkedCalls.length <= 0){
                view.showBlankParkedCalls();
            }else{
                parkedCalls.forEach((parkedCall) => view.addParkedCallBox(parkedCall));
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

/**
 * Set-up a Notifications listener for new Parked Call Conversations
 * entering the queue
 */
function setQueueListener(){
    let channel = {};
    let topicId = `v2.routing.queues.${selectedQueueId}.conversations.calls`;

    notificationsApi.postNotificationsChannels()
        .then((data) => {
            channel = data;

            return notificationsApi.putNotificationsChannelSubscriptions(
                channel.id, [{'id': topicId}]);
        })
        .then(() => {
            console.log('Subscribed to Queue!');

            let webSocket = new WebSocket(channel.connectUri);
            webSocket.onmessage = function(event){
                let msg = JSON.parse(event.data);
                if((msg.topicName == topicId) && (msg.eventBody.participants.length == 3)){
                    setTimeout(refreshParkedCalls, 3000);
                }
            };
        })
        .catch((err) => {
            console.log('There was a failure.');
            console.error(err);
        });
}

// Initial Setup
client.loginImplicitGrant(clientId, redirectUri)
    .then((data) => {
        console.log(data);

        // Get User Info
        return usersApi.getUsersMe();
    })
    .then((me) => {
        userId = me.id;
        return getQueues();
    })
    .then(() => {
        // Get Available Parked Calls
        return refreshParkedCalls();
    })
    .then(() => {
        // Set up queue listener
        return setQueueListener();
    })
    .catch((err) => {
        console.log(err);
    });

// Global assignment
window.assignParkedCallToAgent = assignParkedCallToAgent;
window.refreshParkedCalls = refreshParkedCalls;