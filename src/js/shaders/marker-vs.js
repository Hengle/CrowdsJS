'use strict'

var src ='\
attribute vec4 vs_pos;\
attribute vec4 vs_col;\
varying vec4 fs_col;\
uniform mat4 u_ViewProj;\
void main(void) {\
  gl_Position = u_ViewProj * vs_pos;\
  gl_PointSize = 2.0;\
  fs_col = vs_col;\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}