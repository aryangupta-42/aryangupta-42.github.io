// declare basic variables
let model, video, canvas, context;
const modelParams = {
    flipHorizontal: true, // flip e.g for video
    imageScaleFactor: 1, // reduce input image size for gains in speed.
    maxNumBoxes: 1, // maximum number of boxes to detect
    iouThreshold: 0.5, // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions.
};
const handParams = {
    openLimitHeight: 180,
    openLimitWidth: 100,
    openHandScore: 0.85,
};
let gestureModel = {
    xinit: -1,
    yinit: -1,
    xfin: -1,
    yfin: -1,
    active: false,
    process: false,
    noRecog: false,
    // process: false // to be used to ensure that the robot command has been performed completly
};
function computeGesture() {
    gestureModel.process = false;
    console.log(gestureModel);
}
function runDetection() {
    model.detect(video).then((predictions) => {
        // console.log('predictions', predictions);
        if (predictions.length > 0) {
            predictions.forEach((prediction) => {
                const { bbox, score } = prediction;
                if (
                    bbox[3] > handParams.openLimitHeight &&
                    score > handParams.openHandScore
                    // && bbox[2] > handParams.openLimitWidth
                ) {
                    // hand is open
                    $('.commandInfoHandStatus span').html('open');
                    const { active, process, noRecog } = gestureModel;
                    if (
                        gestureModel.active &&
                        !gestureModel.process &&
                        !gestureModel.noRecog
                    ) {
                        gestureModel.xfin = bbox[0];
                        gestureModel.yfin = bbox[1];
                        gestureModel.process = true;
                        gestureModel.active = false;
                        $('.commandInfoContentContainer span').html(
                            'Gesture completed'
                        );
                        computeGesture();
                    }
                } else {
                    // hand is closed
                    $('.commandInfoHandStatus span').html('closed');
                    if (!gestureModel.active && !gestureModel.process) {
                        $('.commandInfoContentContainer span').html(
                            'Gesture recognition started'
                        );
                        gestureModel.active = true;
                        gestureModel.xinit = bbox[0];
                        gestureModel.yinit = bbox[1];
                    }
                    gestureModel.noRecog = false;
                }
            });
        } else {
            $('.commandInfoHandStatus span').html('No hand detected');
            gestureModel.noRecog = true;
        }
        model.renderPredictions(predictions, canvas, context, video);
        requestAnimationFrame(runDetection);
    });
}
$(document).ready(() => {
    video = document.getElementById('myvideo');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    // let leftParam = $(document).width() - canvas.width - 100;
    // $('.commandInfo').css({
    // left: leftParam + 'px',
    // });
    // context.beginPath();
    // context.fillStyle = 'red';
    // context.arc(10, 100, 40, 0, 2 * Math.PI);
    // context.fill();
    // console.log('done');
    handTrack.startVideo(video).then(() => {
        handTrack.load(modelParams).then((model_) => {
            model = model_;
            runDetection();
        });
    });
});
