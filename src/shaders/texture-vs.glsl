//#gljs varname: 'texture_vertex_shader_src' 

attribute vec4 vs_pos;
attribute vec4 vs_nor;
attribute vec2 vs_uv;

varying vec4 fs_nor;
varying vec2 fs_uv;

uniform mat4 u_Model;
uniform mat4 u_ViewProj;
uniform mat4 u_InvTrans;

varying vec4 lightVec;
const vec4 lightPos = vec4(20, 50, 30, 1);

void main(void) {
  fs_uv = vs_uv;
  vec4 modelposition = u_Model * vs_pos;
  gl_Position = u_ViewProj * modelposition;
  fs_nor = u_InvTrans * vs_nor;
  lightVec = lightPos - modelposition;
}