const emailContainer = document.getElementById('message-container');
const loader = document.getElementById('loader-icon');
const loaderText = document.getElementById('loader-text');
const noEmailText = document.getElementById('no-messages');

let messageTemplate = document.createElement('template');
messageTemplate.innerHTML =
`<div class="row">
        <div class="col">
            <p>
                On Queue: <small><span class="message-duration">31m</span></small>
                <br>
                From: <strong><span class="sender-name">John Smith</span></strong> <small><span class="sender-email">email@email.com</span></small> 
                <br>
                Subject: <strong><span class="email-subject">Subject</span></strong>
                <br>
                <div class="email-body">
                    Body of email
                </div>
            </p>
        </div>
        <div class="col">
            <a class="button is-dark btn-assign" onclick="assignMessageToAgent()">Assign To Me</a>
        </div>
</div>`;

export default {
    /**
     * Add an message to the document
     * @param {Object} messageData contains the message information
     */
    addMessage(messageData){
        // Add the message box to the DOM
        let messageView = document.importNode(messageTemplate.content, true);
        let messageViewElement = messageView.firstChild;
        messageViewElement.id = messageData.conversationId;
        messageContainer.appendChild(messageView);

        // Get references to dynamic elements
        // let senderName = messageViewElement.getElementsByClassName('sender-name')[0];
        // let sendermessage = messageViewElement.getElementsByClassName('sender-message')[0];
        let messageDuration = messageViewElement.getElementsByClassName('message-duration')[0];
        // let messageSubject = messageViewElement.getElementsByClassName('message-subject')[0];
        // let messageBody = messageViewElement.getElementsByClassName('message-body')[0];
        let btnAssign = messageViewElement.getElementsByClassName('btn-assign')[0];
        
        // Assign values
        // senderName.textContent = messageData.senderName ? messageData.senderName : null;
        // sendermessage.textContent = messageData.sendermessage ? messageData.sendermessage : null;
        messageDuration.textContent = messageData.messageDuration ? messageData.messageDuration : null;
        // messageSubject.textContent = messageData.messageSubject ? messageData.messageSubject : null;
        //messageBody.textContent = messageData.messageBody ? messageData.messageBody : null;

        // Assign onlcick action to button
        btnAssign.setAttribute('onclick', 
            'assignMessageToAgent(' + 
                `"${messageData.conversationId}",` +
                `"${messageData.acdParticipant}",` +
            ')'); 
    },

    /**
     * Hide an email box when user assigns it to agent
     * @param {String} id 
     */
    hideMessage(id){
        document.getElementById(id).style.display = 'none';
    },

    /**
     * Shows the loader/spinner in the page
     * @param {String} text Loading Text
     */
    showLoader(text){
        loader.style.display = 'block';
        messageContainer.style.display = 'none';

        loaderText.textContent = text ? text : 'Loading...';
    },

    /**
     * Hide the loader/spinner
     */
    hideLoader(){
        loader.style.display = 'none';
        messageContainer.style.display = 'block';

    },

    /**
     * Removes all Message panels from the container
     */
    clearEmailContainer(){
        while(messageContainer.firstChild) {
            messageContainer.firstChild.remove();
        }
    },
    
    /**
     * Show message that informs that there are no available messages
     */
    showBlankMessages(){
        noMessageText.style.display = 'block';
    },

    /**
     * Hide message that informs that there are no available messages
     */
    hideBlankMessages(){
        noMessageText.style.display = 'none';
    },
};