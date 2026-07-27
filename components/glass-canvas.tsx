"use client";

import { useEffect, useRef } from "react";

/**
 * Başlık kapsülünün içine WebGL ile gerçek cam optiği çizer:
 *
 * - Yuvarlatılmış dikdörtgen SDF ile cam kenarı: ışık yönüne göre parlak
 *   rim (üst-sol) ve koyu kalınlık gölgesi (alt-sağ) — cam "tüp" hissi.
 * - İmleci yumuşak gecikmeyle takip eden speküler ışık yönü.
 * - Zamanla akan girişim deseni (lime tonlu kaustik kırılmalar).
 * - Kapsülü periyodik olarak geçen çapraz ışık süpürmesi.
 *
 * Saydam canvas, `backdrop-filter` bulanıklığının ÜSTÜNE optik katmanı
 * ekler; DOM içeriğini örnekleyemediğimiz için gerçek kırılma yerine
 * fiziksel görünümlü ışık modeli kullanılır (üretimdeki "liquid glass"
 * yaklaşımı). WebGL yoksa ya da hareket azaltma açıksa sessizce devre
 * dışı kalır; bulanık cam görünümü korunur.
 */

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_radius;

float sdRRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 b = u_res * 0.5;
  vec2 p = frag - b;

  float d = sdRRect(p, b, u_radius);
  float inside = 1.0 - smoothstep(-1.5, 0.5, d);
  if (inside <= 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  /* Kenar normali (SDF gradyanı, sonlu fark) */
  float e = 1.2;
  vec2 g = vec2(
    sdRRect(p + vec2(e, 0.0), b, u_radius) - sdRRect(p - vec2(e, 0.0), b, u_radius),
    sdRRect(p + vec2(0.0, e), b, u_radius) - sdRRect(p - vec2(0.0, e), b, u_radius)
  );
  vec2 nrm = g / max(length(g), 0.0001);

  /* Işık üst-soldan; imleçle hafifçe gezinir */
  vec2 lightDir = normalize(vec2(
    -0.55 + (u_pointer.x - 0.5) * 0.9,
    0.75 + (u_pointer.y - 0.5) * 0.3
  ));
  float facing = dot(nrm, lightDir);

  float rim = smoothstep(-7.0, -1.0, d);
  float rimLight = rim * pow(max(facing, 0.0), 1.5);
  float rimDark = rim * pow(max(-facing, 0.0), 1.3);

  vec2 uv = frag / u_res;
  float t = u_time;

  /* Akan girişim deseni: seyrek kaustik tepeler */
  float w = sin(uv.x * 9.0 + t * 0.8 + sin(uv.y * 7.0 - t * 0.6) * 1.6)
          * sin(uv.y * 6.5 - t * 0.5 + sin(uv.x * 5.0 + t * 0.45) * 1.4);
  float caustic = smoothstep(0.6, 0.98, w * 0.5 + 0.5);

  /* Çapraz ışık süpürmesi */
  float diag = uv.x * 0.78 + (1.0 - uv.y) * 0.32;
  float sweepPos = fract(t * 0.055 + u_pointer.x * 0.12);
  float band = smoothstep(0.085, 0.0, abs(diag - mix(-0.25, 1.45, sweepPos)));

  vec3 lime = vec3(0.79, 0.95, 0.43);

  vec3 col = vec3(0.0);
  float a = 0.0;

  col += vec3(1.0) * (caustic * 0.085) + lime * (caustic * 0.05);
  a += caustic * 0.075;

  col += vec3(1.0) * (band * 0.11);
  a += band * 0.09;

  col += vec3(1.0) * (rimLight * 0.95);
  a += rimLight * 0.8;

  /* Kenarın gölgede kalan tarafı: cam kalınlığı */
  col = mix(col, vec3(0.06, 0.11, 0.09), clamp(rimDark * 0.85, 0.0, 1.0));
  a += rimDark * 0.35;

  /* Bantlanmayı önlemek için dither */
  col += (hash(frag) - 0.5) * 0.012;

  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * inside);
}
`;

export function GlassCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const header = canvas.closest(".site-header");
    const inner = canvas.closest(".site-header-inner");
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!header || !inner || !gl) {
      canvas.dataset.glass = "unsupported";
      return;
    }

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, VERT_SRC);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    const program = gl.createProgram();
    if (!vert || !frag || !program) {
      canvas.dataset.glass = "shader-error";
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.dataset.glass = "shader-error";
      return;
    }
    gl.useProgram(program);

    /* Tam ekran üçgen */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uRadius = gl.getUniformLocation(program, "u_radius");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    let running = false;
    let start = performance.now();
    let px = 0.5;
    let py = 0.5;
    let tx = 0.5;
    let ty = 0.5;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = inner.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      const radius =
        parseFloat(window.getComputedStyle(inner).borderTopLeftRadius) || 0;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uRadius, radius * dpr);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(inner);
    resize();

    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame);
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, px, py);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      if (on) {
        start = performance.now();
        raf = window.requestAnimationFrame(frame);
      } else {
        window.cancelAnimationFrame(raf);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
    const sync = () =>
      setRunning(header.classList.contains("is-scrolled") && !document.hidden);

    const classWatcher = new MutationObserver(sync);
    classWatcher.observe(header, {
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("visibilitychange", sync);

    const onPointer = (event: PointerEvent) => {
      tx = event.clientX / window.innerWidth;
      ty = 1 - event.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onLost = (event: Event) => {
      event.preventDefault();
      setRunning(false);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    sync();
    canvas.dataset.glass = "ready";

    return () => {
      setRunning(false);
      observer.disconnect();
      classWatcher.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={canvasRef} className="glass-canvas" aria-hidden="true" />;
}
