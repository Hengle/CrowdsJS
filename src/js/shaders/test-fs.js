'use strict'

var src = '\
precision highp float;\
uniform sampler2D u_image0; \
varying vec2 fs_uv;\
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