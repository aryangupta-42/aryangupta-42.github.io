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
        alert("The bot is now connected");
        // Subscribe to events that you will process. You can subscribe to more events at any time.
        // DRDoubleSDK.sendCommand("events.subscribe", {
        //     events: [
        //         "DRBase.status",
        //         "DRNetwork.info",
        //     ]
        // });

        // Turn on the screen, but allow the screensaver to kick in later
        DRDoubleSDK.sendCommand("screensaver.nudge");

    } else {
        window.setTimeout(onConnect, 100);
    }
}

const startMovement = (timeInms) => {
    console.log("movement initiated");
    DRDoubleSDK.sendCommand("base.travel.start");
    setTimeout(() => {
        console.log("movement stopped");
        DRDoubleSDK.sendCommand("base.travel.stop");
    }, timeInms)
}

$(window).on('load', function () {
    // REQUIRED: Tell d3-api that we're still running ok (faster than every 3000 ms) or the page will be reloaded.
    // !IMPORTANT ------------------
    window.setInterval(() => {
        DRDoubleSDK.resetWatchdog();
    }, 2000);

    // DRDoubleSDK 
    onConnect();
    DRDoubleSDK.on("connect", () => {
        onConnect();
    });

    // let movementTimer;
    $('#moveBtn').click(() => {
        $('.alert').html('The robot will now begin to move in 5 seconds<br />please step away');
        $('.alert').css('opacity', '1');
        // clearTimeout(movementTimer);
        setTimeout(() => {
            $('.alert').css('opacity', '0');
            startMovement(2000);
        }, 5000);
    })

});
