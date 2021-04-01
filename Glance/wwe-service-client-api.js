/*!
 * @License INTERACTION WORKSPACE.web edition
 * Copyright (c) 2014-2015 Genesys Telecommunications Laboratories
 * All rights reserved.
 * FILE NAME:          wwe-service-client-api.js
 */

if(!window.genesys) genesys = window.genesys = {};
if(!window.genesys.wwe) window.genesys.wwe = {};
if(!window.genesys.wwe.service) {

	/**
	 * This is the WWE service client API.
	 * @constructor ServiceClientAPI
	 */
	var ServiceClientAPI = function()
	{
		var self = this,
			debug = true;
		
		// Public members
		
		/**
		 * Cleanup the object.
		 */
		this.unload = function() {
			var requestedEventsClone = requestedEvents.slice(0);
			for(var i = 0; i < requestedEventsClone.length; i++)
				removeEventRequest(requestedEventsClone[i]);
			requestedEvents = requestedEventsClone = [];
			window.removeEventListener("message", receiveMessage, false);
		};
		
		/**
		 * Parse a received command.
		 * @param {Window} sourceWindow The DOM source window of the message.
		 * @param {object} message The message to parse.
		 * @param {string} message.request The request.
		 * @param {object} [message.referenceId] An optional string pass in the answer event.
		 * @return {string} A reference identifier in case of a requested value.
		 */
		this.sendMessage = function(message, successCallback, failedCallback) {
			if(!message.referenceId) message.referenceId = "" + currentReferenceId++;
			//parent.postMessage(message, "*");
			postMessageToParentFrame(message);
			if(successCallback) {
		
				var newEventRequest = {
					referenceId: message.referenceId,
					promiseSuccessCallback: successCallback,
					promiseFailedCallback: failedCallback,
					timeoutToken: 0,
					callerThis: this
				};
				requestedEvents.push(newEventRequest);

				// After a 10 seconds timeout, the event with the specify referenceId is not found,
				// so, we reject the request.
				newEventRequest.timeoutToken = setTimeout(function() {
					try {
						if(failedCallback)
							failedCallback("Request timeout");
					} catch(e) {
						console.error("ServiceClientAPI: Error while resolving a requested event: " + e.toString());
					}
					removeEventRequest(newEventRequest);
				}, 10000);
			}
			return message.referenceId;
		};

		/**
		 * Subscribe to an events.
		 * @param {string|string[]} event The event name or an array of event name.
		 * @param {function} callback The callback function called when an event arrive.
		 * @param {object} [context] An optional context object to call the callback function with.
		 * @return {object} Itself.
		 */
		this.subscribe = function(event, callback, context) {
			this.sendMessage({
				event: "subscribe",
				data: event
			}, function(data) {
				// SUCCEEDED
				var subscription = {
					event: event,
					callback: callback,
					context: context,
					subscriptionId: data.subscriptionId
				};
				subscriptionsByCallback[callback] = subscription;
				if(Array.isArray(event))
					event.forEach(function(e) {
						subscriptionsByEventName[e] = subscription;
					});
				else
					subscriptionsByEventName[event] = subscription;
				
			}, function() {
				// FAILED
				console.error("ServiceClientAPI: Cannot subscribe to this event: " + event);
			});
			return this;
		};
		
		/**
		 * Unsubscribe to an events.
		 * @param {string} event The event name.
		 * @param {function} callback The callback function called when an event arrive.
		 * @return {object} Itself.
		 */
		this.unsubscribe = function(callback) {
			var subscription = subscriptionsByCallback[callback];
			if(subscription) {
				delete subscriptionsByCallback[callback];
				if(Array.isArray(subscription.event))
					subscription.event.forEach(function(e) {
						delete subscriptionsByEventName[subscription.event];
					});
				else
					delete subscriptionsByEventName[subscription.event];
				this.sendMessage({
					event: "unsubscribe",
					data: subscription.subscriptionId
				});
			}
			return this;
		};

		// Private members
		
		var currentReferenceId = 0,
			requestedEvents = [],
			subscriptionsByCallback = {},
			subscriptionsByEventName = {};

		
		/**
		 * Parse a received command.
		 * @param {object} message The message to parse.
		 * @private
		 */
		var postMessageToParentFrame = function(message) {
			message = message || {};
			message.userAgent = "WWE Client";
			if(window.opener)
				window.opener.postMessage(message, "*");
			else
				window.parent.postMessage(message, "*");
		};
		
		/**
		 * Remove the internal eventRequest object from the pending requestedEvents list.
		 * @param {object} eventRequest The internal eventRequest object.
		 * @return {boolean} true if the eventRequest has been found and removed; false otherwise.
		 * @private
		 */
		var removeEventRequest = function(eventRequest) {
			var pos = requestedEvents.indexOf(eventRequest);
			if(pos != -1) {
				requestedEvents.splice(pos, 1);
				if(eventRequest.timeoutToken) {
					clearTimeout(eventRequest.timeoutToken);
					eventRequest.timeoutToken = 0;
				}
				return true;
			}
			return false;
		};
		
		/**
		 * Handle global postMessage events.
		 * @param {object} message The received message event.
		 * @private
		 */
		var receiveMessage = function(message)
		{
			if(message && message.data && message.data.userAgent && message.data.userAgent.indexOf("WWE") != -1) {
				
				if(debug) console.log("ServiceClientAPI: receiveMessage: " + JSON.stringify(message.data, null, '\t'));
				if(message.data.event) {
					// We receive a subscribed event
					var subscription = subscriptionsByEventName[message.data.event];
					if(subscription) {
						try {
							subscription.callback.call(subscription.context || this, message.data);
						} catch(e) {
							console.error("Error while calling the event handler for event '" + message.data.event + "', " + e.toString());
						}
					}
				} else if(message.data.referenceId) {
					// We receive a request response
					for(var i = 0; i < requestedEvents.length; i++) {
						var requestedEvent = requestedEvents[i];
						if(requestedEvent && requestedEvent.referenceId == message.data.referenceId) {
							// Request found
							if(message.data.errorMessage != undefined) {
								// This is a failure
								if(requestedEvent.promiseFailedCallback) {
									try {
										if(message.data)
											delete message.data.referenceId;
										requestedEvent.promiseFailedCallback.call(requestedEvent.callerThis, message.data);
									} catch(e) {
										console.error("Error in the failed callback: " + e.toString());
									}
								}
							} else {
								// This is a success
								if(requestedEvent.promiseSuccessCallback) {
									try {
										if(message.data)
											delete message.data.referenceId;
										requestedEvent.promiseSuccessCallback.call(requestedEvent.callerThis, message.data);
									} catch(e) {
										console.error("Error in the success callback: " + e.toString());
									}
								}
							}
							removeEventRequest(requestedEvent);
						}
					}
				}
			} else if(window.genesys.wwe.service.onMessage && typeof(message.data) == "string" && message.data.indexOf("wwe") == 0)
				window.genesys.wwe.service.onMessage(message.data);
		};

		window.addEventListener("message", receiveMessage, false);
	};

	
	window.genesys.wwe.service = new ServiceClientAPI();
	
	
	
	var service = window.genesys.wwe.service;
	
	service.agent = {
		get: function(successCallback, failedCallback) {
			service.sendMessage({ request: "agent.get" }, successCallback, failedCallback);
		},
		getStateList: function(successCallback, failedCallback) {
			service.sendMessage({ request: "agent.getStateList" }, successCallback, failedCallback);
		},
		setState: function(stateListIndex, successCallback, failedCallback) {
			service.sendMessage({ request: "agent.setState", parameters: [ stateListIndex ] }, successCallback, failedCallback);
		},
		getState: function(successCallback, failedCallback) {
			service.sendMessage({ request: "agent.getState" }, successCallback, failedCallback);
		}
	};
		
	service.interaction = {
		getInteractions: function(successCallback, failedCallback) {
			service.sendMessage({ request: "interaction.getInteractions" }, successCallback, failedCallback);
		},
		getByInteractionId: function(interactionId, successCallback, failedCallback) {
			service.sendMessage({ request: "interaction.getByInteractionId", parameters: [ interactionId ] }, successCallback, failedCallback);
		},
		setUserData: function(interactionId, keyValues, successCallback, failedCallback) {
			service.sendMessage({ request: "interaction.setUserData", parameters: [ interactionId, keyValues ] }, successCallback, failedCallback);
		},
		deleteUserData: function(interactionId, key, successCallback, failedCallback) {
			service.sendMessage({ request: "interaction.deleteUserData", parameters: [ interactionId, key ] }, successCallback, failedCallback);
		}
	};
		
	service.voice = {
		dial: function(destination, userData, successCallback, failedCallback) {
			if(userData && typeof userData == "function") {
				failedCallback = successCallback;
				successCallback = userData;
				userData = null;
			}
			service.sendMessage({ request: "voice.dial", parameters: [ destination, userData ] }, successCallback, failedCallback);
		},
		startCallRecording: function(interactionId, successCallback, failedCallback) {
			service.sendMessage({ request: "voice.startCallRecording", parameters: [ interactionId ] }, successCallback, failedCallback);
		},
		stopCallRecording: function(interactionId, successCallback, failedCallback) {
			service.sendMessage({ request: "voice.stopCallRecording", parameters: [ interactionId ] }, successCallback, failedCallback);
		},
		pauseCallRecording: function(interactionId, successCallback, failedCallback) {
			service.sendMessage({ request: "voice.pauseCallRecording", parameters: [ interactionId ] }, successCallback, failedCallback);
		},
		resumeCallRecording: function(interactionId, successCallback, failedCallback) {
			service.sendMessage({ request: "voice.resumeCallRecording", parameters: [ interactionId ] }, successCallback, failedCallback);
		}
	};

	service.email = {
		create: function(destination, userData, successCallback, failedCallback) {
			if(userData && typeof userData == "function") {
				failedCallback = successCallback;
				successCallback = userData;
				userData = null;
			}
			service.sendMessage({ request: "email.create", parameters: [ destination, userData ] }, successCallback, failedCallback);
		}
	};

	service.media = {
		setState: function(mediaName, stateListIndex, successCallback, failedCallback) {
			service.sendMessage({ request: "media.setState", parameters: [ mediaName, stateListIndex ] }, successCallback, failedCallback);
		},
		getMediaList: function(successCallback, failedCallback) {
			service.sendMessage({ request: "media.getMediaList"}, successCallback, failedCallback);
		}
	};
	
	service.system = {
		getAllowedServices: function(successCallback, failedCallback) {
			service.sendMessage({ request: "system.getAllowedServices" }, successCallback, failedCallback);
		},
	};
}