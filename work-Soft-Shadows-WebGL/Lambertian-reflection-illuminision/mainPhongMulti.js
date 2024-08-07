"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec3 a_normal;

uniform vec3 u_viewWorldPosition;
uniform vec3 u_lightWorldPositions[3];
uniform vec3 u_lightColors[3];

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec3 v_normal;

out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_worldInverseTranspose) * a_normal;

  // compute the world position of the surfoace
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;

  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

  // compute the vector of the surface to the view/camera
  // and pass it to the fragment shader
  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
`;

  const fragmentShaderSource = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform float u_shininess;
uniform vec3 u_lightDirections[3];
uniform float u_innerLimits[3];          
uniform float u_outerLimits[3];          
uniform vec3 u_lightWorldPositions[3];
uniform vec3 u_lightColors[3];       // in dot space

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 totalLight = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);

  for (int i = 0; i < 3; ++i) {
    vec3 surfaceToLightDirection = normalize(u_lightWorldPositions[i] - (u_world * a_position).xyz);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float dotFromDirection = dot(surfaceToLightDirection, -u_lightDirections[i]);
    float inLight = smoothstep(u_outerLimits[i], u_innerLimits[i], dotFromDirection);
    float light = inLight * dot(normal, surfaceToLightDirection);
    float specular = inLight * pow(dot(normal, halfVector), u_shininess);

    totalLight += u_lightColors[i] * light;
    totalSpecular += u_lightColors[i] * specular;
  }

  outColor = u_color;
  outColor.rgb *= totalLight;
  outColor.rgb += totalSpecular;
}
`;

  // setup GLSL program
  var program = webglUtils.createProgramFromSources(gl,
      [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var normalAttributeLocation = gl.getAttribLocation(program, "a_normal");

  // Lookup additional uniforms
  var lightWorldPositionsLocation = [
    gl.getUniformLocation(program, "u_lightWorldPositions[0]"),
    gl.getUniformLocation(program, "u_lightWorldPositions[1]"),
    gl.getUniformLocation(program, "u_lightWorldPositions[2]"),
  ];
  var lightColorsLocation = [
      gl.getUniformLocation(program, "u_lightColors[0]"),
      gl.getUniformLocation(program, "u_lightColors[1]"),
      gl.getUniformLocation(program, "u_lightColors[2]"),
  ];
  var lightDirectionsLocation = [
      gl.getUniformLocation(program, "u_lightDirections[0]"),
      gl.getUniformLocation(program, "u_lightDirections[1]"),
      gl.getUniformLocation(program, "u_lightDirections[2]"),
  ];
  var innerLimitsLocation = [
      gl.getUniformLocation(program, "u_innerLimits[0]"),
      gl.getUniformLocation(program, "u_innerLimits[1]"),
      gl.getUniformLocation(program, "u_innerLimits[2]"),
  ];
  var outerLimitsLocation = [
      gl.getUniformLocation(program, "u_outerLimits[0]"),
      gl.getUniformLocation(program, "u_outerLimits[1]"),
      gl.getUniformLocation(program, "u_outerLimits[2]"),
  ];

  // Define positions and colors for multiple lights
  var lightPositions = [
      [40, 60, 120],
      [-60, 100, 150],
      [20, 30, 80],
  ];
  var lightColors = [
      [1, 1, 1], // white
      [1, 0, 0], // red
      [0, 0, 1], // blue
  ];
  var lightDirections = [
      [0, 0, -1],
      [0, -1, 0],
      [1, 0, 0],
  ];
  var innerLimits = [
      degToRad(10),
      degToRad(15),
      degToRad(20),
  ];
  var outerLimits = [
      degToRad(20),
      degToRad(25),
      degToRad(30),
  ];

  gl.uniform3fv(lightWorldPositionsLocation[0], lightPositions[0]);
  gl.uniform3fv(lightWorldPositionsLocation[1], lightPositions[1]);
  gl.uniform3fv(lightWorldPositionsLocation[2], lightPositions[2]);

  gl.uniform3fv(lightColorsLocation[0], lightColors[0]);
  gl.uniform3fv(lightColorsLocation[1], lightColors[1]);
  gl.uniform3fv(lightColorsLocation[2], lightColors[2]);

  gl.uniform3fv(lightDirectionsLocation[0], lightDirections[0]);
  gl.uniform3fv(lightDirectionsLocation[1], lightDirections[1]);
  gl.uniform3fv(lightDirectionsLocation[2], lightDirections[2]);

  gl.uniform1f(innerLimitsLocation[0], Math.cos(innerLimits[0]));
  gl.uniform1f(innerLimitsLocation[1], Math.cos(innerLimits[1]));
  gl.uniform1f(innerLimitsLocation[2], Math.cos(innerLimits[2]));

  gl.uniform1f(outerLimitsLocation[0], Math.cos(outerLimits[0]));
  gl.uniform1f(outerLimitsLocation[1], Math.cos(outerLimits[1]));
  gl.uniform1f(outerLimitsLocation[2], Math.cos(outerLimits[2]));

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set Geometry.
  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // create the normalr buffer, make it the current ARRAY_BUFFER
  // and copy in the normal values
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  setNormals(gl);

  // Turn on the attribute
  gl.enableVertexAttribArray(normalAttributeLocation);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      normalAttributeLocation, size, type, normalize, stride, offset);


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
  var lightDirection = [0, 0, 1];  // this is computed in updateScene
  var innerLimit = degToRad(10);
  var outerLimit = degToRad(20);

  drawScene();

  // Setup a ui.
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

  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
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

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Draw a F at the origin
    var worldMatrix = m4.yRotation(fRotationRadians);

    // Multiply the matrices.
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    var worldInverseMatrix = m4.inverse(worldMatrix);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set the matrices
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

    // Set the color to use
    gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green

    // set the light position
    const lightPosition = [40, 60, 120];
    gl.uniform3fv(lightWorldPositionLocation, lightPosition);

    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, camera);

    // set the shininess
    gl.uniform1f(shininessLocation, shininess);

    // set the spotlight uniforms

    // since we don't have a plane like most spotlight examples
    // let's point the spot light at the F
    {
        var lmat = m4.lookAt(lightPosition, target, up);
        lmat = m4.multiply(m4.xRotation(lightRotationX), lmat);
        lmat = m4.multiply(m4.yRotation(lightRotationY), lmat);
        // get the zAxis from the matrix
        // negate it because lookAt looks down the -Z axis
        lightDirection = [-lmat[8], -lmat[9], -lmat[10]];
    }

    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform1f(innerLimitLocation, Math.cos(innerLimit));
    gl.uniform1f(outerLimitLocation, Math.cos(outerLimit));

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  var positions = new Float32Array([
          // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0,
      ]);

  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setNormals(gl) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // top rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // middle rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // middle rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // top rung right
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // top of middle rung
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // right of middle rung
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom of middle rung.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // right of bottom
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
      ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

main();
