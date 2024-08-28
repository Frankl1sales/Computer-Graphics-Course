"use strict";

function main() {
  // Get a WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const vertexShaderSource = `#version 300 es

precision mediump float;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 u_lightPosition[NUM_LIGHTS]; // Posições das luzes no espaço do mundo
uniform float u_shininess[NUM_LIGHTS];     // Shininess das luzes

in vec4 a_position;
in vec3 a_normal;

out vec3 v_position;
out vec3 v_normal;
out vec3 v_lightPosition[NUM_LIGHTS]; // Posições das luzes no espaço da câmera
out float v_shininess[NUM_LIGHTS];

void main() {
    vec4 position = u_modelViewMatrix * a_position;
    v_position = position.xyz;
    v_normal = mat3(u_modelViewMatrix) * a_normal;

    for (int i = 0; i < NUM_LIGHTS; i++) {
        v_lightPosition[i] = (u_modelViewMatrix * vec4(u_lightPosition[i], 1.0)).xyz;
        v_shininess[i] = u_shininess[i];
    }

    gl_Position = u_projectionMatrix * position;
}
`;

  const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 v_position;
in vec3 v_normal;
in vec3 v_lightPosition[NUM_LIGHTS];
in float v_shininess[NUM_LIGHTS];

out vec4 fragColor;

uniform vec3 u_ambientColor;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;

void main() {
    vec3 ambient = u_ambientColor;
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec3 lightDir = normalize(v_lightPosition[i] - v_position);
        float shininess = v_shininess[i];
        
        // Normalização
        vec3 norm = normalize(v_normal);

        // Difusa
        float diff = max(dot(norm, lightDir), 0.0);
        diffuse += diff * u_diffuseColor;

        // Especular
        vec3 viewDir = normalize(-v_position); // Assumindo que a câmera está na origem
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
        specular += spec * u_specularColor;
    }

    vec3 color = ambient + diffuse + specular;
    fragColor = vec4(color, 1.0);
}
`;

// Setup GLSL program
var program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

// Look up where the vertex data needs to go
var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var normalAttributeLocation = gl.getAttribLocation(program, "a_normal");

// Número de fontes de luz
const NUM_LIGHTS = 3;

// Arrays para armazenar os valores das luzes
const shininess = new Float32Array(NUM_LIGHTS);
const lightDirection = new Float32Array(NUM_LIGHTS * 3); // Cada direção de luz é um vetor 3D
const lightWorldPosition = new Float32Array(NUM_LIGHTS * 3); // Cada posição de luz é um vetor 3D

// Configurar os valores das fontes de luz
for (let i = 0; i < NUM_LIGHTS; i++) {
    shininess[i] = 150; // Definir o valor de shininess para a i-ésima luz

    // Definir a direção e a posição das luzes
    lightDirection[i * 3 + 0] = Math.sin(lightRotationX[i] || 0); // x da direção da luz
    lightDirection[i * 3 + 1] = Math.cos(lightRotationX[i] || 0) * Math.sin(lightRotationY[i] || 0); // y da direção da luz
    lightDirection[i * 3 + 2] = Math.cos(lightRotationX[i] || 0) * Math.cos(lightRotationY[i] || 0); // z da direção da luz

    lightWorldPosition[i * 3 + 0] = i * 10; // x da posição da luz no espaço do mundo
    lightWorldPosition[i * 3 + 1] = 50; // y da posição da luz no espaço do mundo
    lightWorldPosition[i * 3 + 2] = 100; // z da posição da luz no espaço do mundo
}

// Lookup uniforms
const worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjectionMatrix");
const worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTransposeMatrix");
const worldLocation = gl.getUniformLocation(program, "u_worldMatrix");
const lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
const lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
const viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
const shininessLocation = gl.getUniformLocation(program, "u_shininess");
const innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
const outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");

// Create a vertex array object (attribute state)
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// Turn on the attribute
gl.enableVertexAttribArray(positionAttributeLocation);

// Create a buffer for positions
var positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
setGeometry(gl);

// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

// Create a buffer for normals
var normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
setNormals(gl);

// Turn on the attribute
gl.enableVertexAttribArray(normalAttributeLocation);

// Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

// Set up the uniforms
function setUniforms() {
    gl.useProgram(program);
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform3fv(lightWorldPositionLocation, lightWorldPosition);
    gl.uniform3fv(viewWorldPositionLocation, camera);
    gl.uniform1fv(shininessLocation, shininess);
    gl.uniform1f(innerLimitLocation, innerLimit);
    gl.uniform1f(outerLimitLocation, outerLimit);
}

// Convert degrees to radians
function radToDeg(r) {
    return r * 180 / Math.PI;
}

// Convert radians to degrees
function degToRad(d) {
    return d * Math.PI / 180;
}

var fieldOfViewRadians = degToRad(60);
var fRotationRadians = 0;
var lightRotationX = [0, 0, 0]; // Adapte o número de fontes de luz
var lightRotationY = [0, 0, 0]; // Adapte o número de fontes de luz
var innerLimit = degToRad(10);
var outerLimit = degToRad(20);

// Main render loop
function drawScene() {
    // Update scene as needed
    setUniforms();
    // Clear and draw
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

// Call the main render function
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
    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform3fv(lightWorldPositionLocation, lightWorldPosition);
    gl.uniform3fv(viewWorldPositionLocation, camera);
    gl.uniform1fv(shininessLocation, shininess);
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
