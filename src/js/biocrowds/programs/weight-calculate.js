'use strict'

var GL = require('../../gl.js')
var Quad = require('../../objects/fullscreen-quad')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var searchRad = parseInt(options.searchRadius / options.gridSize)
  var frag_shader = weight_fragment_shader_src.replace(/1337/g, searchRad)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(fullscreen_quad_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(frag_shader, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  var attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  var attrUV = gl.getAttribLocation(shaderProgram, "vs_uv")
  var unifImage0 = gl.getUniformLocation(shaderProgram, "u_image0")
  var unifImage1 = gl.getUniformLocation(shaderProgram, "u_image1")
  var unifComfortMap = gl.getUniformLocation(shaderProgram, "u_comfortMap")
  var unifComfortMapEnabled = gl.getUniformLocation(shaderProgram, "u_useComfortMap")
  var windowSize = gl.getUniformLocation(shaderProgram, "windowSize")
  var numAgents = gl.getUniformLocation(shaderProgram, "numAgents")

  var weight_tex = GL.makeTexture(options.gridWidth, options.gridDepth)
  this.tex = weight_tex.tex
  this.fbo = weight_tex.fbo

  var comfortMap
  var agents
  this.init = function(theAgents, cMap) {
    agents = theAgents
    gl.useProgram(shaderProgram)
    if (cMap) {
      gl.uniform1f(unifComfortMapEnabled, true)
      gl.uniform1i(unifComfortMap, 2)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, comfortMap)
      comfortMap = cMap
    } else {
      gl.uniform1f(unifComfortMapEnabled, false)
    }
  }

  var quad = Quad.get()
  this.draw = function(voronoi_tex, agent_tex) {
    gl.useProgram(shaderProgram)

    gl.uniform1f(numAgents, agents.length)
    gl.uniform2f(windowSize, options.gridWidth, options.gridDepth)
    gl.uniform1i(unifImage0, 0)
    gl.uniform1i(unifImage1, 1)
    gl.uniform1i(unifComfortMap, 2)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, voronoi_tex)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, agent_tex)

    if (comfortMap) {
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, comfortMap)
    }

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