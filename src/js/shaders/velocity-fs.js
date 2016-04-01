'use strict'

var src = '\
void main(void) {\
  gl_FragColor = vec4(1,1,1,1);\
}\
'

var type = 'FRAG'

module.exports = {
  src: src,
  type: type
}