const parkedCallContainer = document.getElementById('parkedCall-container');
const loader = document.getElementById('loader-icon');
const loaderText = document.getElementById('loader-text');
const noparkedCallText = document.getElementById('no-parkedCalls');

let parkedCallBoxTemplate = document.createElement('template');
parkedCallBoxTemplate.innerHTML =
`<div class="box">
    <article class="media">
    <div class="media-content">
        <div class="content">
        <p>
            On Queue: <small><span class="parkedCall-duration">31m</span></small>
            <br>
            From: <strong><span class="sender-name">John Smith</span></strong> <small><span class="sender-parkedCall">parkedCall@parkedCall.com</span></small> 
            <br>
            Subject: <strong><span class="parkedCall-subject">Subject</span></strong>
            <br>
            <div class="parkedCall-body">
                Body of parkedCall
            </div>
        </p>
        </div>
        <div>
            <a class="button is-dark btn-assign" onclick="assignparkedCallToAgent()">Assign To Me</a>
        </div>
    </div>
    </article>
</div>`;

export default {
    /**
     * Add an parkedCall box to the document
     * @param {Object} parkedCallData contains the parkedCall information
     */
    addparkedCallBox(parkedCallData){
        // Add the parkedCall box to the DOM
        let parkedCallView = document.importNode(parkedCallBoxTemplate.content, true);
        let parkedCallViewElement = parkedCallView.firstChild;
        parkedCallViewElement.id = parkedCallData.conversationId;
        parkedCallContainer.appendChild(parkedCallView);

        // Get references to dynamic elements
        let senderName = parkedCallViewElement.getElementsByClassName('sender-name')[0];
        let senderparkedCall = parkedCallViewElement.getElementsByClassName('sender-parkedCall')[0];
        let parkedCallDuration = parkedCallViewElement.getElementsByClassName('parkedCall-duration')[0];
        let parkedCallSubject = parkedCallViewElement.getElementsByClassName('parkedCall-subject')[0];
        let parkedCallBody = parkedCallViewElement.getElementsByClassName('parkedCall-body')[0];
        let btnAssign = parkedCallViewElement.getElementsByClassName('btn-assign')[0];
        
        // Assign values
        senderName.textContent = parkedCallData.senderName ? parkedCallData.senderName : null;
        senderparkedCall.textContent = parkedCallData.senderparkedCall ? parkedCallData.senderparkedCall : null;
        parkedCallDuration.textContent = parkedCallData.parkedCallDuration ? parkedCallData.parkedCallDuration : null;
        parkedCallSubject.textContent = parkedCallData.parkedCallSubject ? parkedCallData.parkedCallSubject : null;
        parkedCallBody.textContent = parkedCallData.parkedCallBody ? parkedCallData.parkedCallBody : null;

        // Assign onlcick action to button
        btnAssign.setAttribute('onclick', 
            'assignparkedCallToAgent(' + 
                `"${parkedCallData.conversationId}",` +
                `"${parkedCallData.acdParticipant}",` +
            ')'); 
    },

    /**
     * Hide an parkedCall box when user assigns it to agent
     * @param {String} id 
     */
    hideparkedCallBox(id){
        document.getElementById(id).style.display = 'none';
    },

    /**
     * Shows the loader/spinner in the page
     * @param {String} text Loading Text
     */
    showLoader(text){
        loader.style.display = 'block';
        parkedCallContainer.style.display = 'none';

        loaderText.textContent = text ? text : 'Loading...';
    },

    /**
     * Hide the loader/spinner
     */
    hideLoader(){
        loader.style.display = 'none';
        parkedCallContainer.style.display = 'block';

    },

    /**
     * Removes all parkedCall panels from the container
     */
    clearparkedCallContainer(){
        while(parkedCallContainer.firstChild) {
            parkedCallContainer.firstChild.remove();
        }
    },
    
    /**
     * Show message that informs that there are no available parkedCalls
     */
    showBlankparkedCalls(){
        noparkedCallText.style.display = 'block';
    },

    /**
     * Hide message that informs that there are no available parkedCalls
     */
    hideBlankparkedCalls(){
        noparkedCallText.style.display = 'none';
    },
};