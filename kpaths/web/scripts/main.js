/** --------------------------------------------------------------
 *                       EVENT HANDLERS
 * -------------------------------------------------------------- */
document.getElementById('chat-form')
    .addEventListener('submit', () => sendChat());

document.getElementById('btn-send-message')
    .addEventListener('click', () => sendChat());

document.getElementById('message-textarea')
    .addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendChat();
            if(e.preventDefault) e.preventDefault(); // prevent new line
            return false; // Just a workaround for old browsers
        }
    });

