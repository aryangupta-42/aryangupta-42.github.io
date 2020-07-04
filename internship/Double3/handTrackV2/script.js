function isMobile() {
    return false;
}

let videoWidth,
    videoHeight,
    scatterGLHasInitialized = false,
    scatterGL,
    fingerLookupIndices = {
        thumb: [0, 1, 2, 3, 4],
        indexFinger: [0, 5, 6, 7, 8],
        middleFinger: [0, 9, 10, 11, 12],
        ringFinger: [0, 13, 14, 15, 16],
        pinky: [0, 17, 18, 19, 20],
    }; // for rendering each finger as a polyline

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
// const renderPointcloud = mobile === false;

const state = {
    backend: 'webgl',
};

function drawPoint(ctx, y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
}

function drawKeypoints(ctx, keypoints) {
    const keypointsArray = keypoints;

    for (let i = 0; i < keypointsArray.length; i++) {
        const y = keypointsArray[i][0];
        const x = keypointsArray[i][1];
        drawPoint(ctx, x - 2, y - 2, 3);
    }

    const fingers = Object.keys(fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
        const finger = fingers[i];
        const points = fingerLookupIndices[finger].map((idx) => keypoints[idx]);
        drawPath(ctx, points, false);
    }
}

function drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point[0], point[1]);
    }

    if (closePath) {
        region.closePath();
    }
    ctx.stroke(region);
}

let model;

async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available'
        );
    }

    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'user',
            // Only setting the video to a specified size in order to accommodate a
            // point cloud, so on mobile devices accept the default size.
            width: mobile ? undefined : VIDEO_WIDTH,
            height: mobile ? undefined : VIDEO_HEIGHT,
        },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadVideo() {
    const video = await setupCamera();
    return video;
}

const main = async () => {
    // setupDatGui();
    await tf.setBackend(state.backend);
    model = await handpose.load();
    let video;

    try {
        video = await loadVideo();
    } catch (e) {
        let info = document.getElementById('info');
        info.textContent = e.message;
        info.style.display = 'block';
        throw e;
    }

    landmarksRealTime(video);
};

const gestureModel = {
    xinit: -1,
    yinit: -1,
    xfin: -1,
    yfin: -1,
    active: false,
    process: false,
    noRecog: false,
    // process: false // to be used to ensure that the robot command has been performed completly
};

const checkFingerWrap = (fingerAnnotation) => {
    if (fingerAnnotation[1][1] < fingerAnnotation[3][1]) {
        return true;
    }
    return false;
};

const checkHandStatus = (annotations, checkType) => {
    const { indexFinger, ringFinger, middleFinger, pinky } = annotations;

    if (checkType === 'close') {
        let close = true;
        if (
            !checkFingerWrap(indexFinger) ||
            !checkFingerWrap(middleFinger) ||
            !checkFingerWrap(ringFinger) ||
            !checkFingerWrap(pinky)
        ) {
            close = false;
        }
        return close;
    } else if (checkType === 'open') {
        let open = true;
        if (
            checkFingerWrap(indexFinger) ||
            checkFingerWrap(middleFinger) ||
            checkFingerWrap(ringFinger) ||
            checkFingerWrap(pinky)
        ) {
            open = false;
        }
        return open;
    }
};

const getHandCenter = (annotations) => {
    const {
        indexFinger,
        middleFinger,
        ringFinger,
        pinky,
        palmBase,
    } = annotations;
    let xtopAvg =
        (indexFinger[0][0] +
            middleFinger[0][0] +
            ringFinger[0][0] +
            pinky[0][0]) /
        4;
    let ytopAvg =
        (indexFinger[0][1] +
            middleFinger[0][1] +
            ringFinger[0][1] +
            pinky[0][1]) /
        4;

    let xAvg = (xtopAvg + palmBase[0][0]) / 2;
    let yAvg = (ytopAvg + palmBase[0][1]) / 2;
    return { x: xAvg, y: yAvg };
};

const minGestureTime = 5;

const landmarksRealTime = async (video) => {
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    const canvas = document.getElementById('output');

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');

    video.width = videoWidth;
    video.height = videoHeight;

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    let timer;
    let timerActive = false;
    let timerCount = 0;
    async function frameLandmarks() {
        ctx.drawImage(
            video,
            0,
            0,
            videoWidth,
            videoHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0) {
            const landmarkResult = predictions[0].landmarks;
            const annotationResult = predictions[0].annotations;
            const baseCoor = landmarkResult[0];
            if (checkHandStatus(annotationResult, 'close')) {
                $('.commandInfoContainer .handStatus span').html('Closed');
                if (!gestureModel.active) {
                    if (!timerActive) {
                        timerCount = 0;
                        timer = setInterval(() => {
                            timerCount += 1;
                            $('.commandInfoContainer .generalInfo span').html(
                                `Timer started! Keep hand closed for ${
                                    minGestureTime - timerCount
                                } more seconds to begin gesture tracking or open your hand to stop gesture`
                            );
                        }, 1000);
                        $('.commandInfoContainer .generalInfo span').html(
                            'Timer started! Keep hand closed for 5 more seconds to begin gesture tracking or open your hand to stop gesture'
                        );
                        timerActive = true;
                    } else {
                        if (timerCount > minGestureTime) {
                            clearInterval(timer);
                            timerActive = false;
                            gestureModel.active = true;
                            const handInitCoor = getHandCenter(
                                annotationResult
                            );
                            gestureModel.xinit = handInitCoor.x;
                            gestureModel.yinit = handInitCoor.y;
                        }
                    }
                } else {
                    clearInterval(timer);
                    timerActive = false;
                    $('.commandInfoContainer .generalInfo span').html(
                        'Gesture is being tracked, open your hand to finish gesture'
                    );
                }
            } else if (checkHandStatus(annotationResult, 'open')) {
                $('.commandInfoContainer .handStatus span').html('Open');
                if (gestureModel.active) {
                    if (!timerActive) {
                        timerCount = 0;
                        timer = setInterval(() => {
                            timerCount += 1;
                            $('.commandInfoContainer .generalInfo span').html(
                                `Timer started! Keep hand open for ${
                                    minGestureTime - timerCount
                                } more seconds to finish gesture or close hand to update gesture tracking`
                            );
                        }, 1000);
                        $('.commandInfoContainer .generalInfo span').html(
                            `Timer started! Keep hand open for ${
                                minGestureTime - timerCount
                            } more seconds to finish gesture or close hand to update gesture tracking`
                        );
                        timerActive = true;
                    } else {
                        if (timerCount > minGestureTime) {
                            clearInterval(timer);
                            timerActive = false;
                            const handFinCoor = getHandCenter(annotationResult);
                            gestureModel.xfin = handFinCoor.x;
                            gestureModel.yfin = handFinCoor.y;
                            console.log(gestureModel);
                            gestureModel.active = false;
                        }
                    }
                } else {
                    clearInterval(timer);
                    timerActive = false;
                    $('.commandInfoContainer .generalInfo span').html(
                        'No gesture currently in progress, close your hand to begin gesture tracking'
                    );
                }
            } else {
                // hand is neither closed nor open;
                clearInterval(timer);
                timerActive = false;
                $('.commandInfoContainer .generalInfo span').html(
                    'No gesture currently in progress, close your hand to begin gesture tracking'
                );
            }
            drawKeypoints(ctx, landmarkResult, predictions[0].annotations);
        } else {
            if (!gestureModel.active) {
                clearInterval(timer);
                timerActive = false;
                $('.commandInfoContainer .generalInfo span').html(
                    'No hand detected'
                );
                $('.commandInfoContainer .handStatus span').html(
                    'No hand detected'
                );
            }
        }
        requestAnimationFrame(frameLandmarks);
    }

    frameLandmarks();
};
