'use strict'

var src = '\
attribute vec4 vs_pos;\
attribute vec3 vs_offset;\
attribute vec3 vs_velocity;\
attribute vec3 vs_id;\
varying vec4 fs_col;\
uniform mat4 u_ViewProj;\
void main(void) {\
  fs_col = vec4(vs_id, 1);\
  vec3 pos = vec3(vs_pos.x, 0, vs_pos.z);\
  float fac = 2.0 + dot(normalize(pos), normalize(vs_velocity));\
  fac = fac / 3.0;\
  pos = vec3(vs_pos);\
  gl_Position = u_ViewProj * (vec4(pos,1) + vec4(vs_offset, 0));\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}