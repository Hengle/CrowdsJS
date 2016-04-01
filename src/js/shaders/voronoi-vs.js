'use strict'

var src = '\
attribute vec4 vs_pos;\
attribute vec3 vs_offset;\
attribute vec3 vs_id;\
varying vec4 fs_col;\
uniform mat4 u_ViewProj;\
void main(void) {\
  fs_col = vec4(vs_id, 1);\
  gl_Position = u_ViewProj * (vs_pos + vec4(vs_offset, 0));\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}