//#gljs varname: 'velocity_fragment_shader_src' 

precision highp float;
uniform sampler2D u_image0; 
uniform sampler2D u_image1;
uniform sampler2D u_comfortMap; 
uniform bool u_useComfortMap;
uniform sampler2D u_weights; 
uniform float u_R;
uniform float numAgents;
uniform vec2 windowSize;
uniform vec2 u_gridSize;
uniform int drawMode;
uniform float u_gScale;
varying vec2 fs_uv;
const int R = 1337;

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

int toID(vec4 col) {
  int RES = 10;
  return int(col.r*float(RES)+0.5) + int(col.g*float(RES)+0.5)*RES + int(col.b*float(RES)+0.5)*RES*RES;
}

void main(void) {
  vec4 col = texture2D(u_image0, fs_uv);
  int id = toID(col);
  vec4 data = texture2D(u_image1, vec2(float(id)/(numAgents-0.5), 0.0));
  vec3 pos = vec3(data.xy, 0);
  vec3 gol = vec3(data.zw, 0);
  vec3 golVec = gol - pos;

  if (drawMode == 3) {
    if (length(golVec.xy * windowSize) <= float(R)) {
      gl_FragColor = vec4(normalize(golVec) / u_gScale / float(R) * 0.5 + vec3(0.5,0.5,0), 1);
      return;
    }

    float totalWeight = 0.0;
    for (int i = -R; i < R; i++) {
      for (int j = -R; j < R; j++) {
        vec2 uv = fs_uv + vec2(i, j) / windowSize;
        col = texture2D(u_image0, uv);
        vec4 wt = texture2D(u_weights, uv);
        wt *= (
          (1.0 - float(u_useComfortMap)) + 
          float(u_useComfortMap)*texture2D(u_comfortMap, uv).x
        );

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
        wt *= (
          (1.0 - float(u_useComfortMap)) + 
          float(u_useComfortMap)*texture2D(u_comfortMap, uv).x
        );

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
        // }
      }
    }
    gl_FragColor = vec4(cumul*0.5 + vec3(0.5,0.5,0), 1);
    return;
  }
  
  vec3 marker = 2.0*vec3(fs_uv, 0) - vec3(1,1,0);
  vec3 markerVec = vec3(fs_uv, 0) - pos;
  golVec = gol - pos;
  float weight = 1.0 + dot(normalize(markerVec), normalize(golVec));
  // weight = weight * snoise(50.0*fs_uv);
  weight *= (
    (1.0 - float(u_useComfortMap)) + 
    float(u_useComfortMap)*texture2D(u_comfortMap, fs_uv).x
  );
  bool mask = length(markerVec) < float(R) / windowSize.x;
  weight = float(mask) * weight;

  if (drawMode == 0) {
    gl_FragColor = vec4(weight,weight,weight,1);
  } else if (drawMode == 1) {
    gl_FragColor = vec4(float(mask) * abs(normalize(golVec)), 1);
  } else if (drawMode == 2) {
    gl_FragColor = vec4(float(mask) * abs(normalize(markerVec)), 1);
  }

  if (distance(fs_uv, vec2(0.5,0.5)) < float(R) / windowSize.x) {
    // gl_FragColor = vec4(0,1,0,1);
  }
}