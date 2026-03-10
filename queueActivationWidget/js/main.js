const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;
const routingApi = new platformClient.RoutingApi();
const usersApi = new platformClient.UsersApi();

// Configure your OAuth client settings
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('clientId') || 'YOUR_CLIENT_ID';
const redirectUri = window.location.href.split('?')[0];
const environment = 'mypurecloud.com'; // Change to your region

let userQueues = [];

client.setEnvironment(environment);
client.setPersistSettings(true);

document.getElementById('loginBtn').addEventListener('click', () => {
    client.loginImplicitGrant(clientId, redirectUri, { state: 'state' })
        .then(() => initializeApp())
        .catch(err => showStatus('Login failed: ' + err.message));
});

document.getElementById('selectAll').addEventListener('change', (e) => {
    document.querySelectorAll('.media-type').forEach(cb => cb.checked = e.target.checked);
});

document.getElementById('activateBtn').addEventListener('click', activateQueues);

// Check if already authenticated
client.loginImplicitGrant(clientId, redirectUri, { state: 'state' })
    .then(() => initializeApp())
    .catch(() => {});

async function initializeApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('queue-section').style.display = 'block';
    
    try {
        const user = await usersApi.getUsersMe({ expand: ['routingStatus'] });
        const queues = await routingApi.getUserQueues(user.id, { pageSize: 100 });
        userQueues = queues.entities || [];
        showStatus(`Loaded ${userQueues.length} queues`);
    } catch (err) {
        showStatus('Error loading queues: ' + err.message);
    }
}

async function activateQueues() {
    const selected = Array.from(document.querySelectorAll('.media-type:checked')).map(cb => cb.value);
    showStatus('Processing...');
    
    const updates = userQueues.map(queue => {
        const suffix = queue.name.split('_').pop();
        const joined = selected.includes(suffix);
        return routingApi.patchUserQueue(queue.id, usersApi.getUsersMe().then(u => u.id), { joined });
    });
    
    try {
        await Promise.all(updates);
        showStatus(`Activated: ${selected.join(', ')}`);
    } catch (err) {
        showStatus('Error: ' + err.message);
    }
}

function showStatus(msg) {
    document.getElementById('status').textContent = msg;
}
