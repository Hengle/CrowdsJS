'use strict'

var src = '\
attribute vec4 vs_pos;\
attribute vec4 vs_col;\
varying vec4 fs_col;\
void main(void) {\
  fs_col = vs_col;\
  gl_Position = vs_pos;\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}