//#gljs varname: 'velocity_vertex_shader_src' 

attribute vec4 vs_pos;
attribute vec2 vs_uv;
varying vec2 fs_uv;

void main(void) {
  gl_Position = vs_pos;
  gl_PointSize = 3.0;
  fs_uv = vs_uv;
}