'use strict'

var src = '\
attribute vec4 vs_pos;\
attribute vec4 vs_col;\
attribute vec4 vs_nor;\
varying vec4 fs_col;\
varying vec4 fs_nor;\
uniform mat4 u_Model;\
uniform mat4 u_ViewProj;\
uniform mat4 u_InvTrans;\
uniform vec4 u_Color;\
varying vec4 lightVec;\
const vec4 lightPos = vec4(20, 50, 30, 1);\
void main(void) {\
  vec4 modelposition = u_Model * vs_pos;\
  gl_Position = u_ViewProj * modelposition;\
  fs_col = u_Color;\
  fs_nor = u_InvTrans * vs_nor;\
  lightVec = lightPos - modelposition;\
}\
'

var type = 'VERT'

module.exports = {
  src: src,
  type: type
}