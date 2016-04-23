//#gljs varname: 'voronoi_fragment_shader_src' 

precision highp float;
varying vec4 fs_col;
void main(void) {
  gl_FragColor = fs_col;
}