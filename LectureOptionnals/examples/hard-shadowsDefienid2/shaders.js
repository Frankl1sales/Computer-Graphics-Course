'use strict';

const vs = `#version 300 es
/*
Passagem por Valor: Se o valor do parâmetro 
for alterado na função, o parâmetro original da 
chamada da função permanece inalterado.
*/
in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

/*
The variable is assigned a value from the 
JavaScript code before a 
gl.drawArrays() call is made.

Essas variáveis são globais e têm um valor 
constante durante a execução de um shader para 
um determinado primitivo gráfico.
*/
uniform mat4 u_projection; 
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;
uniform vec3 u_viewWorldPosition;

//Passagem por referência para a mesma var
out vec2 v_texcoord;
out vec4 v_projectedTexcoord;
out vec3 v_normal;
out vec3 v_surfaceToView;

void main() {
    // Calcula a posição no mundo
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;

    // Passa as coordenadas de textura para o fragment shader
    v_texcoord = a_texcoord;

    // Calcula as coordenadas projetadas para sombras
    v_projectedTexcoord = u_textureMatrix * worldPosition;

    // Calcula o vetor normal no espaço do mundo
    v_normal = mat3(u_world) * a_normal;

    // Calcula a direção da superfície para a visão
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
}
`;

const fs = `#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec4 v_projectedTexcoord;
in vec3 v_normal;
in vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias;
uniform vec3 u_reverseLightDirection;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

out vec4 outColor;

void main() {
    // Normaliza a normal interpolada
    vec3 normal = normalize(v_normal);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * 0.5 + 0.5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

    vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
    vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb;
    float effectiveOpacity = opacity * diffuseMapColor.a;

    // Calcula a iluminação direcional
    float light = max(dot(normal, u_reverseLightDirection), 0.0);

    // Calcula as coordenadas projetadas
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    float currentDepth = projectedTexcoord.z + u_bias;

    // Verifica se a posição projetada está dentro do intervalo
    bool inRange = projectedTexcoord.x >= 0.0 && projectedTexcoord.x <= 1.0 &&
                   projectedTexcoord.y >= 0.0 && projectedTexcoord.y <= 1.0;

    // Obtém a profundidade projetada
    float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
    float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

    // Calcula a cor da textura e aplica as multiplicações de cor e iluminação
    vec4 texColor = texture(u_texture, v_texcoord) * u_colorMult;
    
    // Ajuste para a cor final (combina cor difusa, emissiva, iluminação, etc.)
    vec3 color = emissive +
                 ambient * u_ambientLight +
                 effectiveDiffuse * fakeLight +
                 specular * pow(specularLight, shininess);
    
    // Define a cor de saída com opacidade e iluminação
    outColor = vec4(color * texColor.rgb * light * shadowLight, texColor.a * effectiveOpacity);
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