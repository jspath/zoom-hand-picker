let zoomSdk;
let participants = [];
let isConnected = false;

// Initialize Zoom App
async function initZoomApp() {
    try {
        // Create Zoom SDK instance
        zoomSdk = new ZoomSdk();
        
        // Configure SDK with required capabilities
        await zoomSdk.config({
            capabilities: [
                'getMeetingParticipants',
                'getMeetingContext',
                'onParticipantChange'
            ],
            version: '0.16.0'
        });
        
        updateStatus(true, 'Connected to Zoom');
        isConnected = true;
        
        // Fetch initial participants
        await fetchParticipants();
        
        // Listen for participant changes
        zoomSdk.addEventListener('onParticipantChange', handleParticipantChange);
        
    } catch (error) {
        console.error('Failed to initialize Zoom SDK:', error);
        updateStatus(false, 'Failed to connect to Zoom');
        showError('Could not connect to Zoom. Make sure you are running this in a Zoom meeting.');
    }
}

// Fetch meeting participants
async function fetchParticipants() {
    if (!zoomSdk) return;
    
    try {
        const response = await zoomSdk.getMeetingParticipants();
        participants = response.participants || [];
        updateUI();
        hideError();
    } catch (error) {
        console.error('Failed to fetch participants:', error);
        showError('Could not fetch participants. Please try refreshing.');
    }
}

// Handle participant changes in real-time
function handleParticipantChange(event) {
    console.log('Participant change:', event);
    fetchParticipants();
}

// Pick a random person with hand raised
function pickRandomPerson() {
    const raisedHands = participants.filter(p => p.bRaiseHand);
    
    if (raisedHands.length === 0) {
        showError('No hands are currently raised!');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * raisedHands.length);
    const selected = raisedHands[randomIndex];
    
    displaySelectedUser(selected);
    hideError();
}

// Update status indicator
function updateStatus(connected, message) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Hide error message
function hideError() {
    document.getElementById('error').style.display = 'none';
}

// Display selected user
function displaySelectedUser(user) {
    const selectedEl = document.getElementById('selectedUser');
    selectedEl.innerHTML = `
        <h2>Call on:</h2>
        <div class="name">${user.displayName}</div>
    `;
    selectedEl.className = 'selected-user';
    selectedEl.style.display = 'block';
}

// Update the entire UI
function updateUI() {
    const raisedHandsCount = participants.filter(p => p.bRaiseHand).length;
    
    // Update hand count
    document.getElementById('handCount').textContent = raisedHandsCount;
    
    // Enable/disable pick button
    document.getElementById('pickBtn').disabled = raisedHandsCount === 0;
    
    // Update participants list
    const participantsEl = document.getElementById('participants');
    participantsEl.innerHTML = participants.map(p => `
        <div class="participant ${p.bRaiseHand ? 'hand-raised' : 'normal'}">
            <span>${p.displayName}</span>
            ${p.bRaiseHand ? '<span>✋</span>' : ''}
        </div>
    `).join('');
}

// Event listeners
document.getElementById('pickBtn').addEventListener('click', pickRandomPerson);
document.getElementById('refreshBtn').addEventListener('click', fetchParticipants);

// Initialize on load
window.addEventListener('DOMContentLoaded', initZoomApp);
