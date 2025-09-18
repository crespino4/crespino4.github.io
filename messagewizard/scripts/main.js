/* eslint-disable no-undef */
import view from './view.js';

const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// OAuth
const redirectUri = window.location.href;
const clientId = 'dc5c5c9f-5be7-40b2-b1d6-bee95d2eb0f0';

const queueId = '';

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
 * @param {String} queueId PureCloud Queue ID
 * @returns {Promise} the api response
 */
function getQueues(){

    let opts = {
        'pageSize': 25, // Number | Page size
        'pageNumber': 1, // Number | Page number
        'sortBy': "name", // String | Sort by
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
 * Get unanswered messages from queue
 * @param {String} queueId PureCloud Queue ID
 * @returns {Promise} the api response
 */
function getUnansweredMessagesFromQueue(queueId){
    var queueList = document.getElementById('queueList');
    queueId = queueList.value;

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
                        'value': 'message'
                    },
                    {
                        'type': 'dimension',
                        'dimension': 'messageType',
                        'operator': 'matches',
                        'value': 'webmessaging'
                    },
                    {
                        'type': 'dimension',
                        'dimension': 'queueId',
                        'operator': 'matches',
                        'value': queueId
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
 * Builds custom Message objects containing the information from the
 * conversations.
 * @param {Object} conversationsData analytics query results
 * @returns {Promise} array of the custom Message objects
 */
function buildMessageInformation(conversationsData){
    let Messages = [];
    console.log(conversationsData);
    if(!conversationsData.conversations) return [];

    for(let conversation of conversationsData.conversations){
        // If not acd skip, because it might be received by an agent
        if (conversation.participants[conversation.participants.length - 1]
            .purpose != 'acd') continue;

        Messages.push(new Promise((resolve, reject) => {
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
            let MessageDuration = '';
            if(daysAgo >= 1) MessageDuration += daysAgo + 'day(s) ';
            if(hoursAgo >= 1) MessageDuration += hoursAgo + 'hour(s) ';
            MessageDuration += minutesAgo + 'minute(s)';

            // Get message information for Message Subject and Body
            conversationsApi.getConversationsMessages(conversation.conversationId)
                .then((messages) => {
                    // Get the latest email message
                    let lastEntryIndex = messages.entities.length - 1;
                    let messageId = messages.entities[lastEntryIndex].id;

                    // Assign Subject String
                    emailSubject = messages.entities[lastEntryIndex].subject ?
                        messages.entities[lastEntryIndex].subject : emailSubject;

                    return conversationsApi
                        .getConversationsEmailMessage(conversation.conversationId, messageId);
                })
                .then((message) => {
                    // Assigne email values based from latest message
                    senderName = message.from.name ? message.from.name : senderName;
                    senderEmail = message.from.email ? message.from.email : senderEmail;
                    emailBody = message.textBody ? message.textBody : emailBody;
                })
                .then(() => {
                    resolve({
                        'senderName': senderName,
                        'senderEmail': senderEmail,
                        'emailDuration': emailDuration,
                        'emailSubject': emailSubject,
                        'emailBody': emailBody,
                        'conversationId': conversation.conversationId,
                        'acdParticipant':
                        conversation.participants[conversation.participants.length - 1]
                            .participantId
                    });
                })
                .catch((err) => {
                    console.log('Something went wrong');
                    console.error(err);
                    reject(err);
                });
        }));
    }

    return Promise.all(emails);
}

/**
 * Assign the Email conversation to the current agent
 * @param {String} conversationId PureCloud conversationId
 * @param {String} acdParticipantId ParticipantId of the acd participant
 */
function assignMessageToAgent(conversationId, acdParticipantId){
    view.showLoader('Assigning Message...');

    let body = {
        'userId': userId,
    };
    conversationsApi.postConversationParticipantReplace(conversationId, acdParticipantId, body)
        .then(() => {

            view.hideMessageBox(conversationId);
            view.hideLoader();
        })
        .catch((err) => {
            console.log(err);
        });
}

/**
 * Check Queue for new emails
 */
function refreshMessages(){
    view.showLoader('Gathering Messages...');
    view.hideBlankMessages();

    return getUnansweredMessagesFromQueue(queueId)
        .then((conversations) => {
            // mutate the information from emails to prepare for viewing
            return buildMessageInformation(conversations);
        })
        .then((messages) => {
            // Show the message info on the document
            view.clearMessageContainer();
            view.hideLoader();

            if(messages.length <= 0){
                view.showBlankMessages();
            }else{
                messages.forEach((message) => view.addMessageBox(message));
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

/**
 * Set-up a Notifications listener for new Message Conversations
 * entering the queue
 */
function setQueueListener(){
    let channel = {};
    let topicId = `v2.routing.queues.${queueId}.conversations.messages`;

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
                    setTimeout(refreshMessages, 3000);
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
        // Get Available Messages
        return refreshMessages();
    })
    .then(() => {
        // Set up queue listener
        return setQueueListener();
    })
    .catch((err) => {
        console.log(err);
    });

// Global assignment
window.assignMessageToAgent = assignMessageToAgent;
window.refreshMessages = refreshMessages;