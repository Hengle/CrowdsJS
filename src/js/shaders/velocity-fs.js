'use strict'

var src = '\
precision highp float;\
uniform sampler2D u_image0; \
uniform sampler2D u_image1; \
uniform sampler2D u_weights; \
uniform float u_R;\
uniform float numAgents;\
uniform vec2 windowSize;\
uniform vec2 u_gridSize;\
uniform int drawMode;\
varying vec2 fs_uv;\
const int R = 30;\
\
int toID(vec4 col) {\
  int RES = 10;\
  return int(col.r*float(RES)+0.5) + int(col.g*float(RES)+0.5)*RES + int(col.b*float(RES)+0.5)*RES*RES;\
}\
\
void main(void) {\
  vec4 col = texture2D(u_image0, fs_uv);\
  int id = toID(col);\
  vec4 data = texture2D(u_image1, vec2(float(id)/(numAgents-0.5), 0.0));\
  vec3 pos = vec3(data.xy, 0);\
  vec3 gol = vec3(data.zw, 0);\
  vec3 golVec = gol - pos;\
\
\
  if (drawMode == 3) {\
    vec3 cumul = vec3(0,0,0);\
    float totalWeight = 0.0;\
    for (int i = -R; i < R; i++) {\
      for (int j = -R; j < R; j++) {\
        vec2 uv = fs_uv + vec2(i, j) / windowSize;\
        col = texture2D(u_image0, uv);\
        if (id == toID(col)) {\
          vec3 marker = 2.0*vec3(uv, 0) - vec3(1,1,0);\
          vec3 markerVec = vec3(uv, 0) - pos;\
          float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));\
          bool mask = length(markerVec) < float(R);\
          weight = float(mask) * weight;\
          totalWeight += weight;\
        }\
      }\
    }\
    for (int i = -R; i < R; i++) {\
      for (int j = -R; j < R; j++) {\
        vec2 uv = fs_uv + vec2(i, j) / windowSize;\
        col = texture2D(u_image0, uv);\
        if (id == toID(col)) {\
          vec3 marker = 2.0*vec3(uv, 0) - vec3(1,1,0);\
          vec3 markerVec = vec3(uv, 0) - pos;\
          float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));\
          bool mask = length(markerVec) < float(R);\
          weight = float(mask) * weight / totalWeight;\
          cumul += markerVec*weight;\
        }\
      }\
    }\
    gl_FragColor = vec4(normalize(cumul)*0.5 + vec3(0.5,0.5,0), 1);\
    gl_FragColor = vec4(cumul, 1);\
    return;\
  }\
\
\
  \
  vec3 marker = 2.0*vec3(fs_uv, 0) - vec3(1,1,0);\
  vec3 markerVec = marker - pos;\
  golVec = gol - pos;\
  float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));\
  bool mask = length(markerVec) < 0.2;\
  weight = float(mask) * weight;\
\
  if (drawMode == 0) {\
    gl_FragColor = vec4(weight,weight,weight,1);\
    return;\
  } else if (drawMode == 1) {\
    gl_FragColor = vec4(float(mask) * abs(normalize(golVec)), 1);\
    return;\
  } else if (drawMode == 2) {\
    gl_FragColor = vec4(float(mask) * abs(normalize(markerVec)), 1);\
  }\
}'

var type = 'FRAG'

module.exports = {
  src: src,
  type: type
}

/*

  \
  for (int i = -R; i < R; i++) {\
    for (int j = -R; j < R; j++) {\
      vec2 uv = fs_uv + vec2(i, j) / windowSize;\
      col = texture2D(u_image0, uv);\
      if (id != toID(col)) {\
        gl_FragColor = vec4(0,0,0,1);\
      }\
    }\
  }\

  vec4 curCol = texture2D(u_image0, fs_uv);\
  int id = toID(curCol);\
\
  int border = 0;\
  vec4 col = vec4(0,0,0,0);\
  for (int i = -2; i < 2; i++) {\
    for (int j = -2; j < 2; j++) {\
      vec2 uv = fs_uv + vec2(i, j) / windowSize;\
      col = texture2D(u_image0, uv);\
      if (id != toID(col)) {\
        border = 1;\
        gl_FragColor = vec4(1,1,1,1);\
        return;\
      }\
    }\
  }\

  float totalWeight = 0.0;\
  for (int i = -R; i < R; i++) {\
    for (int j = -R; j < R; j++) {\
      vec2 uv = fs_uv + vec2(i, j) / windowSize;\
      col = texture2D(u_image0, uv);\
      if (id == toID(col)) {\
        vec3 marker = vec3(uv, 0);\
        vec3 markerVec = marker - pos;\
        bool mask = length(markerVec) <= float(R);\
        vec3 golVec = gol - pos;\
        float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));\
        totalWeight += float(mask) * weight;\
      }\
    }\
  }\
  for (int i = -R; i < R; i++) {\
    for (int j = -R; j < R; j++) {\
      vec2 uv = fs_uv + vec2(i, j) / windowSize;\
      col = texture2D(u_image0, uv);\
      if (id == toID(col)) {\
        vec3 marker = vec3(uv, 0);\
        vec3 markerVec = marker - pos;\
        bool mask = length(markerVec) <= float(R);\
        vec3 golVec = gol - pos;\
        float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));\
        weight = float(mask) * weight / totalWeight;\
        gl_FragColor = vec4(weight, weight, weight, 1);\
      }\
    }\
  }\

  */