// Square cropper for Indiekit photo uploads.
//
// Catches the file picker's `change` event in photo fields before Indiekit's
// file-input component sees it, shows a full-screen square crop (drag to move,
// pinch / slider / wheel to zoom), then puts the cropped JPEG back on the
// input and re-dispatches `change` so Indiekit's own uploader sends it.
// Nothing is uploaded until a choice is made; Cancel uploads nothing.
(() => {
  const MAX_OUTPUT = 2048; // px per side; the media endpoint resizes further
  // Short side of the on-screen copy. Showing the full-resolution photo made
  // iOS Safari stall on the first zoom; the crop itself still uses the original
  const MAX_PREVIEW = 1600;
  const MAX_ZOOM = 6;
  const FRAME_MARGIN = 16;

  const style = document.createElement('style');
  style.textContent = `
    .photo-crop {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; flex-direction: column;
      background: #000; color: #fff;
      padding: env(safe-area-inset-top) env(safe-area-inset-right)
        env(safe-area-inset-bottom) env(safe-area-inset-left);
    }
    .photo-crop__stage {
      position: relative; flex: 1; overflow: hidden;
      touch-action: none; user-select: none; -webkit-user-select: none;
      cursor: grab;
    }
    .photo-crop__image {
      position: absolute; left: 0; top: 0;
      max-width: none; transform-origin: 0 0; will-change: transform;
      pointer-events: none; -webkit-user-drag: none;
    }
    .photo-crop__frame {
      position: absolute; pointer-events: none;
      box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.6);
      outline: 1px solid rgb(255 255 255 / 0.9);
      background-image:
        linear-gradient(to right, transparent calc(100% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(100% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(100% / 3 + 0.5px), transparent calc(100% / 3 + 0.5px), transparent calc(200% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(200% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(200% / 3 + 0.5px), transparent calc(200% / 3 + 0.5px)),
        linear-gradient(to bottom, transparent calc(100% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(100% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(100% / 3 + 0.5px), transparent calc(100% / 3 + 0.5px), transparent calc(200% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(200% / 3 - 0.5px), rgb(255 255 255 / 0.35) calc(200% / 3 + 0.5px), transparent calc(200% / 3 + 0.5px));
    }
    .photo-crop__controls {
      display: grid; gap: 12px; padding: 12px 16px 16px;
    }
    .photo-crop__zoom { width: 100%; margin: 0; }
    .photo-crop__buttons {
      display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
    }
    .photo-crop__buttons .button { margin: 0; }
    .photo-crop-preview {
      display: block; width: 100%; max-width: 240px; height: auto;
      margin-block-start: 0.5rem; border-radius: 4px;
    }
  `;
  document.head.append(style);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Whether an element is the hidden file picker of a photo field
   * @param {EventTarget} element - Event target
   * @returns {boolean} Is photo picker
   */
  function isPhotoPicker(element) {
    if (!element.matches?.('.file-input__file')) return false;
    const path = element
      .closest('file-input-field')
      ?.querySelector('.file-input__path');
    return Boolean(path && path.name.startsWith('photo['));
  }

  document.addEventListener(
    'change',
    async (event) => {
      const input = event.target;
      if (!isPhotoPicker(input)) return;

      // Second pass: our own re-dispatch carrying the chosen file
      if (input.dataset.photoCropDone) {
        delete input.dataset.photoCropDone;
        return;
      }

      const file = input.files?.[0];
      if (!file) return;

      // Capture phase on document, so Indiekit's uploader never sees this one
      event.stopImmediatePropagation();

      const result = await openCropper(file);
      if (!result) {
        input.value = '';
        return;
      }

      const transfer = new DataTransfer();
      transfer.items.add(result);
      input.files = transfer.files;
      input.dataset.photoCropDone = '1';
      showPreview(input, result);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    true,
  );

  /**
   * Show a thumbnail of the uploaded image under the field
   * @param {HTMLInputElement} input - File input
   * @param {File} file - Uploaded file
   */
  function showPreview(input, file) {
    const field = input.closest('file-input-field');
    let preview = field.querySelector('.photo-crop-preview');
    if (!preview) {
      preview = document.createElement('img');
      preview.className = 'photo-crop-preview';
      preview.alt = '';
      field.append(preview);
    }
    if (preview.src) URL.revokeObjectURL(preview.src);
    preview.src = URL.createObjectURL(file);
  }

  /**
   * Open the cropper for a file
   * @param {File} file - Picked image
   * @returns {Promise<File|null>} Cropped file, original file, or null if cancelled
   */
  function openCropper(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.addEventListener('error', () => {
        // Can't decode it here (unusual format): upload it as picked
        URL.revokeObjectURL(url);
        alert('This photo can’t be cropped here, so it will be uploaded as is.');
        resolve(file);
      });
      image.addEventListener('load', () => show(image, file, url, resolve));
      image.src = url;
    });
  }

  /**
   * Build the overlay and run the interaction until a choice is made
   * @param {HTMLImageElement} image - Loaded image
   * @param {File} file - Picked image file
   * @param {string} url - Object URL of the picked image
   * @param {Function} resolve - Resolves openCropper()
   */
  function show(image, file, url, resolve) {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const shortSide = Math.min(width, height);

    // Downscaled copy for display; `previewScale` maps image px to its px
    const previewScale = Math.min(1, MAX_PREVIEW / shortSide);
    const preview = document.createElement('canvas');
    preview.className = 'photo-crop__image';
    preview.width = Math.round(width * previewScale);
    preview.height = Math.round(height * previewScale);
    preview.style.width = `${preview.width}px`;
    preview.style.height = `${preview.height}px`;
    preview
      .getContext('2d')
      .drawImage(image, 0, 0, preview.width, preview.height);

    const overlay = document.createElement('div');
    overlay.className = 'photo-crop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Crop photo');
    overlay.innerHTML = `
      <div class="photo-crop__stage"><div class="photo-crop__frame"></div></div>
      <div class="photo-crop__controls">
        <input class="photo-crop__zoom" type="range" min="1" max="${MAX_ZOOM}" step="0.01" value="1" aria-label="Zoom">
        <div class="photo-crop__buttons">
          <button type="button" class="button button--secondary" data-action="cancel">Cancel</button>
          <button type="button" class="button button--secondary" data-action="full">Use full photo</button>
          <button type="button" class="button" data-action="crop">Use crop</button>
        </div>
      </div>`;
    const stage = overlay.querySelector('.photo-crop__stage');
    const frame = overlay.querySelector('.photo-crop__frame');
    const slider = overlay.querySelector('.photo-crop__zoom');
    stage.prepend(preview);

    // Crop state in image pixels: square of side `side` centred on (cx, cy).
    // zoom 1 = the short side of the photo fills the frame.
    let cx = width / 2;
    let cy = height / 2;
    let zoom = 1;
    // Layout state in screen pixels
    let stageRect;
    let frameSize;
    let frameLeft;
    let frameTop;

    const side = () => shortSide / zoom;
    const scale = () => frameSize / side();

    function layout() {
      stageRect = stage.getBoundingClientRect();
      frameSize = Math.max(
        Math.min(stageRect.width, stageRect.height) - FRAME_MARGIN * 2,
        1,
      );
      frameLeft = (stageRect.width - frameSize) / 2;
      frameTop = (stageRect.height - frameSize) / 2;
      Object.assign(frame.style, {
        left: `${frameLeft}px`,
        top: `${frameTop}px`,
        width: `${frameSize}px`,
        height: `${frameSize}px`,
      });
      render();
    }

    function render() {
      const half = side() / 2;
      cx = clamp(cx, half, width - half);
      cy = clamp(cy, half, height - half);
      const s = scale();
      const x = frameLeft + (half - cx) * s;
      const y = frameTop + (half - cy) * s;
      preview.style.transform = `translate(${x}px, ${y}px) scale(${s / previewScale})`;
      slider.value = String(zoom);
    }

    /**
     * Zoom keeping the image point under (px, py) in place
     * @param {number} nextZoom - Target zoom
     * @param {number} px - X relative to frame, screen pixels
     * @param {number} py - Y relative to frame, screen pixels
     */
    function zoomAt(nextZoom, px, py) {
      const before = scale();
      const ix = cx - side() / 2 + px / before;
      const iy = cy - side() / 2 + py / before;
      zoom = clamp(nextZoom, 1, MAX_ZOOM);
      const after = scale();
      cx = ix - px / after + side() / 2;
      cy = iy - py / after + side() / 2;
      render();
    }

    const toFrame = (point) => ({
      x: point.x - stageRect.left - frameLeft,
      y: point.y - stageRect.top - frameTop,
    });

    // Pointer handling: one pointer pans, two pointers pinch-zoom and pan
    const pointers = new Map();

    stage.addEventListener('pointerdown', (event) => {
      stage.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    });

    stage.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      const previous = [...pointers.values()].map((p) => ({ ...p }));
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = [...pointers.values()];

      if (current.length === 1) {
        const s = scale();
        cx -= (current[0].x - previous[0].x) / s;
        cy -= (current[0].y - previous[0].y) / s;
        render();
        return;
      }

      const [a0, b0] = previous;
      const [a1, b1] = current;
      const distance0 = Math.hypot(b0.x - a0.x, b0.y - a0.y);
      const distance1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
      const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
      const mid1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };

      const s = scale();
      cx -= (mid1.x - mid0.x) / s;
      cy -= (mid1.y - mid0.y) / s;
      const mid = toFrame(mid1);
      if (distance0 > 0) zoomAt(zoom * (distance1 / distance0), mid.x, mid.y);
      else render();
    });

    const release = (event) => pointers.delete(event.pointerId);
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    stage.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const point = toFrame({ x: event.clientX, y: event.clientY });
        zoomAt(zoom * Math.exp(-event.deltaY * 0.002), point.x, point.y);
      },
      { passive: false },
    );

    slider.addEventListener('input', () => {
      zoomAt(Number(slider.value), frameSize / 2, frameSize / 2);
    });

    async function exportCrop() {
      const cropSide = side();
      const output = Math.round(Math.min(cropSide, MAX_OUTPUT));
      const canvas = document.createElement('canvas');
      canvas.width = output;
      canvas.height = output;
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(
        image,
        cx - cropSide / 2,
        cy - cropSide / 2,
        cropSide,
        cropSide,
        0,
        0,
        output,
        output,
      );
      const blob = await new Promise((done) =>
        canvas.toBlob(done, 'image/jpeg', 0.9),
      );
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    }

    const resizeObserver = new ResizeObserver(layout);
    const previousOverflow = document.documentElement.style.overflow;

    function close(result) {
      resizeObserver.disconnect();
      document.removeEventListener('keydown', onKeydown);
      document.documentElement.style.overflow = previousOverflow;
      overlay.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close(null);
    }

    overlay.querySelector('.photo-crop__buttons').addEventListener(
      'click',
      async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const { action } = button.dataset;
        if (action === 'cancel') close(null);
        if (action === 'full') close(file);
        if (action === 'crop') {
          button.disabled = true;
          close(await exportCrop());
        }
      },
    );

    document.addEventListener('keydown', onKeydown);
    document.documentElement.style.overflow = 'hidden';
    document.body.append(overlay);
    resizeObserver.observe(stage);
    layout();
  }
})();
