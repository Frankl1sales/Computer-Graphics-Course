const depthFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.framebufferTexture2D(
      gl.FRAMEBUFFER,       // target
      gl.DEPTH_ATTACHMENT,  // attachment point
      gl.TEXTURE_2D,        // texture target
      depthTexture,         // texture
      0);                   // mip level

function drawScene(
    projectionMatrix,
    cameraMatrix,
    textureMatrix,
    lightWorldMatrix,
    programInfo) {
  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(programInfo.program);

  // set uniforms that are the same for both the sphere and plane
  // note: any values with no corresponding uniform in the shader
  // are ignored.
  twgl.setUniforms(programInfo, {
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_bias: settings.bias,
    u_textureMatrix: textureMatrix,
    u_projectedTexture: depthTexture,
    u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
  });

// Draw the scene.
function render() {
twgl.resizeCanvasToDisplaySize(gl.canvas);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

// first draw from the POV of the light
const lightWorldMatrix = m4.lookAt(
    [settings.posX, settings.posY, settings.posZ],          // position
    [settings.targetX, settings.targetY, settings.targetZ], // target
    [0, 1, 0],                                              // up
);
const lightProjectionMatrix = settings.perspective
    ? m4.perspective(
        degToRad(settings.fieldOfView),
        settings.projWidth / settings.projHeight,
        0.5,  // near
        10)   // far
    : m4.orthographic(
        -settings.projWidth / 2,   // left
        settings.projWidth / 2,   // right
        -settings.projHeight / 2,  // bottom
        settings.projHeight / 2,  // top
        0.5,                      // near
        10);                      // far

// draw to the depth texture
gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
gl.viewport(0, 0, depthTextureSize, depthTextureSize);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

drawScene(
    lightProjectionMatrix,
    lightWorldMatrix,
    m4.identity(),
    lightWorldMatrix,
    colorProgramInfo);

// now draw scene to the canvas projecting the depth texture into the scene
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

let textureMatrix = m4.identity();
textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
// use the inverse of this world matrix to make
// a matrix that will transform other positions
// to be relative this this world space.
textureMatrix = m4.multiply(
    textureMatrix,
    m4.inverse(lightWorldMatrix));

// Compute the projection matrix
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const projectionMatrix =
    m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

// Compute the camera's matrix using look at.
const cameraPosition = [settings.cameraX, settings.cameraY, 15];
const target = [0, 0, 0];
const up = [0, 1, 0];
const cameraMatrix = m4.lookAt(cameraPosition, target, up);

drawScene(
    projectionMatrix,
    cameraMatrix,
    textureMatrix,
    lightWorldMatrix,
    textureProgramInfo);

// ------ Draw the frustum ------
{
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.useProgram(colorProgramInfo.program);

  // Setup all the needed attributes.
  gl.bindVertexArray(cubeLinesVAO);

  // scale the cube in Z so it's really long
  // to represent the texture is being projected to
  // infinity
  const mat = m4.multiply(
      lightWorldMatrix, m4.inverse(lightProjectionMatrix));

  // Set the uniforms we just computed
  twgl.setUniforms(colorProgramInfo, {
    u_color: [1, 1, 1, 1],
    u_view: viewMatrix,
    u_projection: projectionMatrix,
    u_world: mat,
  });

  // calls gl.drawArrays or gl.drawElements
  twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
  
}
requestAnimationFrame(render);
}

requestAnimationFrame(render);
}

// Adiciona o evento ao botão para gerar novo cenário
document.getElementById("generateButton").addEventListener("click", generateNewScenario);

// Chama a geração de cenário inicial
generateNewScenario();
}


main();

