'use strict'

var src = '\
attribute vec4 vs_pos;\
uniform mat4 u_ViewProj;\
void main(void) {\
  gl_Position = u_ViewProj * vs_pos;\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}