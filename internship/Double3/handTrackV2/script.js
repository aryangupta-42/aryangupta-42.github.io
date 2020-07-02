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

function setupDatGui() {
    const gui = new dat.GUI();
    gui.add(state, 'backend', ['wasm', 'webgl', 'cpu', 'webgpu']).onChange(
        async (backend) => {
            await tf.setBackend(backend);
        }
    );
}
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

const landmarksRealTime = async (video) => {
    setupDatGui();

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
            const result = predictions[0].landmarks;
            drawKeypoints(ctx, result, predictions[0].annotations);
        }
        requestAnimationFrame(frameLandmarks);
    }

    frameLandmarks();
};
