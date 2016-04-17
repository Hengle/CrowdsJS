'use strict'

var src = '\
attribute vec4 vs_pos;\
attribute vec2 vs_uv;\
attribute vec4 vs_col;\
varying vec2 fs_uv;\
varying vec4 fs_col;\
void main(void) {\
  gl_Position = vs_pos;\
  fs_uv = vs_uv;\
  fs_col = vs_col;\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}