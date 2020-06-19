// DRDoubleSDK is a global object loaded in by Electron in the Standby window and a "Trusted" Accessory window
if (!("DRDoubleSDK" in window)) {
    console.error("window.DRDoubleSDK not found. This is required.");
    alert("window.DRDoubleSDK not found. This is required.");
}

// HELPER FUNCTION TO CALL COMMANDS ON EVENT FEEDBACK
DRDoubleSDK.on("event", (message) => {
    // Event messages include: { class: "DRNetwork", key: "info", data: {...} }
    alert(`An event has been called ${message.class}.${message.key}`);
    // switch (message.class + "." + message.key) {
    // }
});

function onConnect() {
    if (DRDoubleSDK.isConnected()) {
        DRDoubleSDK.resetWatchdog();
        // Subscribe to events that you will process. You can subscribe to more events at any time.
        // DRDoubleSDK.sendCommand("events.subscribe", {
        //     events: [
        //         "DRBase.status",
        //         "DRNetwork.info",
        //     ]
        // });

        // Turn on the screen, but allow the screensaver to kick in later
        DRDoubleSDK.sendCommand("screensaver.nudge");
        // Enable the camera
        DRDoubleSDK.sendCommand("camera.enable", { width: 1152, height: 720, template: 'h264ForWebRTC' });
        // DRDoubleSDK.sendCommand("camera.enable", { width: 1152, height: 720, template: 'v4l2' });
        // Output from the camera
        DRDoubleSDK.sendCommand("camera.output", { template: 'v4l2', width: 1152, height: 720 });

    } else {
        window.setTimeout(onConnect, 100);
    }
}

async function getCameraFeed() {
    // connect to the stream of the camera and display it inside the video element inside html
    var stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(e => {
        document.write(e.message);
    });
    var video = document.querySelector("video");
    var info = document.querySelector("#info");
    video.srcObject = stream;
    video.onloadedmetadata = (e) => {
        info.innerText = video.videoWidth + " x " + video.videoHeight;
        info.style.zIndex = 2;
    };
}

function stopCamera() {
    DRDoubleSDK.sendCommand("camera.disable");
}

$(window).on('load', () => {
    window.setInterval(() => {
        DRDoubleSDK.resetWatchdog();
    }, 2000);

    onConnect();
    DRDoubleSDK.on("connect", () => {
        onConnect();
    });

    $('#stopBtn').click(() => {
        stopCamera();
    })

    getCameraFeed();
});
