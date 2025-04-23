document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startSelection');
    const statusDiv = document.getElementById('status');

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + (isError ? 'error' : 'success');
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    startButton.addEventListener('click', async () => {
        try {
            // Get the active tab
            const tabs = await browser.tabs.query({active: true, currentWindow: true});
            if (!tabs[0]) {
                showStatus('No active tab found', true);
                return;
            }

            // Send message to content script
            browser.tabs.sendMessage(tabs[0].id, {action: "activate"})
                .then(response => {
                    showStatus('Selection tool activated');
                    window.close(); // Close popup after activation
                })
                .catch(async (error) => {
                    console.log("Content script might not be loaded, injecting it:", error);
                    
                    try {
                        // Try injecting the content script first
                        await browser.tabs.executeScript(tabs[0].id, {file: "content.js"});
                        
                        // Then try sending the message again
                        await browser.tabs.sendMessage(tabs[0].id, {action: "activate"});
                        showStatus('Selection tool activated');
                        window.close(); // Close popup after activation
                    } catch (injectError) {
                        console.error('Error injecting content script:', injectError);
                        showStatus('Failed to activate selection tool', true);
                    }
                });
        } catch (error) {
            console.error('Error:', error);
            showStatus('Failed to activate selection tool', true);
        }
    });
});
