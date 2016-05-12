//#gljs varname: 'velocity_fragment_shader_src' 

precision highp float;
uniform sampler2D u_image0; 
uniform sampler2D u_image1;
uniform sampler2D u_weights; 
uniform float numAgents;
uniform vec2 windowSize;
uniform float u_gScale;

varying vec2 fs_uv;

const int R = 1337;
const int RES = 10;

int toID(vec4 col) {
  return int(col.r*float(RES)+0.5) + int(col.g*float(RES)+0.5)*RES + int(col.b*float(RES)+0.5)*RES*RES;
}

void main(void) {
  vec4 col = texture2D(u_image0, fs_uv);
  int id = toID(col);
  vec4 data = texture2D(u_image1, vec2(float(id)/(numAgents-0.5), 0.0));
  vec3 pos = vec3(data.xy, 0);
  vec3 gol = vec3(data.zw, 0);
  vec3 golVec = gol - pos;

  if (length(golVec.xy * windowSize) <= float(R)) {
    gl_FragColor = vec4(normalize(golVec) / u_gScale / float(R) * 0.3 + vec3(0.5,0.5,0), 1);
    return;
  }

  float totalWeight = 0.0;
  for (int i = -R; i < R; i++) {
    for (int j = -R; j < R; j++) {
      vec2 uv = fs_uv + vec2(i, j) / windowSize;
      col = texture2D(u_image0, uv);
      vec4 wt = texture2D(u_weights, uv);

      vec3 markerVec = (vec3(uv,0) - pos) * vec3(windowSize[0], windowSize[1], 1) * u_gScale; 
      if (
        id == toID(col) && 
        // i != 0 && 
        // j != 0 &&
        length(markerVec) <= float(R)
        // length(markerVec) >= 0.25
        ) {
        // 
        // float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));
        float weight = min(1.0,wt[0]);
        totalWeight += weight;
      }
    }
  }

  if (totalWeight < 0.01) {
    gl_FragColor = vec4(0.5, 0.5, 0, 1);
    return;
  }

  vec3 cumul = vec3(0,0,0);
  for (int i = -R; i < R; i++) {
    for (int j = -R; j < R; j++) {
      vec2 uv = fs_uv + vec2(i, j) / windowSize;
      col = texture2D(u_image0, uv);
      vec4 wt = texture2D(u_weights, uv);

      vec3 markerVec = (vec3(uv,0) - pos) * vec3(windowSize[0], windowSize[1], 1)  * u_gScale; /// float(R);  
      if (
        id == toID(col) && 
        // i != 0 && 
        // j != 0 && 
        length(markerVec) <= float(R)
        // length(markerVec) >= 0.25
        ) {
        // float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));
        float weight = min(1.0,wt[0]);
        weight = weight / totalWeight / float(R) / u_gScale;
        cumul += markerVec * weight;
      }
    }
  }
  gl_FragColor = vec4(cumul*0.5 + vec3(0.5,0.5,0), 1);
  return;

}