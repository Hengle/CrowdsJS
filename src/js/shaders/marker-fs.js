'use strict'

var src = '\
precision highp float;\
varying vec4 fs_col;\
void main(void) {\
  gl_FragColor = fs_col;\
}\
'

var type = 'FRAG'

module.exports = {
  src: src,
  type: type
}