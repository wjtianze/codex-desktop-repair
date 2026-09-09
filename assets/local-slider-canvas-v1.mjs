// Decorative rendering must not keep hidden windows busy or reset an unchanged buffer.
export function startSliderCanvas(canvas, reduceMotion, createProgram, vertices) {
  const win = canvas.ownerDocument.defaultView, doc = canvas.ownerDocument;
  if (!win.WebGLRenderingContext || !win.ResizeObserver) return;
  const gl = canvas.getContext('webgl', {alpha:true,antialias:false,depth:false,powerPreference:'low-power',stencil:false});
  if (!gl) return;
  const program = createProgram(gl);
  if (!program) return;
  const buffer = gl.createBuffer();
  if (!buffer) { gl.deleteProgram(program); return; }
  const position = gl.getAttribLocation(program,'aPosition');
  const resolution = gl.getUniformLocation(program,'uResolution'), time = gl.getUniformLocation(program,'uTime');
  const started = win.performance.now();
  let frame = 0, disposed = false, lastDraw = -Infinity, resizePending = true;
  gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  function draw(now) {
    frame = 0;
    if (disposed || doc.hidden) return;
    if (resizePending) {
      resizePending = false;
      const rect = canvas.getBoundingClientRect(), ratio = Math.min(win.devicePixelRatio || 1,2);
      const width = Math.max(Math.round(rect.width),1), height = Math.max(Math.round(rect.height),1);
      const pixelsX = Math.round(width*ratio), pixelsY = Math.round(height*ratio);
      if (canvas.width !== pixelsX) canvas.width = pixelsX;
      if (canvas.height !== pixelsY) canvas.height = pixelsY;
      gl.viewport(0,0,pixelsX,pixelsY); gl.uniform2f(resolution,width,height);
      lastDraw = -Infinity;
    }
    if (now-lastDraw >= 1000/30) {
      gl.uniform1f(time,reduceMotion ? 0 : (now-started)/1000);
      gl.drawArrays(gl.TRIANGLES,0,6); lastDraw = now;
    }
    if (!reduceMotion) schedule();
  }
  function schedule() { if (!disposed && !doc.hidden && !frame) frame = win.requestAnimationFrame(draw); }
  const observer = new win.ResizeObserver(() => { resizePending = true; schedule(); });
  function visibility() {
    if (doc.hidden) { if (frame) win.cancelAnimationFrame(frame); frame = 0; }
    else { resizePending = true; schedule(); }
  }
  observer.observe(canvas); doc.addEventListener('visibilitychange',visibility); schedule();
  return () => {
    if (disposed) return;
    disposed = true; if (frame) win.cancelAnimationFrame(frame);
    observer.disconnect(); doc.removeEventListener('visibilitychange',visibility);
    gl.deleteBuffer(buffer); gl.deleteProgram(program);
  };
}
