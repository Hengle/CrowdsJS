//#gljs varname: 'lambert_fragment_shader_src'

precision highp float;
varying vec4 fs_col;
varying vec4 fs_nor;
varying vec4 lightVec;
void main(void) {
  float diffuseTerm = dot(normalize(fs_nor), normalize(lightVec));
  if (diffuseTerm < 0.0) {
    diffuseTerm = diffuseTerm * -0.3;
  }
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
  float ambientTerm = 0.2;
  float lightIntensity = diffuseTerm + ambientTerm;
  gl_FragColor = vec4(fs_col.rgb * lightIntensity, fs_col.a);
}