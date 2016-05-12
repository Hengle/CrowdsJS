'use strict'

var GL = require('../../gl')
var Quad = require('../../objects/fullscreen-quad')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")


  var sprog = gl.createProgram()
  gl.attachShader(sprog, GL.getShader(reachability_init_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(sprog, GL.getShader(reachability_init_fragment_shader_src, gl.FRAGMENT_SHADER))
  gl.linkProgram(sprog)
  if (!gl.getProgramParameter(sprog, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }
  var initialAttrPos = gl.getAttribLocation(sprog, 'vs_pos')


  var quad = Quad.get()

  var longestDist = 2*Math.max(options.sizeX, options.sizeZ)

  var frag_shader = reachability_fragment_shader_src.replace(/1337/g, longestDist)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(fullscreen_quad_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(frag_shader, gl.FRAGMENT_SHADER))

  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  var attrPos = gl.getAttribLocation(shaderProgram, 'vs_pos')
  var attrUV = gl.getAttribLocation(shaderProgram, 'vs_uv')
  var u_back = gl.getUniformLocation(shaderProgram, 'back')
  var u_data = gl.getUniformLocation(shaderProgram, 'data')
  var u_obstacle = gl.getUniformLocation(shaderProgram, 'obstacles')
  var windowSize = gl.getUniformLocation(shaderProgram, "windowSize")

  var front = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, front)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, options.gridWidth, options.gridDepth, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

  var back = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, back)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, options.gridWidth, options.gridDepth, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

  var step = gl.createFramebuffer()

  var bufferDirty
  var buffer = new Uint8Array(options.gridWidth*options.gridDepth*4)

  this.tex = front

  this.clear = function() {
    gl.clearColor(1,1,1,1)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
  }

  var initialDraw = function(agentData) {
    gl.useProgram(sprog)
    gl.bindBuffer(gl.ARRAY_BUFFER, agentData.buffer_pos)
    gl.enableVertexAttribArray(initialAttrPos)
    gl.vertexAttribPointer(initialAttrPos, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(initialAttrPos, 0)

    gl.drawArrays(gl.POINTS, 0, agentData.count) 

    gl.disableVertexAttribArray(attrPos)
  }

  this.iterDraw = function() {
    gl.useProgram(shaderProgram)
    gl.clear(gl.DEPTH_BUFFER_BIT)
    
    gl.bindTexture(gl.TEXTURE_2D, back)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, front, 0)

    gl.drawElements(quad.drawMode, quad.count, gl.UNSIGNED_SHORT, 0)
    
    this.tex = front

    var tmp = front
    front = back
    back = tmp
  }

  this.draw = function(agentData, obstacles) {
    bufferDirty = true

    gl.bindFramebuffer(gl.FRAMEBUFFER, step)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, back, 0)
    this.clear()
    gl.clear(gl.DEPTH_BUFFER_BIT)
    initialDraw(agentData)

    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.useProgram(shaderProgram)
    
    gl.uniform2f(windowSize, options.gridWidth, options.gridDepth)

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.positions)
    gl.enableVertexAttribArray(attrPos)
    gl.vertexAttribPointer(attrPos, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(attrPos, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.uvs)
    gl.enableVertexAttribArray(attrUV)
    gl.vertexAttribPointer(attrUV, 2, gl.FLOAT, true, 0, 0)
    ext.vertexAttribDivisorANGLE(attrUV, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.indices)

    gl.uniform1i(u_obstacle, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, obstacles)

    gl.uniform1i(u_back, 1)
    gl.activeTexture(gl.TEXTURE1)

    for (var i = 0; i < Math.max(options.gridDepth, options.gridWidth); i++) {
      this.iterDraw()
    }

    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.disableVertexAttribArray(attrPos)
    gl.disableVertexAttribArray(attrUV)
  }

  this.getValueAt = function(u, v) {
    if (bufferDirty) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, step)
      gl.readPixels(0,0,options.gridWidth,options.gridDepth, gl.RGBA, gl.UNSIGNED_BYTE, buffer)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      bufferDirty = false;
    }

    var idx = parseInt(u*options.gridWidth) + options.gridWidth*parseInt(v*options.gridDepth)

    return buffer[4*idx] / 255;
  }
}