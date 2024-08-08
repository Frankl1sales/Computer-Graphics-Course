"use strict";
var vertexShaderSource = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_reverseLightDirection;

varying vec3 v_normal;

void main() {
  gl_Position = u_worldViewProjection * a_position;

  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
`;

var fragmentShaderSource =`
    precision mediump float;

    varying vec3 v_normal;

    uniform vec3 u_reverseLightDirection;

    void main() {
      vec3 normal = normalize(v_normal);
      float light = dot(normal, u_reverseLightDirection);

      gl_FragColor = vec4(1, 1, 1, 1);
      gl_FragColor.rgb *= light;
    }
  `;
function main() {
  // Get a WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Setup GLSL program
  var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

  // Look up where the vertex data needs to go
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var normalAttributeLocation = gl.getAttribLocation(program, "a_normal");

  // Lookup uniforms
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var lightColorLocation = gl.getUniformLocation(program, "u_lightColor");
  var shininessLocation = gl.getUniformLocation(program, "u_shininess");
  var lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
  var innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
  var outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");
  var lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
  var viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
  var worldLocation = gl.getUniformLocation(program, "u_world");

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // And make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set Geometry
  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // The data is 32bit floats
  var normalize = false; // Don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // Start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  // Create the normal buffer, make it the current ARRAY_BUFFER
  // and copy in the normal values
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  setNormals(gl);

  // Turn on the attribute
  gl.enableVertexAttribArray(normalAttributeLocation);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var fRotationRadians = 0;
  var shininess = 150;
  var lightRotationX = 0;
  var lightRotationY = 0;
  var lightDirection = [0, 0, 1];  // This is computed in updateScene
  var innerLimit = degToRad(10);
  var outerLimit = degToRad(20);

  drawScene();

  // Setup a UI
  webglLessonsUI.setupSlider("#fRotation", {value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360});
  webglLessonsUI.setupSlider("#lightRotationX", {value: lightRotationX, slide: updatelightRotationX, min: -2, max: 2, precision: 2, step: 0.001});
  webglLessonsUI.setupSlider("#lightRotationY", {value: lightRotationY, slide: updatelightRotationY, min: -2, max: 2, precision: 2, step: 0.001});
  webglLessonsUI.setupSlider("#innerLimit", {value: radToDeg(innerLimit), slide: updateInnerLimit, min: 0, max: 180});
  webglLessonsUI.setupSlider("#outerLimit", {value: radToDeg(outerLimit), slide: updateOuterLimit, min: 0, max: 180});

  function updateRotation(event, ui) {
    fRotationRadians = degToRad(ui.value);
    drawScene();
  }

  function updatelightRotationX(event, ui) {
    lightRotationX = ui.value;
    drawScene();
  }

  function updatelightRotationY(event, ui) {
    lightRotationY = ui.value;
    drawScene();
  }

  function updateInnerLimit(event, ui) {
    innerLimit = degToRad(ui.value);
    drawScene();
  }

  function updateOuterLimit(event, ui) {
    outerLimit = degToRad(ui.value);
    drawScene();
  }

  // Draw the scene
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.uniform3fv(lightColorLocation, [1.0, 0.0, 0.0]); // Luz branca

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default, backfacing triangles
    // will be culled
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want
    gl.bindVertexArray(vao);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);

    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Compute the world matrix
    var worldMatrix = m4.yRotation(fRotationRadians);

    // Compute the world view projection matrix
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);

    // Compute the world inverse transpose matrix
    var worldInverseTransposeMatrix = m4.transpose(m4.inverse(worldMatrix));

    // Set the uniform values
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

    // Set the light direction and other uniforms
    gl.uniform3fv(lightDirectionLocation, [Math.sin(lightRotationX), Math.cos(lightRotationX) * Math.sin(lightRotationY), Math.cos(lightRotationX) * Math.cos(lightRotationY)]);
    gl.uniform3fv(lightWorldPositionLocation, [0, 100, 100]);
    gl.uniform3fv(viewWorldPositionLocation, camera);
    gl.uniform1f(shininessLocation, shininess);
    gl.uniform1f(innerLimitLocation, innerLimit);
    gl.uniform1f(outerLimitLocation, outerLimit);

    // Draw the geometry
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }

  // Fill the buffer with geometry data
  function setGeometry(gl) {
    var positions = new Float32Array([
      // Cube vertices
      -1, -1, -1,
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
      -1, -1,  1,
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  }

  // Fill the buffer with normal data
  function setNormals(gl) {
    var normals = new Float32Array([
      // Normals for the 6 faces of the cube
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
     -1, 0, 0,
     -1, 0, 0,
     -1, 0, 0,
     -1, 0, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  }
}
