'use strict'

var GL = require('../../gl.js')
var Quad = require('../../objects/fullscreen-quad')

module.exports = function(options) {  
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var shaderProgram
  var attrPos
  var attrUV
  var windowSize
  var uImage
  var quad = Quad.get()

  var tex = GL.makeTexture(options.gridWidth, options.gridDepth)

  this.tex = tex.tex
  this.fbo = tex.fbo
  this.rbo = tex.rbo

  this.set = function(amount) {
    var frag_shader = blur_fragment_shader_src.replace(/1337/g, parseInt(amount))

    shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, GL.getShader(fullscreen_quad_vertex_shader_src, gl.VERTEX_SHADER))
    gl.attachShader(shaderProgram, GL.getShader(frag_shader, gl.FRAGMENT_SHADER))

    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not link program!");
    }

    attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
    attrUV = gl.getAttribLocation(shaderProgram, "vs_uv")
    uImage = gl.getUniformLocation(shaderProgram, "u_image")
    windowSize = gl.getUniformLocation(shaderProgram, "windowSize")
  } 

  this.draw = function(in_tex) {
    gl.useProgram(shaderProgram)

    gl.uniform2f(windowSize, options.gridWidth, options.gridDepth)

    gl.uniform1i(uImage, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, in_tex)

    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.positions)
    gl.enableVertexAttribArray(attrPos)
    gl.vertexAttribPointer(attrPos, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(attrPos, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.uvs)
    gl.enableVertexAttribArray(attrUV)
    gl.vertexAttribPointer(attrUV, 2, gl.FLOAT, true, 0, 0)
    ext.vertexAttribDivisorANGLE(attrUV, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.indices)

    gl.drawElements(quad.drawMode, quad.count, gl.UNSIGNED_SHORT, 0)

    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.disableVertexAttribArray(attrPos)
    gl.disableVertexAttribArray(attrUV)
  }
}