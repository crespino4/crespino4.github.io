/* 
*   NOTE: This sample uses ES6.
*/
import appConfig from '../wizard/config/config.js';
import config from './config.js';

let clientApp = {}; 

// PureCloud OAuth information
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

// API instances
const usersApi = new platformClient.UsersApi();
const notificationsApi = new platformClient.NotificationsApi();
const analyticsApi = new platformClient.AnalyticsApi();
const routingApi = new platformClient.RoutingApi();
const ConversationsApi = new platformClient.ConversationsApi();

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

    
    pcEnv = appConfig.defaultPcEnvironment;
    
    langTag =  appConfig.defaultLanguage;

    let clientId = appConfig.clientIDs[pcEnv];
    clientApp.langTag = langTag;
    clientApp.pcEnv = pcEnv;

    // Authenticate via PureCloud
    client.setPersistSettings(true, appConfig.appName);
    client.setEnvironment(pcEnv);

    return client.loginImplicitGrant(clientId, config.basePath + pagePath, appConfig.appName)
    .then(data => {
        console.log(data);
        
        // Get Details of current User and save to Client App
        return usersApi.getUsersMe();
    }).then( userMe => {
        console.log("userMe",userMe);
        clientApp.userId = userMe.id;
        if(userMe.email !="" ){
            var manageError = {};
            manageError.status = 0;
            manageError.message = "";
            var ApiName = 'create_token';                   
            $.ajax({
                type: "GET",
                url: config.apiURL+ApiName,
                crossDomain: true,
                data: '',
                dataType: 'json', 
                async : false,       
                beforeSend: function(xhr){                    
                },
                success: function (response) {
                    if(response.settings.success==1){                            
                        var access_token = response.data.ws_token;                        
                        $.ajax({
                            type: "POST",
                            url: config.apiURL+'check_genesys_expert',
                            crossDomain: true,
                            async : false,  
                            data: {ws_token:access_token,email:userMe.email},
                            dataType: 'json', 
                            success: function (expertResponse) {                                
                                if(expertResponse.settings.success === "0"){
                                    manageError.status = 1;
                                    manageError.message = "Unable to get user detail.";
                                }else if(expertResponse.settings.success === "2"){
                                    $('#default-err-div').hide();
                                    $('#subscription-err').show();
                                    $('#success-div-ifream').show();
                                }else{
                                    loadiFame(expertResponse);
                                }
                            },
                            error: function (err) {                                    
                                //alert('Something went wrong whle verfifying user.');
                                manageError.status = 1;
                                manageError.message = "Something went wrong while verfifying user.";

                            }
                        });
                    }else{                        
                        manageError.status = 1;
                        manageError.message = "Unable to get token.";
                    }            
                },
                error: function (err) {                          
                    manageError.status = 1;
                    manageError.message = "Something went wrong. while getting token";
                }
            });

            if(manageError.status===1){
                throw new Error(manageError.message);
            }
        }else{
            throw new Error('Unable to get user detial')
        }
        //

        // Create a Notifications Channel
        return notificationsApi.postNotificationsChannels();
    }).then(data => {
        //console.log("data",data);
        clientApp.websocketUri = data.connectUri;
        clientApp.channelID = data.id;
        clientApp.socket = new WebSocket(clientApp.websocketUri);
        clientApp.socket.onmessage = clientApp.onSocketMessage;
        clientApp.topicIdAgent = "v2.users." + clientApp.userId + ".conversations.calls";
        
        // Subscribe to Call Conversations of Current user.
        let topic = [{"id": clientApp.topicIdAgent}];
        return notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
    }).then(() => {
        return $.getJSON('./language.json', (data) => {
            clientApp.languageData = data[clientApp.langTag];
        });
    }).then(data =>{ 
        console.log("Succesfully set-up Client App.")
        $('#loading-modal').hide();
    })
    // Error Handling
    .catch(e => {
        $('#default-errmessage').text(e);
        $('#default-err-div').show();
        $('#loading-modal').hide();
        console.log('this is error >>>> ',e)
    });
};

// Handler for every Websocket message
clientApp.onSocketMessage = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;
    let eventBody = data.eventBody;

    //console.log(topic);
    //console.log(eventBody);
    
    // If a voice interaction (from queue) comes in
    if(topic === clientApp.topicIdAgent){
        let caller = eventBody.participants.filter(participant => participant.purpose === "customer")[0];
        let agent = eventBody.participants.filter(participant => participant.purpose === "agent")[0];

        // Put values to the fields
        if((caller.endTime !== undefined) && (!clientApp.isCallActive)){
            $("#callerName").text("");
            $("#callerNumber").text("");
            $("#callerArea").text("");

            clientApp.isCallActive = false;
        } else if(agent.state === "alerting") {
            let callerLocation = '';

            $("#callerName").text(caller.name);
            $("#callerNumber").text(caller.address);

            getLocalInfo(caller.address,{
                military: false,
                zone_display: 'area'
                }, object => {
                    $("#callerArea").text(object.time.display +' '+ object.location);
                    callerLocation = object.location;
                }
            );
            
            // Makes sure that the field only changes the first time. 
            clientApp.isCallActive = true;
            
            clientApp.toastIncomingCall(callerLocation);
        } else {
            clientApp.isCallActive = false;
        }
    }
};

clientApp.toastIncomingCall = function(callerLocation){
    if(clientApp.hasOwnProperty('purecloudClientApi')){
        if(clientApp.langTag !== null) {
            clientApp.purecloudClientApi.alerting.showToastPopup(clientApp.language[clientApp.langTag].IncomingCall, clientApp.language[clientApp.langTag].From + ": " + callerLocation);
        } else {
            clientApp.purecloudClientApi.alerting.showToastPopup(clientApp.language["en-us"].IncomingCall, clientApp.language["en-us"].From + ": " + callerLocation);
        }        
    }
};

clientApp.loadSupervisorView = function(){
    // Get all Queues
    var body = { pageSize : 300 };

    routingApi.getRoutingQueues(body)
    .then(data => {
        let queues = data.entities;

        let dropdown = $('#ddlQueues');
        dropdown.empty();
        dropdown.append('<option selected="true" disabled">Queues</option>');
        dropdown.prop('selectedIndex', 0);

        for (var i = 1; i < queues.length; i++) {
            dropdown.append($('<option></option>').attr('value', queues[i].id).text(queues[i].name));
        }
    });
};

clientApp.subscribeToQueue = function(queue){
    // Check if there is an active conversation
    clientApp.getActiveConversation(queue);

    // Subscribe to Conversations of selected queue.
    clientApp.socket.onmessage = clientApp.onSocketMessageQueue;
    clientApp.topicIdSup = "v2.routing.queues." + queue + ".conversations";

    let topic = [{"id": clientApp.topicIdSup}];
    notificationsApi.postNotificationsChannelSubscriptions(clientApp.channelID, topic);
};

clientApp.getActiveConversation = function(queue){
    var startDt = new Date();
    startDt.setHours(0,0,0,0);
    startDt.toUTCString();
    var endDt = new Date(startDt + 1);
    endDt.setHours(24,0,0,0);
    endDt.toUTCString();

    var body = 
        {
            interval: startDt.toJSON() + "/" + endDt.toJSON(),
            order: "asc",
            orderBy: "conversationStart",
            paging: {
                pageSize: 25,
                pageNumber: 1
            },
            segmentFilters: [
                {
                    type: "and",
                    predicates: [
                        {
                            type: "dimension",
                            dimension: "queueId",
                            operator: "matches",
                            value: queue
                        }
                    ]
                }
            ],
            conversationFilters: [
                {
                    type: "or",
                    predicates: [
                        {
                            type: "dimension",
                            dimension: "conversationEnd",
                            operator: "notExists",
                            value: null
                        }
                    ]
                }
            ]
        };

    analyticsApi.postAnalyticsConversationsDetailsQuery(body)
    .then(data => {
        if(Object.keys(data).length > 0) {
            (data.conversations).forEach(function(conversation) {
                let caller = conversation.participants.filter(participant => participant.purpose === "external")[0];            
                let acd = conversation.participants.filter(participant => participant.purpose === "acd")[0];
                let acdSegment = acd.sessions[0].segments.filter(segment => segment.segmentType === "interact")[0];
                let agent = conversation.participants.filter(participant => participant.purpose === "agent")[0];

                if(caller === null) {
                    caller = conversation.participants.filter(participant => participant.purpose === "customer")[0];
                }

                // Get values to insert in table
                var id = conversation.conversationId;
                var name = caller.participantName;
                var type;
                var ani;
                var dnis;
                var state;
                var wait;
                var duration;
                
                if(caller.sessions[0].mediaType === "voice") {
                    type = "Call";
                    ani = caller.sessions[0].ani;
                    dnis = caller.sessions[0].dnis;                    
                } else if(caller.sessions[0].mediaType === "chat") {
                    type = "Chat";
                    ani = caller.sessions[0].roomId;
                    dnis = caller.sessions[0].roomId;
                } else if(caller.sessions[1].mediaType === "callback") {
                    type = "Callback";
                    ani = caller.sessions[0].ani;
                    dnis = caller.sessions[0].dnis;
                } else if(caller.sessions[1].mediaType === "email") {
                    type = "Email";
                    ani = caller.sessions[0].addressSelf;
                    dnis = caller.sessions[0].addressFrom;
                }

                if(agent !== undefined) {
                    // If active call
                    state = "connected";
                    wait = new Date(new Date(acdSegment.segmentEnd) - (new Date(acdSegment.segmentStart))).toISOString().slice(11, -1);

                    clientApp.insertRow(id, type, name, ani, dnis, state, wait, duration);
                    clientApp.startDurationTimer(id, new Date(acdSegment.segmentStart));
                } else {
                    // Caller on queue
                    state = "on queue";

                    clientApp.insertRow(id, type, name, ani, dnis, state, wait, duration);
                    clientApp.startDurationTimer(id, new Date(acdSegment.segmentStart));
                    clientApp.startWaitTimer(id, new Date(acdSegment.segmentStart));
                }
            });            
        }
    }).catch(e => console.log("ERROR CALLING API: " + e + "|| REQUEST BODY: " + JSON.stringify(body)));
};

// Handler for every Websocket message
clientApp.onSocketMessageQueue = function(event){
    let data = JSON.parse(event.data);
    let topic = data.topicName;

    // If an interaction (from queue) comes in
    if(topic === clientApp.topicIdSup){
        // Check to see if Conversation details is already displayed in the view
        if ($('#tblCallerDetails td:contains(' + data.eventBody.id + ')').length) {
            clientApp.updateTableRow(data);            
        } else {
            clientApp.addTableRow(data);
        }
    }
};

clientApp.addTableRow = function(data) {
    let caller = data.eventBody.participants.filter(participant => participant.purpose === "customer")[0];    
    let agent = data.eventBody.participants.filter(participant => participant.purpose === "agent")[0];    
    let acd = data.eventBody.participants.filter(participant => participant.purpose === "acd")[0];
    
    // Call Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.calls[0].state === "connected")) {
            // Call on queue
            clientApp.insertRow(data.eventBody.id, "Call", caller.name, caller.address, caller.calls[0].other.addressNormalized, "on queue");            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            clientApp.insertRow(data.eventBody.id, "Call", caller.name, caller.address, caller.calls[0].other.addressNormalized, agent.calls[0].state);            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = true;
        }
    }    

    // Chat Conversation Type
    if((caller.calls === undefined) && (caller.chats !== undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.chats[0].state === "connected")) {
            // Chat on queue
            clientApp.insertRow(data.eventBody.id, "Chat", caller.name, caller.address, caller.chats[0].roomId, "on queue");            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming chat
            clientApp.insertRow(data.eventBody.id, "Chat", caller.name, caller.address, caller.chats[0].roomId, agent.calls[0].state);            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = true;
        }
    }

    // Callback Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks !== undefined) && (caller.emails === undefined)) {
        if ((agent === undefined) && (acd.callbacks[0].state === "connected")) {
            // Callback on queue
            clientApp.insertRow(data.eventBody.id, "Callback", caller.name, caller.address, caller.calls[0].other.addressNormalized, "on queue");            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming callback
            clientApp.insertRow(data.eventBody.id, "Callback", caller.name, caller.address, caller.calls[0].other.addressNormalized, agent.callbacks[0].state);            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = true;
        }
    }

    // Email Conversation Type
    if((caller.calls === undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails !== undefined)) {
        if ((agent === undefined) && (acd.emails[0].state === "connected")) {
            // Email on queue
            clientApp.insertRow(data.eventBody.id, "Email", caller.name, caller.address, acd.address, "on queue");            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming email
            clientApp.insertRow(data.eventBody.id, "Email", caller.name, caller.address, acd.address, agent.emails[0].state);            
            clientApp.startDurationTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.startWaitTimer(data.eventBody.id, new Date(acd.connectedTime));
            clientApp.isCallActiveSup = true;
        }
    }
};

clientApp.updateTableRow = function(data) {
    let caller = data.eventBody.participants.filter(participant => participant.purpose === "customer")[0];
    let agent = data.eventBody.participants.filter(participant => participant.purpose === "agent")[0];    
    let acd = data.eventBody.participants.filter(participant => participant.purpose === "acd")[0];

    // Call Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming call
            clientApp.updateRow(data, agent.calls[0].state, $("#Wait" + data.eventBody.id).text(), $("#Duration" + data.eventBody.id).text());
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active call
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.calls[0].state, wait, $("#Duration" + data.eventBody.id).text());
            clientApp.stopWaitTimer(data.eventBody.id);
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected call
            if (agent.calls[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.calls[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }
    
    // Chat Conversation Type
    if((caller.calls === undefined) && (caller.chats !== undefined) && (caller.callbacks === undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming chat
            clientApp.updateRow(data, agent.chats[0].state, $("#Wait" + data.eventBody.id).text(), $("#Duration" + data.eventBody.id).text());
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active chat
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.chats[0].state, wait, $("#Duration" + data.eventBody.id).text());
            clientApp.stopWaitTimer(data.eventBody.id);
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected chat
            if (agent.chats[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.chats[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }

    // Callback Conversation Type
    if((caller.calls !== undefined) && (caller.chats === undefined) && (caller.callbacks !== undefined) && (caller.emails === undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming callback
            clientApp.updateRow(data, agent.callbacks[0].state, $("#Wait" + data.eventBody.id).text(), $("#Duration" + data.eventBody.id).text());
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active callback
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.callbacks[0].state, wait, $("#Duration" + data.eventBody.id).text());
            clientApp.stopWaitTimer(data.eventBody.id);
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected callback
            if (agent.callbacks[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.callbacks[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }

    // Email Conversation Type
    if((caller.calls === undefined) && (caller.chats === undefined) && (caller.callbacks === undefined) && (caller.emails !== undefined)) {
        if((acd.endTime === undefined) && (!clientApp.isCallActiveSup) && (agent !== undefined)){
            // If incoming email
            clientApp.updateRow(data, agent.emails[0].state, $("#Wait" + data.eventBody.id).text(), $("#Duration" + data.eventBody.id).text());
            clientApp.isCallActiveSup = false;
        } else if((acd.endTime !== undefined) && (caller.endTime === undefined) && (agent !== undefined)) {
            // If active email
            var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
            clientApp.updateRow(data, agent.emails[0].state, wait, $("#Duration" + data.eventBody.id).text());
            clientApp.stopWaitTimer(data.eventBody.id);
            clientApp.isCallActiveSup = true;
        } else if(agent !== undefined) {
            // If disconnected email
            if (agent.emails[0].state === "disconnected") {                
                var wait = new Date((new Date(acd.connectedTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                var duration = new Date((new Date(caller.endTime)) - (new Date(caller.connectedTime))).toISOString().slice(11, -1);
                clientApp.updateRow(data, agent.emails[0].state, wait, duration);
                clientApp.isCallActiveSup = false;
            }        
        }
    }
};

clientApp.startDurationTimer = function(id, acdConnectedDt) {
    // Set timer for duration
	var intervalId1 = setInterval(function() {	
        var currentDate = new Date();
		$("#Duration" + id).text(new Date(currentDate - acdConnectedDt).toISOString().slice(11, -1).split('.')[0]);	
	}, 1000);	
	$("#Duration" + id).attr("wait-timer-id",intervalId1);
}

clientApp.startWaitTimer = function(id, acdConnectedDt) {
    // Set timer for wait time
	var intervalId = setInterval(function() {	
        var currentDate = new Date();
		$("#Wait" + id).text(new Date(currentDate - acdConnectedDt).toISOString().slice(11, -1).split('.')[0]);	
	}, 1000);	
	$("#Wait" + id).attr("wait-timer-id",intervalId);
}

clientApp.stopWaitTimer = function(id) {
    // Stop wait timer
    window.clearInterval($("#Wait" + id).attr("wait-timer-id"));
}

clientApp.insertRow = function(id, type, name, ani, dnis, state, wait, duration) {
    // Create table row
    var tableRef = document.getElementById('tblCallerDetails').getElementsByTagName('tbody')[0];
    var newRow = tableRef.insertRow(tableRef.rows.length);
    
    // Create Cell columns
    var idCell = newRow.insertCell(0);
    var typeCell = newRow.insertCell(1);
    var nameCell = newRow.insertCell(2);
    var aniCell = newRow.insertCell(3);
    var dnisCell = newRow.insertCell(4);
    var stateCell = newRow.insertCell(5);
    var waitCell = newRow.insertCell(6);
    var durationCell = newRow.insertCell(7);

    // Create text nodes
    var idText = document.createTextNode(id);
    var typeText = document.createTextNode(type);
    var nameText = document.createTextNode(name);
    var aniText = document.createTextNode(ani);
    var dnisText = document.createTextNode(dnis);
    var stateText = document.createTextNode(state);
    var waitText = document.createTextNode(wait);
    var durationText = document.createTextNode(duration);

    // Append text nodes to cell columns
    idCell.appendChild(idText);
    typeCell.appendChild(typeText);
    nameCell.appendChild(nameText);
    aniCell.appendChild(aniText);
    dnisCell.appendChild(dnisText);
    stateCell.appendChild(stateText);
    waitCell.appendChild(waitText);
    durationCell.appendChild(durationText);

    // CSS styles
    idCell.style.padding = "5px";
    typeCell.style.padding = "5px";
    nameCell.style.padding = "5px";
    aniCell.style.padding = "5px";
    dnisCell.style.padding = "5px";
    stateCell.style.padding = "5px";
    waitCell.style.padding = "5px";
    durationCell.style.padding = "5px";

    // Make sure Conversation ID column is always hidden
    idCell.hidden = true;

    // Create element ID for timers
    waitCell.setAttribute("id", "Wait" + id);
    durationCell.setAttribute("id", "Duration" + id);
};

clientApp.updateRow = function(data, state, wait, duration) {
    $('#tblCallerDetails > tbody> tr').each(function() {
        var firstTd = $(this).find('td:first');
        if ($(firstTd).text() == data.eventBody.id) {
            if(state === "disconnected") {
                // Stop duration timer
                window.clearInterval($("#Duration" + data.eventBody.id).attr("wait-timer-id"));

                // Remove row from table
                var thisRow = $(this);
                thisRow.remove();                
            } else {
                $(this).find('td:eq(5)').text(state);
                $(this).find('td:eq(6)').text(wait);
                $(this).find('td:eq(7)').text(duration);
            }
            
        }
    })
};

function updateCallDetailOnGenesy(callCaseId){
    if(callCaseId !="" ){    
        var conversationId = "";
        var participantId = "";  
        ConversationsApi.getConversations()
        .then((data) => {
            conversationId = data.entities[0].id;  
            participantId = data.entities[0].participants[0].id;
            // console.log(`getConversations success! data: ${JSON.stringify(data, null, 2)}`);
            //alert(conversationId);

            $.ajax({
                type: "POST",
                url: config.apiURL+'get_call_detail_by_call_case',
                crossDomain: true,
                async : false,  
                data: {call_case_id:callCaseId},
                dataType: 'json', 
                success: function (callreportResp) {                                
                    if(callreportResp.settings.success === "1"){
                        console.log("Call report",callreportResp.data);
                        var body = {
                            "attributes":{
                                "tethrit_call_case_id":callreportResp.data.call_detail_by_case_id[0].cl_call_code,
                                "tethrit_call_duration":callreportResp.data.call_detail_by_case_id[0].cl_call_duration,
                                "tethrit_call_date": callreportResp.data.call_detail_by_case_id[0].cl_call_start_at,
                                //"tethrit_call_ended_at": callreportResp.data.call_detail_by_case_id[0].cl_call_end_at,
                                "tethrit_expert_notes": callreportResp.data.call_detail_by_case_id[0].cl_expert_notes,
                                "tethrit_call_status": callreportResp.data.call_detail_by_case_id[0].cl_status,
                                "tethrit_gps_coordinates": callreportResp.data.call_detail_by_case_id[0].gps_lat_long,
                                "tethrit_gps_address": callreportResp.data.call_detail_by_case_id[0].gps_address,
                                "tethrit_invite_mode": callreportResp.data.call_detail_by_case_id[0].invite_mode,
                                "tethrit_expert_name": callreportResp.data.call_detail_by_case_id[0].ma_name,
                                "tethrit_refrence_text": callreportResp.data.call_detail_by_case_id[0].reference_text,
                                "tethrit_guest_device": callreportResp.data.call_detail_by_case_id[0].cl_guest_device_detail
                            }
                        }; 
                        if(callreportResp.data.call_media_detail.length > 0){
                            var mediaCounter = 1;
                            var recordCounter = 1;
                            for (let i = 0; i < callreportResp.data.call_media_detail.length; i++) {
                                var mediaFileName = callreportResp.data.call_media_detail[i].clm_media_file_name;
                                var mediaType = callreportResp.data.call_media_detail[i].clm_media_type;
                                var mediaStatus = callreportResp.data.call_media_detail[i].clm_status;

                                if(mediaType == 'Image'){
                                    body.attributes['tethrit_call_media_'+mediaCounter] = mediaFileName;
                                    mediaCounter++;
                                }else{
                                    body.attributes['tethrit_call_recording_'+recordCounter] = mediaFileName;
                                    recordCounter++;
                                }                               
                                
                            }
                        }
                        console.log('body',body);
                        ConversationsApi.patchConversationsCallbackParticipantAttributes(conversationId, participantId, body)
                        .then(() => {
                            console.log('patchConversationsCallbackParticipantAttributes returned successfully.');
                        })
                        .catch((err) => {
                            console.log('There was a failure calling patchConversationsCallbackParticipantAttributes');
                            console.error(err);
                        });
                    }else{
                        console.log("Unable to get callreport by case id",callreportResp);
                    }
                },
                error: function (err) {                                    
                    console.log("Unable to get callreport by case id Err:",err);
                }
            });
            
        })
        .catch((err) => {
            console.log('There was a failure calling getConversations');
            console.log(err);
        });
    }
 
}

    window.addEventListener('message', function(event){
        if(event.data.action == 'CALL_END'){            
            console.log("<< Call back from signaling js with caseid: >>",event.data.call_caseId);            
            updateCallDetailOnGenesy(event.data.call_caseId)
        }
    });

function loadiFame(expertResponse){    
    var ExpertToke = expertResponse.data.expert_detail.token;
    var ifreamUrl = config.iframeURL+'expert.html?token='+ExpertToke+'&source=Genesys';
    $('#default-err-div').hide();
    $('#subscription-err').hide();
    
    $('#success-div-ifream').append('<iframe id="console_iframe" src="'+ifreamUrl+'" width="100%" style="border-width:0px;" allow="camera; microphone; display-capture"></iframe>');

    //var headerEle = document.getElementById('premium-app-header');        
    document.getElementById("console_iframe").style.height = (window.innerHeight - 3)+"px";
    /*
    $('<iframe />');  
    $('<iframe />', {
        name: 'console_iframe',
        id: 'console_iframe',
        src: host
    }).appendTo('#success-div-ifream');*/

    // <iframe id="console_iframe" src="<%$this->config->item('site_url')%>expert.html?token=<%$this->general->encryptDataMethod($this->session->userdata('iAdminId'))%>&expert_rm_token=<%$expert_rm_token%>&call_routing_type=<%$call_routing_type%>&expertHelp=<%$expertHelp%>" width="100%" style="border-width:0px;"></iframe>
}
export default clientApp
clientApp.setup();
