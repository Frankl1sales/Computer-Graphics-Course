'use strict';

const vs = `#version 300 es
in vec4 a_position;       // A posição do vértice no espaço do modelo, recebida como um atributo
in vec2 a_texcoord;       // As coordenadas de textura para o vértice, recebidas como um atributo
in vec3 a_normal;         // O vetor normal para o vértice, recebido como um atributo

uniform mat4 u_projection; // Matriz de projeção para transformar a posição do espaço do câmera para o espaço de tela
uniform mat4 u_view;       // Matriz de visualização para transformar a posição do espaço do mundo para o espaço do câmera
uniform mat4 u_world;      // Matriz de modelo que transforma a posição do espaço do modelo para o espaço do mundo
uniform mat4 u_textureMatrix; // Matriz para transformar a posição do espaço do mundo para o espaço da textura (para sombras)
uniform vec3 u_viewWorldPosition; // Posição da câmera no espaço do mundo

out vec2 v_texcoord;       // Variável de saída para passar as coordenadas de textura para o fragment shader
out vec4 v_projectedTexcoord; // Variável de saída para passar as coordenadas projetadas para o fragment shader
out vec3 v_normal;         // Variável de saída para passar o vetor normal para o fragment shader
out vec3 v_surfaceToView;  // Variável de saída para passar o vetor da superfície até a visão para o fragment shader

void main() {
    // Calcula a posição do vértice no espaço do mundo usando a matriz de modelo
    vec4 worldPosition = u_world * a_position;

    // Calcula a posição final do vértice no espaço de tela usando as matrizes de projeção e visualização
    gl_Position = u_projection * u_view * worldPosition;

    // Passa as coordenadas de textura diretamente para o fragment shader
    v_texcoord = a_texcoord;

    // Calcula as coordenadas projetadas para sombras usando a matriz de textura
    v_projectedTexcoord = u_textureMatrix * worldPosition;

    // Calcula o vetor normal no espaço do mundo usando a matriz de modelo (sem translação)
    v_normal = mat3(u_world) * a_normal;

    // Calcula o vetor da superfície até a visão (câmera) para uso na iluminação
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
}
`;

const fs = `#version 300 es
precision highp float;

in vec2 v_texcoord;            // Coordenadas de textura interpoladas do vertex shader
in vec4 v_projectedTexcoord;   // Coordenadas projetadas interpoladas do vertex shader
in vec3 v_normal;              // Vetor normal interpolado do vertex shader
in vec3 v_surfaceToView;       // Vetor da superfície até a visão interpolado do vertex shader

uniform vec4 u_colorMult;      // Multiplicador de cor aplicado à textura
uniform sampler2D u_texture;   // Textura base do fragmento
uniform sampler2D u_projectedTexture; // Textura de profundidade para sombras
uniform float u_bias;          // Bias para evitar artefatos de sombras
uniform float u_penumbralSize; // Tamanho da penumbra
uniform vec3 u_reverseLightDirection; // Direção da luz reversa (iluminação direcional)

out vec4 outColor;             // Cor final do fragmento

// Valor fixo para o tamanho da penumbra
const float PENUMBRA_SIZE = 0.06; // Ajuste conforme necessário

void main() {
    // Normaliza o vetor normal interpolado
    vec3 normal = normalize(v_normal);

    // Calcula a iluminação direcional com base na direção da luz e o vetor normal
    float light = max(dot(normal, u_reverseLightDirection), 0.0);

    // Calcula as coordenadas projetadas para a textura de sombras
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    float currentDepth = projectedTexcoord.z + u_bias; // Profundidade atual com bias para suavização

    // Verifica se a coordenada projetada está dentro do intervalo da textura
    bool inRange = projectedTexcoord.x >= 0.0 && projectedTexcoord.x <= 1.0 &&
                   projectedTexcoord.y >= 0.0 && projectedTexcoord.y <= 1.0;

    // Obtém a profundidade projetada da textura de sombras
    float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;

    // Calcula a diferença de profundidade
    float depthDifference = projectedDepth - currentDepth;

    // Calcula a umbra e penumbra
    float penumbra = smoothstep(0.0, PENUMBRA_SIZE, depthDifference);
    float shadow = (inRange) ? (depthDifference < 0.0 ? 0.0 : penumbra) : 0.6;

    // Obtém a cor da textura base e aplica o multiplicador de cor
    vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;

    // Aplica a iluminação e a intensidade da sombra à cor final
    outColor = vec4(texColor.rgb * light * shadow, texColor.a);
}

`;

const colorVS = `#version 300 es
in vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // Multiply the position by the matrices.
  gl_Position = u_projection * u_view * u_world * a_position;
}
`;

const colorFS = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}
`;
  
async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    return;
  }

  // setup GLSL programs
  // note: Since we're going to use the same VAO with multiple
  // shader programs we need to make sure all programs use the
  // same attribute locations. There are 2 ways to do that.
  // (1) assign them in GLSL. (2) assign them by calling `gl.bindAttribLocation`
  // before linking. We're using method 2 as it's more. D.R.Y.
  const programOptions = {
    attribLocations: {
      'a_position': 0,
      'a_normal':   1,
      'a_texcoord': 2,
      'a_color':    3,
    },
  };
  const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs], programOptions);
  const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS], programOptions);
  // Tell the twgl to match position with a_position,
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");
  
  const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(
      gl,
      1,  // radius
      32, // subdivisions around
      24, // subdivisions down
  );
  const sphereVAO = twgl.createVAOFromBufferInfo(
      gl, textureProgramInfo, sphereBufferInfo);
  const planeBufferInfo = twgl.primitives.createPlaneBufferInfo(
      gl,
      200,  // width
      200,  // height
      1,   // subdivisions across
      1,   // subdivisions down
  );
  const planeVAO = twgl.createVAOFromBufferInfo(
      gl, textureProgramInfo, planeBufferInfo);
  const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(
      gl,
      2,  // size
  );
  const cubeVAO = twgl.createVAOFromBufferInfo(
      gl, textureProgramInfo, cubeBufferInfo);
  const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [
      -1, -1, -1,
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
      -1, -1,  1,
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
    ],
    indices: [
      0, 1,
      1, 3,
      3, 2,
      2, 0,

      4, 5,
      5, 7,
      7, 6,
      6, 4,

      0, 4,
      1, 5,
      3, 7,
      2, 6,
    ],
  });
  const cubeLinesVAO = twgl.createVAOFromBufferInfo(
      gl, colorProgramInfo, cubeLinesBufferInfo);
  
  // Carregamento do OBJ e MTL:
  const objHref = 'assets/windmill.obj';
  const response = await fetch(objHref);
  const text = await response.text();
  const obj = parseOBJ(text);
  const baseHref = new URL(objHref, window.location.href);


  // image texture Board
  const imageboardTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, imageboardTexture);
  // Inicializa com uma textura vazia
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  const image = new Image();
    image.src = 'gray_rocks_diff_4k.jpg';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, imageboardTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,                // mip level
        gl.RGBA,          // internal format
        gl.RGBA,          // format
        gl.UNSIGNED_BYTE, // type
        image             // image
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
  image.onerror = (error) => {
      console.error('Erro ao carregar a imagem:', error);
   };
    
  // make a 8x8 checkerboard texture
  const checkerboardTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,                // mip level
      gl.LUMINANCE,     // internal format
      8,                // width
      8,                // height
      0,                // border
      gl.LUMINANCE,     // format
      gl.UNSIGNED_BYTE, // type
      new Uint8Array([  // data
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      ]));
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const depthTexture = gl.createTexture();
  const depthTextureSize = 512;
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
      gl.TEXTURE_2D,      // target
      0,                  // mip level
      gl.DEPTH_COMPONENT32F, // internal format
      depthTextureSize,   // width
      depthTextureSize,   // height
      0,                  // border
      gl.DEPTH_COMPONENT, // format
      gl.FLOAT,           // type
      null);              // data
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const depthFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  gl.framebufferTexture2D(
      gl.FRAMEBUFFER,       // target
      gl.DEPTH_ATTACHMENT,  // attachment point
      gl.TEXTURE_2D,        // texture target
      depthTexture,         // texture
      0);                   // mip level

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  const settings = {
    cameraX: 6,
    cameraY: 12,
    posX: 2.5,
    posY: 5,
    posZ: 7,
    targetX: 3.5,
    targetY: 0,
    targetZ: 3.5,
    projWidth: 10,
    projHeight: 10,
    perspective: True,
    fieldOfView: 120,
    bias: -0.066,
    numWindmills: 5,
    windmillsDistance: 15,
    numSkeleton_Arrow: 3,
    Skeleton_ArrowDistance: 10,
    numSkeleton_Warrior: 4,
    Skeleton_WarriorDistance: 12,
    numTrees: 20,
    TreesDistance: 8,
    numPlanes: 2,
    planesDistance: 18,
    numZombie: 7,
    zombieDistance: 9,
  };

 
 
  
  
  // Função para gerar um novo cenário

  async function generateNewScenario() {
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
      { type: 'slider', key: 'cameraX', min: -50, max: 50, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'cameraY', min: 1, max: 20, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'posX', min: -10, max: 10, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'posY', min: 1, max: 20, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'posZ', min: 1, max: 20, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'targetX', min: -10, max: 10, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'targetY', min: 0, max: 20, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'targetZ', min: -10, max: 20, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'projWidth', min: 0, max: 100, change: render, precision: 2, step: 0.001 },
      { type: 'slider', key: 'projHeight', min: 0, max: 100, change: render, precision: 2, step: 0.001 },
      { type: 'checkbox', key: 'perspective', change: render },
      { type: 'slider', key: 'fieldOfView', min: 1, max: 179, change: render },
      { type: 'slider', key: 'bias', min: -0.01, max: 0.00001, change: render, precision: 4, step: 0.0001 },
      
      // Substituindo controles de número por sliders
      { type: 'slider', key: 'numWindmills', min: 0, max: 500, step: 1, change: render },
      { type: 'slider', key: 'numSkeleton_Arrow', min: 0, max: 500, step: 1, change: render },
      { type: 'slider', key: 'numSkeleton_Warrior', min: 0, max: 500, step: 1, change: render },
      { type: 'slider', key: 'numTrees', min: 0, max: 500, step: 1, change: render },
      { type: 'slider', key: 'numPlanes', min: 0, max: 100, step: 1, change: render },
      { type: 'slider', key: 'numZombie', min: 0, max: 100, step: 1, change: render },
    ]);
    const {
        numWindmills,
        numSkeleton_Arrow,
        numSkeleton_Warrior,
        numTrees,
        numPlanes,
        numZombie
    } = settings;  // Acessa os valores diretamente de settings

    // Aqui você pode usar os valores para gerar o novo cenário
    console.log('Novo cenário gerado com os seguintes valores:');
    console.log('Num Windmills:', numWindmills);
    console.log('Num Skeleton Arrow:', numSkeleton_Arrow);
    console.log('Num Skeleton Warrior:', numSkeleton_Warrior);
    console.log('Num Trees:', numTrees);
    console.log('Num Planes:', numPlanes);
    console.log('Num Zombie:', numZombie);


    // Configurações dos WindMills
    const windmillsTransforms = generateUniquePositions(numWindmills, { x: 20, z: 20 }, 20);
    const windmillsHref = 'assets/windmill.obj';
    console.log("Configurações dos WindMills:", windmillsTransforms);

    // Configurações dos Skeleton_Arrow
    const Skeleton_ArrowTransforms = generateUniquePositions(numSkeleton_Arrow, { x: 20, z: 20 }, 2);
    const Skeleton_ArrowHref = 'assets/Skeleton_Arrow.obj';

    // Configurações dos Skeleton_Warrior
    const Skeleton_WarriorTransforms = generateUniquePositions(numSkeleton_Warrior, { x: 20, z: 20 },2);
    const Skeleton_WarriorHref = 'assets/Skeleton_Warrior.obj';

    // Configurações dos Trees
    const TreesTransforms = generateUniquePositions(numTrees, { x: 20, z: 20 }, 50);
    const TreesHref = 'assets/tree08.obj';

    // Configurações dos Planes
    const planesTransforms = generateUniquePositions(numPlanes, { x: 20, z: 20 }, 50);
    const planesHref = 'assets/MountainRocks-0.obj';

    // Configurações dos Zombies
    const zombieTransforms = generateUniquePositions(numZombie, { x: 20, z: 20 }, 30);
    const zombieHref = 'assets/Zed_1.obj';

    
    // Carregando modelos 3D no formato OBJ e criando os objetos necessários para renderizá-los usando TWGL (Tiny WebGL)
    const windmillsParts = await loadObj(gl, baseHref, textureProgramInfo, windmillsHref);
    const Skeleton_ArrowParts = await loadObj(gl, baseHref, textureProgramInfo, Skeleton_ArrowHref);
    const Skeleton_WarriorParts = await loadObj(gl, baseHref, textureProgramInfo, Skeleton_WarriorHref);
    const TreesParts = await loadObj(gl, baseHref, textureProgramInfo, TreesHref);
    const planesParts = await loadObj(gl, baseHref, textureProgramInfo, planesHref);
    const zombieParts = await loadObj(gl, baseHref, textureProgramInfo, zombieHref);
   
    const fieldOfViewRadians = degToRad(60);

    // Uniforms for each object.
    const planeUniforms = {
      u_colorMult: [1, 1, 1, 1],  // lightblue
      u_color: [1, 0, 0, 1],
      u_texture: imageboardTexture,
      u_world: m4.translation(0, 0, 0),
    };
    const sphereUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],  // pink
      u_color: [0, 0, 1, 1],
      u_texture: checkerboardTexture,
      u_world: m4.translation(2, 0, 0),
    };
    const cubeUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],  // lightgreen
      u_color: [0, 0, 1, 1],
      u_texture: checkerboardTexture,
      u_world: m4.translation(3, 1, 0),
    };

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

      // ------ Draw the sphere --------

      // Setup all the needed attributes.
      gl.bindVertexArray(sphereVAO);

      // Set the uniforms unique to the sphere
      twgl.setUniforms(programInfo, sphereUniforms);

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, sphereBufferInfo);

      // ------ Draw the cube --------

      // Setup all the needed attributes.
      gl.bindVertexArray(cubeVAO);

      // Set the uniforms unique to the cube
      twgl.setUniforms(programInfo, cubeUniforms);

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, cubeBufferInfo);

      // ------ Draw the windmill --------
      /*
      for (const {bufferInfo, vao, material} of windmillsParts) {
        // set the attributes for this part.
        gl.bindVertexArray(vao);
        // calls gl.uniform
        for (const { x, z } of windmillsTransforms) {
          let u_world = m4.translate(m4.identity(), x, 0, z);
          u_world = m4.scale(u_world, 1, 1, 1); // Ajuste a escala se necessário

          twgl.setUniforms(programInfo, { u_world }, material);
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      */
       // ------ Draw the ArrowParts --------
       for (const {bufferInfo, vao, material} of windmillsParts) {
        // set the attributes for this part.
        gl.bindVertexArray(vao);
        // calls gl.uniform
        for (const { x, z } of windmillsTransforms) {
          twgl.setUniforms(programInfo, {
            u_world: m4.translation(x, 0, z),
          }, material);
          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      // ------ Draw the ArrowParts --------
      for (const {bufferInfo, vao, material} of Skeleton_ArrowParts) {
        // set the attributes for this part.
        gl.bindVertexArray(vao);
        // calls gl.uniform
        for (const { x, z } of Skeleton_ArrowTransforms) {
          twgl.setUniforms(programInfo, {
            u_world: m4.translation(x, 0, z),
          }, material);
          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      
      // ------ Draw the plane --------

      // Setup all the needed attributes.
      gl.bindVertexArray(planeVAO);

      // Set the uniforms unique to the cube
      twgl.setUniforms(programInfo, planeUniforms);

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, planeBufferInfo);
    }
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
      
      // Aplica a escala ao cubo
      const scaledMat = m4.scale(mat, 200, 50, 200);

      // Set the uniforms we just computed
      twgl.setUniforms(colorProgramInfo, {
        u_color: [1, 1, 1, 1],
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_world: scaledMat,
      });

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
      
    }
    drawDebugMarkers();
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

