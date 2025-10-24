// /home/nick/Documents/PomGranet Web to Image Producer/content.js

// NOTE: The convertPngToJpeg function is no longer needed as dom-to-image provides stable PNG output.

// 1. Define the main capture function
async function capturePage(sendResponse) {
    // Check if the NEW library is now globally available
    if (typeof domtoimage === 'undefined') {
        console.error("PomGranet: dom-to-image failed to load. Aborting.");
        sendResponse({ status: "error", message: "Library failed to load." });
        return;
    }

    try {
        console.log("PomGranet: Starting full-page rendering with dom-to-image...");

        // Use the domtoimage API to capture the document body.
        // The toPng method creates a secure PNG data URL that avoids canvas restrictions.
        const pngDataURL = await domtoimage.toPng(document.body, {
            quality: 1.0,
            bgcolor: 'white', // Ensure transparent areas are filled white
            // The library handles cross-origin better, especially with injected scripts.
        });

        console.log("PomGranet: Image data generated successfully.");

        // Send the stable PNG data URL back to the background script
        sendResponse({ status: "success", data: pngDataURL });
        console.log("PomGranet: Stable PNG data sent to background script.");

        alert("PomGranet Capture Done! Your download should start shortly.");

    } catch (error) {
        console.error("PomGranet: Full-page rendering failed:", error);
        sendResponse({ status: "error", message: error.message });
        alert("PomGranet Error: Could not capture the page. Check the console for details.");
    }
}

// 2. Listener to receive messages from the background script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "capture_start") {
            // DIRECTLY call the function since the library is already injected by background.js
            capturePage(sendResponse);
            return true;
        }
    }
);
