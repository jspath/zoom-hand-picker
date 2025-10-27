(function() {
    'use strict';
    
    // Application state
    const appState = {
        sdk: null,
        participants: [],
        isConnected: false
    };
    
    // Debug logging
    function debug(message) {
        console.log(message);
        const debugEl = document.getElementById('debug');
        if (debugEl) {
            debugEl.textContent = message;
        }
    }
    
    // Wait for Zoom SDK to be available
    function waitForZoomSdk() {
        debug('Checking for ZoomSdk...');
        
        if (typeof ZoomSdk !== 'undefined') {
            debug('ZoomSdk found! Initializing...');
            initZoomApp();
        } else {
            debug('ZoomSdk not found, retrying...');
            setTimeout(waitForZoomSdk, 200);
        }
    }
    
    // Initialize Zoom App
    async function initZoomApp() {
        try {
            debug('Creating ZoomSdk instance...');
            appState.sdk = new ZoomSdk();
            
            debug('Configuring SDK...');
            const configResponse = await appState.sdk.config({
                capabilities: [
                    'getMeetingParticipants',
                    'onParticipantChange'
                ],
                version: '0.16'
            });
            
            debug('SDK configured successfully!');
            console.log('Config response:', configResponse);
            
            updateStatus(true, 'Connected to Zoom');
            appState.isConnected = true;
            
            // Fetch initial participants
            await fetchParticipants();
            
            // Listen for participant changes
            appState.sdk.onParticipantChange((event) => {
                console.log('Participant change:', event);
                fetchParticipants();
            });
            
        } catch (error) {
            console.error('Failed to initialize Zoom SDK:', error);
            debug('Error: ' + error.message);
            updateStatus(false, 'Failed to connect to Zoom');
            showError('Could not connect to Zoom. Error: ' + error.message);
        }
    }
    
    // Fetch meeting participants
    async function fetchParticipants() {
        if (!appState.sdk) {
            debug('Cannot fetch participants - SDK not initialized');
            return;
        }
        
        try {
            debug('Fetching participants...');
            const response = await appState.sdk.getMeetingParticipants();
            console.log('Participants response:', response);
            
            appState.participants = response.participants || [];
            debug(`Found ${appState.participants.length} participants`);
            
            updateUI();
            hideError();
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            debug('Fetch error: ' + error.message);
            showError('Could not fetch participants: ' + error.message);
        }
    }
    
    // Pick a random person with hand raised
    function pickRandomPerson() {
        const raisedHands = appState.participants.filter(p => p.bRaiseHand);
        
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
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status ${connected ? 'connected' : 'disconnected'}`;
        }
    }
    
    // Show error message
    function showError(message) {
        const errorEl = document.getElementById('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    // Hide error message
    function hideError() {
        const errorEl = document.getElementById('error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    
    // Display selected user
    function displaySelectedUser(user) {
        const selectedEl = document.getElementById('selectedUser');
        if (selectedEl) {
            selectedEl.innerHTML = `
                <h2>Call on:</h2>
                <div class="name">${user.displayName}</div>
            `;
            selectedEl.className = 'selected-user';
            selectedEl.style.display = 'block';
        }
    }
    
    // Update the entire UI
    function updateUI() {
        const raisedHandsCount = appState.participants.filter(p => p.bRaiseHand).length;
        
        // Update hand count
        const handCountEl = document.getElementById('handCount');
        if (handCountEl) {
            handCountEl.textContent = raisedHandsCount;
        }
        
        // Enable/disable pick button
        const pickBtn = document.getElementById('pickBtn');
        if (pickBtn) {
            pickBtn.disabled = raisedHandsCount === 0;
        }
        
        // Update participants list
        const participantsEl = document.getElementById('participants');
        if (participantsEl) {
            participantsEl.innerHTML = appState.participants.map(p => `
                <div class="participant ${p.bRaiseHand ? 'hand-raised' : 'normal'}">
                    <span>${p.displayName}</span>
                    ${p.bRaiseHand ? '<span>✋</span>' : ''}
                </div>
            `).join('');
        }
    }
    
    // Event listeners - set up after DOM is loaded
    function setupEventListeners() {
        const pickBtn = document.getElementById('pickBtn');
        if (pickBtn) {
            pickBtn.addEventListener('click', pickRandomPerson);
        }
        
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', fetchParticipants);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            debug('DOM loaded');
            setupEventListeners();
            waitForZoomSdk();
        });
    } else {
        debug('DOM already loaded');
        setupEventListeners();
        waitForZoomSdk();
    }
})();
