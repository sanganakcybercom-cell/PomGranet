// /home/nick/Documents/PomGranet Web to Image Producer/background.js

// FUNCTION: Use Chrome Notification API
function notifyUser(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: title,
        message: message,
        priority: 2
    });
}

// NOTE: All image conversion logic has been removed from here.

// This event listener waits for the user to click the extension icon (action button)
chrome.action.onClicked.addListener(async (tab) => {

    if (tab.url && !tab.url.startsWith("chrome://")) {

        console.log("PomGranet Background: Icon clicked. Starting capture sequence.");

        try {
            // 1. Inject the necessary files: The library first, then the content script.
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['lib/dom-to-image.min.js', 'content.js']
            });
            console.log("PomGranet Background: Scripts (lib and content) injected.");

            // 2. Send the 'capture_start' message and handle the response
            chrome.tabs.sendMessage(tab.id, { action: "capture_start" }, async (response) => {

                if (chrome.runtime.lastError) {
                    console.error("PomGranet Background: Error sending message:", chrome.runtime.lastError.message);
                    notifyUser("PomGranet Error", "Communication failed. Try reloading the page and extension.");
                    return;
                }

                if (response && response.status === "success") {
                    // Data received is now the STABLE PNG Data URL
                    console.log("PomGranet Background: Received stable PNG data.");

                    const imageDataURL = response.data;

                    if (!imageDataURL.startsWith('data:image/png')) {
                         notifyUser("Data Error", "Image data was invalid (not PNG) from the webpage.");
                         return;
                    }

                    // FILE NAME: Change extension to .png to match data type
                    const fileName = `${tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.png`;

                    console.log(`PomGranet Background: Initiating download for ${fileName}.`);

                    // Trigger the browser's download API
                    chrome.downloads.download({
                        url: imageDataURL,
                        filename: fileName,
                        saveAs: true // forces the "Save As" dialogue
                    }, (downloadId) => {
                        if (downloadId === undefined) {
                            console.error("PomGranet Background: Download failed.");
                            notifyUser("Download Failed", "The browser could not start the 'Save As' process.");
                        } else {
                            console.log(`PomGranet Background: Download started with ID: ${downloadId}`);
                            notifyUser("Capture Complete!", "The 'Save As' dialogue should now be open.");
                        }
                    });

                } else if (response && response.status === "error") {
                    console.error("PomGranet Background: Content script reported an error:", response.message);
                    notifyUser("Capture Failed", `Error during rendering: ${response.message}.`);
                }
            });

        } catch (error) {
            console.error("PomGranet Background: Error during scripting/messaging:", error);
            notifyUser("Launch Failed", "Could not start the capture process.");
        }

    } else {
        console.log("PomGranet Background: Cannot capture this page (invalid URL).");
    }
});
