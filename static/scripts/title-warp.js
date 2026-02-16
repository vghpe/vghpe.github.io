// ============================================
// SDF TITLE WARP – Wind deformation for landing page H1
// Plain SDF (single channel) with per-glyph subdivided quads
// Ported from temp/msdf-warp experiment
// ============================================

(function () {
  'use strict';

  // ── Paths ──────────────────────────────────────────────
  const ATLAS_PNG  = '/fonts/futura-sdf-size48-pxrange8.png';
  const EXPAND     = 60; // px padding around text for displacement overflow

  // ── Inlined atlas metadata (avoids extra network fetch) ─
  const ATLAS_DATA = {"atlas":{"type":"sdf","distanceRange":8,"distanceRangeMiddle":0,"size":48,"width":132,"height":132,"yOrigin":"bottom"},"name":"Futura Bold","metrics":{"emSize":1,"lineHeight":1.424,"ascender":1.07,"descender":-0.264,"underlineY":-0.224,"underlineThickness":0.075},"glyphs":[{"unicode":32,"advance":0.343},{"unicode":99,"advance":0.483,"planeBounds":{"left":-0.065167,"bottom":-0.114583,"right":0.518167,"top":0.614583},"atlasBounds":{"left":0.5,"bottom":46.5,"right":28.5,"top":81.5}},{"unicode":100,"advance":0.682,"planeBounds":{"left":-0.056417,"bottom":-0.114583,"right":0.714417,"top":0.927083},"atlasBounds":{"left":0.5,"bottom":81.5,"right":37.5,"top":131.5}},{"unicode":101,"advance":0.61,"planeBounds":{"left":-0.0705,"bottom":-0.114583,"right":0.6795,"top":0.614583},"atlasBounds":{"left":0.5,"bottom":11.5,"right":36.5,"top":46.5}},{"unicode":104,"advance":0.661,"planeBounds":{"left":-0.023667,"bottom":-0.09375,"right":0.684667,"top":0.927083},"atlasBounds":{"left":37.5,"bottom":82.5,"right":71.5,"top":131.5}},{"unicode":105,"advance":0.302,"planeBounds":{"left":-0.0365,"bottom":-0.09375,"right":0.3385,"top":0.90625},"atlasBounds":{"left":110.5,"bottom":83.5,"right":128.5,"top":131.5}},{"unicode":107,"advance":0.688,"planeBounds":{"left":-0.02825,"bottom":-0.09375,"right":0.78425,"top":0.927083},"atlasBounds":{"left":71.5,"bottom":82.5,"right":110.5,"top":131.5}},{"unicode":110,"advance":0.661,"planeBounds":{"left":-0.023667,"bottom":-0.09375,"right":0.684667,"top":0.614583},"atlasBounds":{"left":96.5,"bottom":47.5,"right":130.5,"top":81.5}},{"unicode":111,"advance":0.662,"planeBounds":{"left":-0.064833,"bottom":-0.114583,"right":0.726833,"top":0.614583},"atlasBounds":{"left":28.5,"bottom":46.5,"right":66.5,"top":81.5}},{"unicode":114,"advance":0.453,"planeBounds":{"left":-0.02875,"bottom":-0.09375,"right":0.53375,"top":0.614583},"atlasBounds":{"left":36.5,"bottom":12.5,"right":63.5,"top":46.5}},{"unicode":115,"advance":0.513,"planeBounds":{"left":-0.062,"bottom":-0.114583,"right":0.563,"top":0.614583},"atlasBounds":{"left":66.5,"bottom":46.5,"right":96.5,"top":81.5}}],"kerning":[]};

  // ── Find H1 ────────────────────────────────────────────
  const h1 = document.querySelector('.site-header h1');
  if (!h1) return;
  const titleText = h1.textContent.trim();

  // ── Parameters (tuned for ~42px landing page text) ─────
  const params = {
    text: titleText,
    fontSize: 42,
    textColor: '#ff3838',
    // Wind / vector field
    windEnabled: true,
    windIntensity: 6,
    windSpeed: 6,
    fieldFreq: 0.099,
    // Vertical influence gradient
    gradientEnabled: true,
    gradientExponent: 1.8,
    gradientFloor: 0.0,
    gradientOffset: 0,
    // SDF rendering
    threshold: 0.4,
    // Mesh
    subdivision: 8,
    // Debug
    showMesh: false,
    showControlPoints: false,
    showGradient: false,
    showVectorField: false,
    showAtlas: false,
  };

  // ── State ──────────────────────────────────────────────
  let sdfData = null;
  let atlasTexture = null;
  let reglInstance = null;
  let glyphMap = {};
  let kerningMap = {};
  let time = 0;
  let rafId = null;
  let textBounds = { top: 0, baseline: 0 };
  let textRect = { x: 0, y: 0, w: 0, h: 0, baseline: 0, bottom: 0 };
  let logicalW = 0, logicalH = 0;
  let textScale = 1;
  let dpr = 1;
  let textOffsetX = 0, textOffsetY = 0;

  // Draw calls
  let drawText, drawMeshLines, drawMeshPoints;
  let drawGradientBands, drawVectorField, drawAtlasPreview;

  // ── DOM setup ──────────────────────────────────────────
  const header = h1.closest('.site-header');
  const canvas = document.createElement('canvas');
  canvas.className = 'title-warp-canvas';
  header.appendChild(canvas);

  // H1 is already hidden via template class; JS removes it on error fallback

  // ── sampleField (CPU side, for debug overlays) ─────────
  function sampleField(x, y, t) {
    const f = params.fieldFreq;
    const vx =
      Math.sin(x * f * 1.0 + t * 0.7) * Math.cos(y * f * 0.6 + t * 0.5) +
      Math.sin(x * f * 0.4 - t * 0.3) * 0.5;
    const vy =
      Math.cos(x * f * 0.7 + t * 0.6) * Math.sin(y * f * 1.0 - t * 0.4) +
      Math.cos(y * f * 0.3 + t * 0.5) * 0.5;
    return { x: vx, y: vy };
  }

  function getInfluence(y) {
    if (!params.gradientEnabled) return 1;
    const bl = textBounds.baseline + params.gradientOffset;
    const range = Math.max(0.0001, bl - textBounds.top);
    const t = Math.max(0, Math.min(1, (bl - y) / range));
    return params.gradientFloor + (1 - params.gradientFloor) * Math.pow(t, params.gradientExponent);
  }

  // ── Compute text width from atlas metrics ────────────
  function computeTextWidth(fontSize) {
    let w = 0;
    let prevU = null;
    for (let i = 0; i < params.text.length; i++) {
      const u = params.text.charCodeAt(i);
      const g = glyphMap[u];
      if (!g) { w += 0.3 * fontSize; prevU = null; continue; }
      if (prevU !== null) {
        const k = kerningMap[prevU + ',' + u];
        if (k) w += k * fontSize;
      }
      w += g.advance * fontSize;
      prevU = u;
    }
    return w;
  }

  // ── Reposition canvas (without rescaling geometry) ─────
  function repositionCanvas() {
    if (!sdfData) return;
    dpr = window.devicePixelRatio || 1;
    
    // Get current H1 position and update canvas position/size
    const h1Rect     = h1.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const left = h1Rect.left - headerRect.left - EXPAND;
    const top  = h1Rect.top  - headerRect.top  - EXPAND;

    canvas.width  = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width  = logicalW + 'px';
    canvas.style.height = logicalH + 'px';
    canvas.style.left   = left + 'px';
    canvas.style.top    = top  + 'px';
  }

  // ── Resize ─────────────────────────────────────────────
  function resize() {
    if (!sdfData) return;
    dpr = window.devicePixelRatio || 1;
    params.fontSize = parseFloat(getComputedStyle(h1).fontSize);

    // Compute text dimensions from atlas font metrics (no auto-scaling)
    const ascPx  = sdfData.metrics.ascender * params.fontSize;
    const descPx = Math.abs(sdfData.metrics.descender) * params.fontSize;
    const textW  = computeTextWidth(params.fontSize);
    const textH  = ascPx + descPx;

    // Position canvas at the H1 element's location
    const h1Rect     = h1.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const left = h1Rect.left - headerRect.left - EXPAND;
    const top  = h1Rect.top  - headerRect.top  - EXPAND;

    // Measure actual rendered text width to compute scale ratio
    const range = document.createRange();
    range.selectNodeContents(h1);
    const domTextRect = range.getBoundingClientRect();

    // Scale factor: browser font metrics vs atlas font metrics
    textScale = (textW > 0) ? domTextRect.width / textW : 1;

    const scaledW = textW * textScale;   // = domTextRect.width
    const scaledH = textH * textScale;

    logicalW = scaledW + 2 * EXPAND;
    logicalH = scaledH + 2 * EXPAND;

    canvas.width  = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width  = logicalW + 'px';
    canvas.style.height = logicalH + 'px';
    canvas.style.left   = left + 'px';
    canvas.style.top    = top  + 'px';

    // Text baseline-left in canvas coordinates
    textOffsetX = EXPAND;
    textOffsetY = EXPAND + ascPx * textScale;

    if (reglInstance) rebuildDrawCalls();
  }

  // ── Build per-glyph subdivided quads ───────────────────
  function buildTextQuads() {
    const positions = [];
    const uvs = [];
    const indices = [];
    const meshLinePositions = [];
    const controlPointPositions = [];

    const { atlas, metrics } = sdfData;
    const atlasW  = atlas.width;
    const atlasH  = atlas.height;
    const fontSize = params.fontSize;

    let cursorX = 0;
    let prevUnicode = null;
    let vertexCount = 0;
    let glyphCount = 0;
    const segments = Math.max(1, Math.floor(params.subdivision));

    for (let i = 0; i < params.text.length; i++) {
      const unicode = params.text.charCodeAt(i);
      const glyph = glyphMap[unicode];

      if (!glyph) {
        cursorX += 0.3 * fontSize;
        prevUnicode = null;
        continue;
      }

      // Kerning
      if (prevUnicode !== null) {
        const kern = kerningMap[prevUnicode + ',' + unicode];
        if (kern) cursorX += kern * fontSize;
      }

      // Space or glyph without rendered bounds
      if (!glyph.planeBounds || !glyph.atlasBounds) {
        cursorX += glyph.advance * fontSize;
        prevUnicode = unicode;
        continue;
      }

      const pb = glyph.planeBounds;
      const ab = glyph.atlasBounds;

      // Quad in text-local space (baseline at y=0, y<0 = above)
      const x0 = cursorX + pb.left  * fontSize;
      const y0 = -(pb.top    * fontSize);
      const x1 = cursorX + pb.right * fontSize;
      const y1 = -(pb.bottom * fontSize);

      // UV coords – flip V because yOrigin=bottom in atlas
      const u0 = ab.left  / atlasW;
      const v0 = 1.0 - (ab.top    / atlasH);
      const u1 = ab.right / atlasW;
      const v1 = 1.0 - (ab.bottom / atlasH);

      // Subdivide glyph into grid for smooth vertex deformation
      const stride = segments + 1;
      for (let gy = 0; gy <= segments; gy++) {
        const ty = gy / segments;
        for (let gx = 0; gx <= segments; gx++) {
          const tx = gx / segments;
          const px = x0 + (x1 - x0) * tx;
          const py = y0 + (y1 - y0) * ty;
          positions.push([px, py]);
          controlPointPositions.push([px, py]);
          uvs.push([
            u0 + (u1 - u0) * tx,
            v0 + (v1 - v0) * ty,
          ]);

          // Wireframe lines
          if (gx < segments) {
            const nx = x0 + (x1 - x0) * ((gx + 1) / segments);
            meshLinePositions.push([px, py], [nx, py]);
          }
          if (gy < segments) {
            const ny = y0 + (y1 - y0) * ((gy + 1) / segments);
            meshLinePositions.push([px, py], [px, ny]);
          }
        }
      }

      // Triangle indices for this glyph
      for (let gy = 0; gy < segments; gy++) {
        for (let gx = 0; gx < segments; gx++) {
          const a = vertexCount + gy * stride + gx;
          const b = a + 1;
          const c = a + stride;
          const d = c + 1;
          indices.push([a, b, d], [a, d, c]);
        }
      }

      vertexCount += stride * stride;
      glyphCount += 1;
      cursorX += glyph.advance * fontSize;
      prevUnicode = unicode;
    }

    return {
      positions, uvs, indices,
      meshLinePositions, controlPointPositions,
      totalWidth: cursorX, glyphCount,
    };
  }

  // ── Rebuild all draw calls ─────────────────────────────
  function rebuildDrawCalls() {
    const geo = buildTextQuads();
    const { positions, uvs, indices, meshLinePositions,
            controlPointPositions, totalWidth, glyphCount } = geo;

    if (positions.length === 0) {
      drawText = null;
      return;
    }

    // Scale geometry to match DOM text width
    const scaledPositions = positions.map(p => [p[0] * textScale, p[1] * textScale]);
    const scaledMeshLines = meshLinePositions.map(p => [p[0] * textScale, p[1] * textScale]);
    const scaledControlPoints = controlPointPositions.map(p => [p[0] * textScale, p[1] * textScale]);

    // Set text bounds for gradient
    const ascPx  = sdfData.metrics.ascender * params.fontSize * textScale;
    const descPx = Math.abs(sdfData.metrics.descender) * params.fontSize * textScale;
    textBounds.top      = -ascPx;
    textBounds.baseline = 0;
    textRect = {
      x: 0,
      y: -ascPx,
      w: totalWidth * textScale,
      h: ascPx + descPx,
      baseline: 0,
      bottom: descPx,
    };

    const hexToRgb = (hex) => [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];

    // ── SDF text ─────────────────────────────────────────
    drawText = reglInstance({
      vert: `
        precision highp float;
        attribute vec2 position;
        attribute vec2 uv;
        uniform vec2 canvasSize;
        uniform vec2 textOffset;
        uniform float time;
        uniform float windEnabled;
        uniform float windIntensity;
        uniform float windSpeed;
        uniform float fieldFreq;
        uniform float gradientEnabled;
        uniform float gradientExponent;
        uniform float gradientFloor;
        uniform float gradientOffsetPx;
        uniform float textTop;
        uniform float textBaseline;
        varying vec2 vUV;
        varying float vInfluence;

        vec2 sampleField(vec2 p, float t) {
          float f = fieldFreq;
          float vx =
            sin(p.x * f * 1.0 + t * 0.7) * cos(p.y * f * 0.6 + t * 0.5) +
            sin(p.x * f * 0.4 - t * 0.3) * 0.5;
          float vy =
            cos(p.x * f * 0.7 + t * 0.6) * sin(p.y * f * 1.0 - t * 0.4) +
            cos(p.y * f * 0.3 + t * 0.5) * 0.5;
          return vec2(vx, vy);
        }

        void main() {
          vec2 world = position;

          float influence = 1.0;
          if (gradientEnabled > 0.5) {
            float bl = textBaseline + gradientOffsetPx;
            float range = max(0.0001, bl - textTop);
            float t = clamp((bl - world.y) / range, 0.0, 1.0);
            influence = gradientFloor + (1.0 - gradientFloor) * pow(t, gradientExponent);
          }

          if (windEnabled > 0.5) {
            vec2 field = sampleField(world, time * windSpeed);
            world += field * (windIntensity * influence);
          }

          // Project: text-space → canvas-space → clip-space
          vec2 canvasPos = world + textOffset;
          vec2 clipSpace = (canvasPos / canvasSize) * 2.0 - 1.0;
          clipSpace.y *= -1.0;
          gl_Position = vec4(clipSpace, 0.0, 1.0);
          vUV = uv;
          vInfluence = influence;
        }
      `,
      frag: `
        #extension GL_OES_standard_derivatives : enable
        precision highp float;
        uniform sampler2D atlas;
        uniform vec3 color;
        uniform float pxRange;
        uniform float threshold;
        varying vec2 vUV;

        void main() {
          // Plain SDF: single channel distance field (grayscale PNG → R=G=B=distance, A=1)
          float sd = texture2D(atlas, vUV).r;

          // Threshold shifts where the edge falls; pxRange keeps AA to ~1 screen pixel
          float screenPxDistance = pxRange * (sd - threshold);
          float opacity = clamp(screenPxDistance + 0.5, 0.0, 1.0);

          if (opacity < 0.01) discard;
          // Premultiplied alpha output
          gl_FragColor = vec4(color * opacity, opacity);
        }
      `,
      attributes: {
        position: scaledPositions,
        uv: uvs,
      },
      uniforms: {
        atlas: atlasTexture,
        canvasSize:       () => [logicalW, logicalH],
        textOffset:       () => [textOffsetX, textOffsetY],
        color:            () => hexToRgb(params.textColor),
        time:             () => time,
        windEnabled:      () => params.windEnabled ? 1 : 0,
        windIntensity:    () => params.windIntensity,
        windSpeed:        () => params.windSpeed,
        fieldFreq:        () => params.fieldFreq,
        gradientEnabled:  () => params.gradientEnabled ? 1 : 0,
        gradientExponent: () => params.gradientExponent,
        gradientFloor:    () => params.gradientFloor,
        gradientOffsetPx: () => params.gradientOffset,
        textTop:          () => textBounds.top,
        textBaseline:     () => textBounds.baseline,
        pxRange: () => {
          const scale = (params.fontSize * textScale) / sdfData.atlas.size;
          return sdfData.atlas.distanceRange * scale * dpr;
        },
        threshold: () => params.threshold,
      },
      elements: indices,
      blend: {
        enable: true,
        func: {
          srcRGB: 'one', srcAlpha: 'one',
          dstRGB: 'one minus src alpha', dstAlpha: 'one minus src alpha',
        },
      },
      depth: { enable: false },
    });

    // ── Mesh wireframe ───────────────────────────────────
    drawMeshLines = null;
    if (scaledMeshLines.length > 0) {
      drawMeshLines = reglInstance({
        vert: `
          precision mediump float;
          attribute vec2 position;
          uniform vec2 canvasSize;
          uniform vec2 textOffset;
          void main() {
            vec2 p = position + textOffset;
            vec2 clipSpace = (p / canvasSize) * 2.0 - 1.0;
            clipSpace.y *= -1.0;
            gl_Position = vec4(clipSpace, 0.0, 1.0);
          }
        `,
        frag: `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(0.4, 0.78, 1.0, 0.35);
          }
        `,
        attributes: { position: scaledMeshLines },
        uniforms: {
          canvasSize: () => [logicalW, logicalH],
          textOffset: () => [textOffsetX, textOffsetY],
        },
        count: scaledMeshLines.length,
        primitive: 'lines',
        lineWidth: 1,
        depth: { enable: false },
      });
    }

    // ── Control points ───────────────────────────────────
    drawMeshPoints = null;
    if (scaledControlPoints.length > 0) {
      drawMeshPoints = reglInstance({
        vert: `
          precision mediump float;
          attribute vec2 position;
          uniform vec2 canvasSize;
          uniform vec2 textOffset;
          void main() {
            vec2 p = position + textOffset;
            vec2 clipSpace = (p / canvasSize) * 2.0 - 1.0;
            clipSpace.y *= -1.0;
            gl_Position = vec4(clipSpace, 0.0, 1.0);
            gl_PointSize = 3.0;
          }
        `,
        frag: `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.95, 0.2, 0.75);
          }
        `,
        attributes: { position: scaledControlPoints },
        uniforms: {
          canvasSize: () => [logicalW, logicalH],
          textOffset: () => [textOffsetX, textOffsetY],
        },
        count: scaledControlPoints.length,
        primitive: 'points',
        depth: { enable: false },
      });
    }

    // ── Gradient debug bands ─────────────────────────────
    drawGradientBands = null;
    const gradPositions = [];
    const gradColors    = [];
    const gradIndices   = [];
    const bandH = 4;
    const pad   = 15;
    let gi = 0;
    for (let y = textRect.y - pad; y < textRect.baseline + pad; y += bandH) {
      const inf   = getInfluence(y);
      const alpha = inf * 0.3;
      const x0g   = textRect.x - pad;
      const x1g   = textRect.x + textRect.w + pad;
      gradPositions.push([x0g, y], [x1g, y], [x1g, y + bandH], [x0g, y + bandH]);
      gradColors.push(
        [1, 0.31, 0.55, alpha], [1, 0.31, 0.55, alpha],
        [1, 0.31, 0.55, alpha], [1, 0.31, 0.55, alpha]
      );
      gradIndices.push([gi, gi + 1, gi + 2], [gi, gi + 2, gi + 3]);
      gi += 4;
    }
    if (gradPositions.length > 0) {
      drawGradientBands = reglInstance({
        vert: `
          precision mediump float;
          attribute vec2 position;
          attribute vec4 color;
          uniform vec2 canvasSize;
          uniform vec2 textOffset;
          varying vec4 vColor;
          void main() {
            vec2 p = position + textOffset;
            vec2 clipSpace = (p / canvasSize) * 2.0 - 1.0;
            clipSpace.y *= -1.0;
            gl_Position = vec4(clipSpace, 0.0, 1.0);
            vColor = color;
          }
        `,
        frag: `
          precision mediump float;
          varying vec4 vColor;
          void main() {
            gl_FragColor = vColor;
          }
        `,
        attributes: { position: gradPositions, color: gradColors },
        uniforms: {
          canvasSize: () => [logicalW, logicalH],
          textOffset: () => [textOffsetX, textOffsetY],
        },
        elements: gradIndices,
        blend: {
          enable: true,
          func: {
            srcRGB: 'src alpha', srcAlpha: 'one',
            dstRGB: 'one minus src alpha', dstAlpha: 'one minus src alpha',
          },
        },
        depth: { enable: false },
      });
    }

    // ── Vector field arrows ──────────────────────────────
    drawVectorField = reglInstance({
      vert: `
        precision mediump float;
        attribute vec2 position;
        uniform vec2 canvasSize;
        uniform vec2 textOffset;
        void main() {
          vec2 p = position + textOffset;
          vec2 clipSpace = (p / canvasSize) * 2.0 - 1.0;
          clipSpace.y *= -1.0;
          gl_Position = vec4(clipSpace, 0.0, 1.0);
        }
      `,
      frag: `
        precision mediump float;
        uniform vec4 color;
        void main() {
          gl_FragColor = color;
        }
      `,
      attributes: { position: reglInstance.prop('positions') },
      uniforms: {
        canvasSize: () => [logicalW, logicalH],
        textOffset: () => [textOffsetX, textOffsetY],
        color: reglInstance.prop('color'),
      },
      count: reglInstance.prop('count'),
      primitive: 'lines',
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha', srcAlpha: 'one',
          dstRGB: 'one minus src alpha', dstAlpha: 'one minus src alpha',
        },
      },
      depth: { enable: false },
    });

    // ── Atlas preview ────────────────────────────────────
    drawAtlasPreview = reglInstance({
      vert: `
        precision mediump float;
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUV;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
          vUV = uv;
        }
      `,
      frag: `
        precision mediump float;
        uniform sampler2D atlas;
        varying vec2 vUV;
        void main() {
          gl_FragColor = vec4(vec3(texture2D(atlas, vUV).r), 0.85);
        }
      `,
      attributes: {
        position: [[-0.95, -0.95], [-0.35, -0.95], [-0.35, -0.35], [-0.95, -0.35]],
        uv: [[0, 0], [1, 0], [1, 1], [0, 1]],
      },
      uniforms: { atlas: atlasTexture },
      elements: [[0, 1, 2], [0, 2, 3]],
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha', srcAlpha: 'one',
          dstRGB: 'one minus src alpha', dstAlpha: 'one minus src alpha',
        },
      },
      depth: { enable: false },
    });
  }

  // ── Build vector field debug data ──────────────────────
  function buildVectorFieldLineData() {
    const positions = [];
    const step     = 20;
    const pad      = 20;
    const arrowLen = 8;
    const t = time * params.windSpeed;

    for (let x = textRect.x - pad; x <= textRect.x + textRect.w + pad; x += step) {
      for (let y = textRect.y - pad; y <= textRect.y + textRect.h + pad; y += step) {
        const v = sampleField(x, y, t);
        const len = Math.hypot(v.x, v.y);
        if (len < 0.01) continue;
        const inf = getInfluence(y);
        const nx  = v.x / len;
        const ny  = v.y / len;
        const ex  = x + nx * arrowLen * inf;
        const ey  = y + ny * arrowLen * inf;
        positions.push([x, y], [ex, ey]);
      }
    }
    return {
      positions: positions.length > 0 ? positions : [[0, 0], [0, 0]],
      count: Math.max(2, positions.length),
      color: [0.2, 0.6, 0.3, 0.5],
    };
  }

  // ── Render loop ────────────────────────────────────────
  let lastTime = 0;
  function renderLoop(currentTime) {
    reglInstance.poll();
    reglInstance.clear({ color: [0, 0, 0, 0], depth: 1 });

    if (params.showGradient && drawGradientBands) drawGradientBands();
    if (params.showVectorField && drawVectorField) {
      drawVectorField(buildVectorFieldLineData());
    }
    if (drawText) drawText();
    if (params.showMesh && drawMeshLines) drawMeshLines();
    if (params.showControlPoints && drawMeshPoints) drawMeshPoints();
    if (params.showAtlas && drawAtlasPreview) drawAtlasPreview();

    // Update time with delta time (in seconds)
    if (lastTime === 0) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000; // convert ms to seconds
    time += deltaTime;
    lastTime = currentTime;
    
    rafId = requestAnimationFrame(renderLoop);
  }

  // ── Load atlas + init WebGL ────────────────────────────
  async function init() {
    try {
      sdfData = ATLAS_DATA;

      for (const g of sdfData.glyphs) glyphMap[g.unicode] = g;
      if (sdfData.kerning) {
        for (const k of sdfData.kerning) {
          kerningMap[k.unicode1 + ',' + k.unicode2] = k.advance;
        }
      }

      const img = new Image();
      img.src = ATLAS_PNG;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      reglInstance = createREGL({
        canvas,
        attributes: { antialias: true, premultipliedAlpha: true, alpha: true },
        extensions: ['OES_standard_derivatives'],
      });

      atlasTexture = reglInstance.texture({
        data: img,
        mag: 'linear',
        min: 'linear',
        flipY: false,
      });

      resize();
      rafId = requestAnimationFrame(renderLoop);
      
      // Reposition canvas on viewport change (without rescaling geometry)
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(repositionCanvas, 50);
      });

    } catch (e) {
      console.error('SDF title warp init failed:', e);
      // Fallback: show the original H1
      h1.classList.add('warp-fallback');
    }
  }

  // ── Debug panel ────────────────────────────────────────
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'warp-debug';
    panel.innerHTML = `
      <style>
        #warp-debug {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 9999;
          background: rgba(10, 14, 18, 0.92);
          color: #ccc;
          font: 11px/1.4 monospace;
          border-radius: 6px;
          min-width: 230px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          user-select: none;
        }
        #warp-debug.minimized .warp-debug-body { display: none; }
        .warp-debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          cursor: pointer;
          border-bottom: 1px solid #333;
        }
        .warp-debug-header span { font-weight: bold; color: #ff3838; }
        .warp-debug-body { padding: 8px 10px; }
        #warp-debug label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 3px 0;
        }
        #warp-debug input[type=range] { width: 100px; }
        #warp-debug input[type=checkbox] { margin: 0; }
        .warp-section {
          margin-top: 8px;
          color: #888;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .warp-val {
          color: #7cc;
          min-width: 44px;
          text-align: right;
        }
      </style>
      <div class="warp-debug-header">
        <span>SDF Warp</span>
        <button id="warpMinBtn" style="background:none;border:none;color:#ccc;font:14px monospace;cursor:pointer;">−</button>
      </div>
      <div class="warp-debug-body">
        <div class="warp-section">Wind</div>
        <label><input type="checkbox" id="wWind" checked> Enabled</label>
        <label>Intensity <input type="range" id="wIntensity" min="0" max="60" step="0.5" value="${params.windIntensity}"> <span class="warp-val" id="wIntensityV">${params.windIntensity}</span></label>
        <label>Speed <input type="range" id="wSpeed" min="0" max="10" step="0.1" value="${params.windSpeed}"> <span class="warp-val" id="wSpeedV">${params.windSpeed}</span></label>
        <label>Frequency <input type="range" id="wFreq" min="0.001" max="0.15" step="0.001" value="${params.fieldFreq}"> <span class="warp-val" id="wFreqV">${params.fieldFreq}</span></label>

        <div class="warp-section">Gradient</div>
        <label><input type="checkbox" id="wGrad" checked> Enabled</label>
        <label>Exponent <input type="range" id="wExp" min="0.1" max="10" step="0.1" value="${params.gradientExponent}"> <span class="warp-val" id="wExpV">${params.gradientExponent}</span></label>
        <label>Floor <input type="range" id="wFloor" min="0" max="1" step="0.01" value="${params.gradientFloor}"> <span class="warp-val" id="wFloorV">${params.gradientFloor}</span></label>
        <label>Offset <input type="range" id="wOffset" min="-30" max="30" step="1" value="${params.gradientOffset}"> <span class="warp-val" id="wOffsetV">${params.gradientOffset}px</span></label>

        <div class="warp-section">SDF Edge</div>
        <label>Threshold <input type="range" id="wThresh" min="0.2" max="0.8" step="0.01" value="${params.threshold}"> <span class="warp-val" id="wThreshV">${params.threshold}</span></label>

        <div class="warp-section">Mesh</div>
        <label>Subdivision <input type="range" id="wSub" min="1" max="24" step="1" value="${params.subdivision}"> <span class="warp-val" id="wSubV">${params.subdivision}</span></label>

        <div class="warp-section">Color</div>
        <label>Text <input type="color" id="wColor" value="${params.textColor}"></label>

        <div class="warp-section">Debug overlays</div>
        <label><input type="checkbox" id="wMesh"> Wireframe</label>
        <label><input type="checkbox" id="wPoints"> Control points</label>
        <label><input type="checkbox" id="wGradVis"> Gradient bands</label>
        <label><input type="checkbox" id="wField"> Vector field</label>
        <label><input type="checkbox" id="wAtlas"> Atlas preview</label>
      </div>
    `;
    document.body.appendChild(panel);

    // Minimize
    document.getElementById('warpMinBtn').addEventListener('click', () => {
      panel.classList.toggle('minimized');
      document.getElementById('warpMinBtn').textContent =
        panel.classList.contains('minimized') ? '+' : '−';
    });

    // Slider binding helper
    function bindSlider(id, prop, transform, onChange) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const val = transform ? transform(e.target.value) : e.target.value;
        params[prop] = val;
        const valEl = document.getElementById(id + 'V');
        if (valEl) {
          if (prop === 'gradientOffset') {
            valEl.textContent = val + 'px';
          } else if (typeof val === 'number') {
            valEl.textContent = val % 1 === 0 ? val : parseFloat(val.toFixed(3));
          } else {
            valEl.textContent = val;
          }
        }
        if (onChange) onChange();
      });
    }

    function bindCheck(id, prop, onChange) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', (e) => {
        params[prop] = e.target.checked;
        if (onChange) onChange();
      });
    }

    const rebuild = () => { if (reglInstance) rebuildDrawCalls(); };

    bindCheck('wWind', 'windEnabled');
    bindSlider('wIntensity', 'windIntensity', parseFloat);
    bindSlider('wSpeed', 'windSpeed', parseFloat);
    bindSlider('wFreq', 'fieldFreq', parseFloat);

    bindCheck('wGrad', 'gradientEnabled', rebuild);
    bindSlider('wExp', 'gradientExponent', parseFloat, rebuild);
    bindSlider('wFloor', 'gradientFloor', parseFloat, rebuild);
    bindSlider('wOffset', 'gradientOffset', parseFloat, rebuild);

    bindSlider('wThresh', 'threshold', parseFloat);
    bindSlider('wSub', 'subdivision', parseFloat, rebuild);
    bindSlider('wColor', 'textColor');

    bindCheck('wMesh', 'showMesh');
    bindCheck('wPoints', 'showControlPoints');
    bindCheck('wGradVis', 'showGradient');
    bindCheck('wField', 'showVectorField');
    bindCheck('wAtlas', 'showAtlas');
  }

  // Only show debug panel when ?debug is in the URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('debug')) {
    createDebugPanel();
  }
  init();
})();
