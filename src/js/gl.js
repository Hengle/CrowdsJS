'use strict'

var GL

module.exports =  {
  set: function(gl) {
    GL = gl
  },

  get: function() {
    return GL
  }
}