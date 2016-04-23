//#gljs varname: 'texture_fragment_shader_src' 

precision highp float;
uniform sampler2D u_image;
varying vec4 fs_nor;
varying vec2 fs_uv;
varying vec4 lightVec;
uniform bool textureBound;

void main(void) {
  float diffuseTerm = dot(normalize(fs_nor), normalize(lightVec));
  if (diffuseTerm < 0.0) {
    diffuseTerm = diffuseTerm * -0.3;
  }
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
  float ambientTerm = 0.2;
  float lightIntensity = diffuseTerm + ambientTerm;
  vec4 col = texture2D(u_image, fs_uv);
  // gl_FragColor = vec4(col.rgb * lightIntensity, col.a);
  // gl_FragColor = vec4(1,1,1,1);
  gl_FragColor = vec4(col.rgb * lightIntensity, 1);
  if (!textureBound) {
    gl_FragColor = vec4(0.8,0.8,0.8,1);
  }
  // gl_FragColor = vec4(fs_uv, 0,1);
}