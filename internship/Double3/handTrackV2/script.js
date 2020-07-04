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

// SET HTML HELPER MESSAGES FOR THE USER

const setGeneralInfo = (message) => {
    $('.commandInfoContainer .generalInfo span').html(message);
};
const setHandStatus = (message) => {
    $('.commandInfoContainer .handStatus span').html(message);
};
const setGestureStatus = (message) => {
    $('.commandInfoContainer .gestureStatus span').html(message);
};

const setHandGesture = (message) => {
    $('.commandInfoContainer .handGesture span').html(message);
};

// HELPER FUNCTIONS FOR GESTURE ANALYSIS

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

// setting up gesture parameters
const minGestureTime = 3;
const xGradLim = 150;
const yGradLim = 150;

const checkDirectionalMovement = (del, grad) => {
    if (Math.abs(del) < grad) {
        return false;
    }
    return true;
};
// --------------- GESTURE ANALYSIS ----------------------

// QUICK GESTURE ANALYSIS

const fingerUp = (annotations, fingerNum, single = false) => {
    // only check for any three fingers at a time...if I take 4 fingers, then that's same as hand open
    const { indexFinger, ringFinger, middleFinger, pinky } = annotations;
    let fingers = [indexFinger, middleFinger, ringFinger, pinky];
    let gesture = true;
    if (!single) {
        if (checkFingerWrap(fingers[fingerNum])) {
            gesture = false;
        }
    } else {
        // ========== TO CHECK FOR ONLY THAT ONE PARTICUALR FINGER UP ==================
        fingers.forEach((finger, index) => {
            if (index === fingerNum) {
                if (checkFingerWrap(finger)) {
                    gesture = false;
                }
            } else {
                if (!checkFingerWrap(finger)) {
                    gesture = false;
                }
            }
        });
    }
    return gesture;
};

// ANALYZE SWIPE GESTURES
const analyzeGesture = () => {
    // Some reference data
    // left swipe => delx = -ve
    // xfin: 533.9469011428394
    // xinit: 77.36991711257636
    // yfin: 264.1426477855821
    // yinit: 234.3790196198422

    // down swipe => dely = -ve

    // xfin: 219.31797668105185
    // xinit: 230.78144968106326
    // yfin: 373.4764048806069
    // yinit: 76.10286491875027

    const { xinit, xfin, yinit, yfin } = gestureModel;
    // if positive then it's normal coordinate direction
    // we take init - fin as the picture, and hence the coordinates are inverted
    const delx = xinit - xfin;
    const dely = yinit - yfin;
    const movx = checkDirectionalMovement(delx, xGradLim);
    const movy = checkDirectionalMovement(dely, yGradLim);

    let gestureResult = '';
    if (!movx && !movy) {
        gestureResult =
            'Please make longer swipes, this one was too short to be recognised';
    } else if (!movx) {
        if (dely > 0) {
            gestureResult = 'You performed an up swipe';
        } else {
            gestureResult = 'You performed a down swipe';
        }
    } else if (!movy) {
        if (delx > 0) {
            gestureResult = 'You performed a right swipe';
        } else {
            gestureResult = 'You performed a left swipe';
        }
    } else {
        if (delx > 0 && dely > 0) {
            gestureResult =
                'You performed a diagnal swipe => from bottom left to top right';
        } else if (delx > 0 && dely < 0) {
            gestureResult =
                'You performed a diagnal swipe => from top left to bottom right';
        } else if (delx < 0 && dely > 0) {
            gestureResult =
                'You performed a diagnal swipe => from bottom right to top left';
        } else if (delx < 0 && dely < 0) {
            gestureResult =
                'You performed a diagnal swipe => from top right to bottom left';
        }
    }

    setHandGesture(gestureResult);
    setGestureStatus('Gesture analyzed');
    // now correspondingly perform robotic command here;
    // then i set gestureModel.process to false
    gestureModel.process = false;
};

// ACTUAL RENDERING OUT OF THE CANVAS AND HAND WIREFRAME
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
    let quickGestureType = 0;
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
            // const baseCoor = landmarkResult[0];
            if (checkHandStatus(annotationResult, 'close')) {
                setHandStatus('Closed');
                if (!gestureModel.active && !gestureModel.process) {
                    if (!timerActive) {
                        timerCount = 0;
                        timer = setInterval(() => {
                            timerCount += 1;
                            setGeneralInfo(
                                `Timer started! Keep hand closed for ${
                                    minGestureTime - timerCount
                                } more seconds to begin gesture tracking or open your hand to stop gesture`
                            );
                        }, 1000);
                        setGeneralInfo(
                            'Timer started! Keep hand closed for 5 more seconds to begin gesture tracking or open your hand to stop gesture'
                        );
                        timerActive = true;
                        setGestureStatus(
                            'Gesture trying to begin, Timer running'
                        );
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
                } else if (gestureModel.process) {
                    clearInterval(timer);
                    timerActive = false;
                    setGeneralInfo(
                        'A command is being performed. Please wait for it to finish before making another gesture'
                    );
                } else {
                    clearInterval(timer);
                    timerActive = false;
                    setGeneralInfo(
                        'Gesture is being tracked, open your hand to finish gesture'
                    );
                    setGestureStatus('Gesture being tracked');
                }
            } else if (checkHandStatus(annotationResult, 'open')) {
                setHandStatus('Open');
                if (gestureModel.active) {
                    if (!timerActive) {
                        timerCount = 0;
                        timer = setInterval(() => {
                            timerCount += 1;
                            setGeneralInfo(
                                `Timer started! Keep hand open for ${
                                    minGestureTime - timerCount
                                } more seconds to finish gesture or close hand to update gesture tracking`
                            );
                        }, 1000);
                        setGeneralInfo(
                            `Timer started! Keep hand open for ${
                                minGestureTime - timerCount
                            } more seconds to finish gesture or close hand to update gesture tracking`
                        );
                        timerActive = true;
                        setGestureStatus(
                            'Gesture trying to finish, timer ongoing'
                        );
                    } else {
                        if (timerCount > minGestureTime) {
                            clearInterval(timer);
                            timerActive = false;
                            const handFinCoor = getHandCenter(annotationResult);
                            gestureModel.xfin = handFinCoor.x;
                            gestureModel.yfin = handFinCoor.y;
                            gestureModel.active = false;
                            gestureModel.process = true;
                            analyzeGesture();
                        }
                    }
                } else {
                    clearInterval(timer);
                    timerActive = false;
                    setGeneralInfo(
                        'No gesture currently in progress, close your hand to begin gesture tracking'
                    );
                    setGestureStatus('No gesture in progress');
                }
            } else {
                // hand is neither closed nor open;
                if (!gestureModel.active) {
                    if (fingerUp(annotationResult, 0, true)) {
                        if (quickGestureType === 1) {
                            if (!timerActive) {
                                timerCount = 0;
                                timer = setInterval(() => {
                                    timerCount += 1;
                                    setGeneralInfo(
                                        `Timer started! Keep holding this gesture for ${
                                            minGestureTime - timerCount
                                        } more seconds to complete`
                                    );
                                }, 1000);
                                timerActive = true;
                                setGeneralInfo(
                                    `Timer started! Keep holding this gesture for ${
                                        minGestureTime - timerCount
                                    } more seconds to complete`
                                );
                            } else {
                                if (timerCount > minGestureTime) {
                                    clearInterval(timer);
                                    timerActive = false;
                                    gestureModel.process = true;
                                    // perform a robot command
                                    gestureModel.process = false;
                                    setHandGesture('Quick action 1 performed');
                                }
                                setGestureStatus('Index finger up');
                            }
                        } else {
                            quickGestureType = 1;
                            clearInterval(timer);
                            timerActive = false;
                        }
                    } else if (
                        fingerUp(annotationResult, 0) &&
                        fingerUp(annotationResult, 1) &&
                        !fingerUp(annotationResult, 2)
                    ) {
                        if (quickGestureType === 2) {
                            if (!timerActive) {
                                timerCount = 0;
                                timer = setInterval(() => {
                                    timerCount += 1;
                                    setGeneralInfo(
                                        `Timer started! Keep holding this gesture for ${
                                            minGestureTime - timerCount
                                        } more seconds to complete`
                                    );
                                }, 1000);
                                timerActive = true;
                                setGeneralInfo(
                                    `Timer started! Keep holding this gesture for ${
                                        minGestureTime - timerCount
                                    } more seconds to complete`
                                );
                            } else {
                                if (timerCount > minGestureTime) {
                                    clearInterval(timer);
                                    timerActive = false;
                                    gestureModel.process = true;
                                    // perform a robot command
                                    gestureModel.process = false;
                                    setHandGesture('Quick action 2 performed');
                                }
                                setGestureStatus('Two fingers up');
                            }
                        } else {
                            quickGestureType = 2;
                            clearInterval(timer);
                            timerActive = false;
                        }
                    } else if (
                        fingerUp(annotationResult, 0) &&
                        fingerUp(annotationResult, 1) &&
                        fingerUp(annotationResult, 2)
                    ) {
                        if (quickGestureType === 3) {
                            if (!timerActive) {
                                timerCount = 0;
                                timer = setInterval(() => {
                                    timerCount += 1;
                                    setGeneralInfo(
                                        `Timer started! Keep holding this gesture for ${
                                            minGestureTime - timerCount
                                        } more seconds to complete`
                                    );
                                }, 1000);
                                timerActive = true;
                                setGeneralInfo(
                                    `Timer started! Keep holding this gesture for ${
                                        minGestureTime - timerCount
                                    } more seconds to complete`
                                );
                            } else {
                                if (timerCount > minGestureTime) {
                                    clearInterval(timer);
                                    timerActive = false;
                                    gestureModel.process = true;
                                    // perform a robot command
                                    gestureModel.process = false;
                                    setHandGesture('Quick action 3 performed');
                                }
                                setGestureStatus('Three fingers up');
                            }
                        } else {
                            quickGestureType = 3;
                            clearInterval(timer);
                            timerActive = false;
                        }
                    } else {
                        clearInterval(timer);
                        timerActive = false;
                        setGestureStatus('Unrecognised gesture');
                    }
                } else {
                    clearInterval(timer);
                    timerActive = false;
                    setGeneralInfo('A swipe gesture is currenly being tracked');
                }
                setHandStatus('Neither');
            }
            drawKeypoints(ctx, landmarkResult, predictions[0].annotations);
        } else {
            if (!gestureModel.active) {
                clearInterval(timer);
                timerActive = false;
                setGeneralInfo('No hand detected');
                setHandStatus('No hand detected');
                setGestureStatus('No hand on screen');
            }
        }
        requestAnimationFrame(frameLandmarks);
    }

    frameLandmarks();
};
