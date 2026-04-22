/*
Draw-modal handles the drawing interface in the post modal.

@param:
none directly

@usage:
When a user clicks the "draw" button in the post editor, openDrawMode() is called to show the drawing UI. 
The user can draw on the canvas, choose colors and brush sizes, undo actions, clear the canvas, and add a caption. 
When they click "Post Drawing", the script uploads the drawing to the server and then calls startPlacingDrawing() 
with the URL of the uploaded image and the caption.

@return:
none directly, but it will eventually call startPlacingDrawing() with the image URL and caption when the user posts.

@notes:
- The drawing is done on an HTML5 canvas element.
- The script maintains a history of drawing states for undo functionality.
- Changing the background color will prompt a warning if there is existing drawing content, as it will be lost.
*/

let drawHistory = [];
let isDrawing = false;
let drawCtx = null;
let drawCanvas = null;
let canvasInitialized = false;
let _currentDrawBg = '#fff9a3';

function initDrawCanvas() {
    // param: none
    // return: none, but initializes drawing canvas and sets up event listeners for drawing actions
    drawCanvas = document.getElementById('draw-canvas');
    drawCtx = drawCanvas.getContext('2d');
    drawCtx.fillStyle = _currentDrawBg;
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

    if (canvasInitialized) return;
    canvasInitialized = true;
    saveDrawState();

    let painting = false;

    drawCanvas.addEventListener('mousedown', (e) => {
        painting = true;
        drawCtx.beginPath();
        const pos = getCanvasPos(e);
        drawCtx.moveTo(pos.x, pos.y);
    });

    drawCanvas.addEventListener('mousemove', (e) => {
        if (!painting) return;
        const pos = getCanvasPos(e);
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.strokeStyle = document.getElementById('draw-color').value;
        drawCtx.lineWidth = document.getElementById('draw-size').value;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.stroke();
    });

    drawCanvas.addEventListener('mouseup', () => {
        if (painting) { painting = false; drawCtx.closePath(); saveDrawState(); }
    });

    drawCanvas.addEventListener('mouseleave', () => {
        if (painting) { painting = false; drawCtx.closePath(); saveDrawState(); }
    });
}

function getCanvasPos(e) {
    // param: e (MouseEvent) the mouse event from the canvas
    // return:  an object with x and y properties representing the 
    //          mouse position relative to the canvas, accounting for scaling
    const rect = drawCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (drawCanvas.width / rect.width),
        y: (e.clientY - rect.top)  * (drawCanvas.height / rect.height)
    };
}

function saveDrawState() {
    // param: none
    // return: none, but saves the current state of the drawing canvas to the history stack for undo functionality
    if (drawHistory.length > 30) drawHistory.shift();
    drawHistory.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
}

function undoDraw() {
    // param: none
    // return: none, but reverts the drawing canvas to the previous state
    if (drawHistory.length <= 1) return;
    drawHistory.pop();
    drawCtx.putImageData(drawHistory[drawHistory.length - 1], 0, 0);
}

function clearDrawCanvas(bgColor) {
    // param: bgColor (string) the background color to fill the canvas with
    // return: none, but clears the drawing canvas and save history
    _currentDrawBg = bgColor || '#fff9a3';
    drawHistory = [];
    drawCtx.fillStyle = _currentDrawBg;
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    saveDrawState();
}

function hasDrawingContent() {
    // param: none
    // return: boolean indicating if there is any drawing
    // used to warn users about losing their drawing if they switch modes or change background
    return drawHistory.length > 1;
}

function openDrawMode(userColor) {
    // param: userColor (object) an object containing 'bg' and 'author' color values for the user
    // return: none, but sets up the UI for drawing mode and initializes the canvas
    document.getElementById('draw-panel').style.cssText = 'display:flex; flex-direction:column; gap:12px;';
    document.getElementById('post-editor').style.display = 'none';
    document.getElementById('color-wheel-wrap').style.display = 'none';

    const bgPicker = document.getElementById('draw-bg-color');
    const savedBg = localStorage.getItem('bb_last_draw_bg');
    const initBg = savedBg || (userColor.bg.length === 7 ? userColor.bg : '#fff9a3');
    bgPicker.value = initBg;
    _currentDrawBg = initBg;

    initDrawCanvas();
    clearDrawCanvas(initBg);

    const captionInput = document.getElementById('draw-caption');
    const captionCount = document.getElementById('draw-caption-count');
    if (captionInput) { captionInput.value = ''; captionCount.textContent = '0/50'; }

    bgPicker.oninput = () => {
        const newBg = bgPicker.value;
        if (hasDrawingContent()) {
            if (!confirm('Changing the background will erase your drawing. Continue?')) {
                bgPicker.value = _currentDrawBg;
                return;
            }
        }
        localStorage.setItem('bb_last_draw_bg', newBg);
        clearDrawCanvas(newBg);
    };

    updateSizePreview();
}

function closeDrawMode() {
    // param: none
    // return: none, but hides the drawing UI and resets the canvas state
    document.getElementById('draw-panel').style.display = 'none';
    document.getElementById('post-editor').style.display = 'flex';
    document.getElementById('color-wheel-wrap').style.display = '';
    drawHistory = [];
    canvasInitialized = false;
}

function updateSizePreview() {
    // param: none
    // return: none, but updates the preview dot to reflect the current brush size and color
    const size = document.getElementById('draw-size').value;
    const dot = document.getElementById('size-preview-dot');
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.background = document.getElementById('draw-color').value;
}

async function submitDrawing() {
    // param: none
    // return: a Promise that resolves to the public URL of the uploaded drawing, or null if upload fails
    return new Promise((resolve) => {
        drawCanvas.toBlob(async (blob) => {
            try {
                const res = await fetch('/api/drawing-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'image/png' },
                    body: blob
                });
                const { publicUrl } = await res.json();
                resolve(publicUrl || null);
            } catch (err) {
                console.error('Drawing upload failed:', err);
                resolve(null);
            }
        }, 'image/png');
    });
}

const PALETTE_COLORS = [
    '#222222', '#e63946', '#f4a261', '#e9c46a',
    '#2a9d8f', '#264653', '#8338ec', '#ffffff'
];

function buildPalette() {
    // param: none
    // return: none, but builds the color palette
    const palette = document.getElementById('draw-palette');
    PALETTE_COLORS.forEach(c => {
        const swatch = document.createElement('button');
        swatch.className = 'palette-swatch';
        swatch.style.background = c;
        swatch.title = c;
        if (c === '#222222') swatch.classList.add('active');
        swatch.addEventListener('click', () => {
            document.getElementById('draw-color').value = c;
            document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            updateSizePreview();
        });
        palette.appendChild(swatch);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    buildPalette();

    const captionInput = document.getElementById('draw-caption');
    const captionCount = document.getElementById('draw-caption-count');
    if (captionInput) {
        captionInput.addEventListener('input', () => {
            captionCount.textContent = `${captionInput.value.length}/50`;
        });
    }

    document.getElementById('draw-undo').addEventListener('click', undoDraw);

    document.getElementById('draw-clear').addEventListener('click', () => {
        const bg = document.getElementById('draw-bg-color').value || '#fff9a3';
        clearDrawCanvas(bg);
    });

    document.getElementById('draw-size').addEventListener('input', updateSizePreview);

    document.getElementById('draw-color').addEventListener('input', () => {
        document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
        updateSizePreview();
    });

    document.getElementById('draw-cancel').addEventListener('click', () => {
        closeDrawMode();
        closePostModal();
    });

    document.getElementById('draw-post').addEventListener('click', async () => {
        const btn = document.getElementById('draw-post');
        btn.disabled = true;
        btn.textContent = 'Uploading...';

        const caption = (document.getElementById('draw-caption')?.value || '').trim();
        const publicUrl = await submitDrawing();
        closeDrawMode();
        closePostModal();

        if (publicUrl) {
            startPlacingDrawing(publicUrl, pendingColor, caption);
        } else {
            alert('Upload failed. Please try again.');
        }
        btn.disabled = false;
        btn.textContent = 'Post Drawing';
    });

    document.getElementById('btn-draw').addEventListener('click', () => {
        if (!pendingColor) return;
        const textInput = document.getElementById('post-input');
        if (textInput.value.trim()) {
            if (!confirm('Switch to Draw mode? Your text will be lost.')) return;
        }
        document.querySelectorAll('.post-type-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-draw').classList.add('active');
        closeImageMode();
        openDrawMode(pendingColor);
    });

    document.getElementById('btn-text').addEventListener('click', () => {
        if (hasDrawingContent()) {
            if (!confirm('Switch to Text mode? Your drawing will be lost.')) return;
        }
        if (typeof _imageFile !== 'undefined' && _imageFile) {
            if (!confirm('Switch to Text mode? Your image selection will be lost.')) return;
        }
        document.querySelectorAll('.post-type-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-text').classList.add('active');
        closeDrawMode();
        closeImageMode();
    });
});