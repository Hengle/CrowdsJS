'use strict'

var GL = require('../../gl')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var searchRad = parseInt(options.searchRadius / options.gridSize)
  var frag_shader = velocity_fragment_shader_src.replace(/1337/g, searchRad)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(velocity_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(frag_shader, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  gl.useProgram(shaderProgram)
  shaderProgram.attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  shaderProgram.attrUv = gl.getAttribLocation(shaderProgram, "vs_uv")
  shaderProgram.unifImage0 = gl.getUniformLocation(shaderProgram, "u_image0")
  shaderProgram.unifImage1 = gl.getUniformLocation(shaderProgram, "u_image1")
  shaderProgram.unifWeightsTex = gl.getUniformLocation(shaderProgram, "u_weights")
  shaderProgram.windowSize = gl.getUniformLocation(shaderProgram, "windowSize")
  shaderProgram.numAgents = gl.getUniformLocation(shaderProgram, "numAgents")
  shaderProgram.gridScale = gl.getUniformLocation(shaderProgram, "u_gScale")

  var velocity_tex = GL.makeTexture(options.gridWidth, options.gridDepth)

  this.tex = velocity_tex.tex

  var proj;
  var velocityBufferDirty;
  var velocityBuffer = new Uint8Array(options.gridWidth*options.gridDepth*4);

  this.init = function(projector) {
    proj = projector
  }
  
  this.draw = function(voronoi_tex, weight_tex, agentData, count) {
    gl.useProgram(shaderProgram)
  
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity_tex.fbo)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.uniform1f(shaderProgram.numAgents, count)
    gl.uniform2f(shaderProgram.windowSize, options.gridWidth, options.gridDepth)
    gl.uniform1f(shaderProgram.gridScale, options.gridSize)

    gl.uniform1i(shaderProgram.unifImage0, 0)
    gl.uniform1i(shaderProgram.unifImage1, 1)
    gl.uniform1i(shaderProgram.unifWeightsTex, 2)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, voronoi_tex)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, agentData.tex)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, weight_tex)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, agentData.buffer_pos)
    gl.enableVertexAttribArray(shaderProgram.attrPos)
    gl.vertexAttribPointer(shaderProgram.attrPos, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(shaderProgram.attrPos, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, agentData.buffer_uv)
    gl.enableVertexAttribArray(shaderProgram.attrUv)
    gl.vertexAttribPointer(shaderProgram.attrUv, 2, gl.FLOAT, true, 0, 0)
    ext.vertexAttribDivisorANGLE(shaderProgram.attrUv, 0)

    gl.drawArrays(gl.POINTS, 0, count) 

    velocityBufferDirty = true
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(450, 0, 150, 150)
    gl.drawArrays(gl.POINTS, 0, count) 
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.disableVertexAttribArray(shaderProgram.attrPos)
    gl.disableVertexAttribArray(shaderProgram.attrUv)

  }

  this.getVelocityAt = function(u, v) {
    if (velocityBufferDirty) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity_tex.fbo)
      gl.readPixels(0,0,options.gridWidth,options.gridDepth, gl.RGBA, gl.UNSIGNED_BYTE, velocityBuffer)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      velocityBufferDirty = false
    }
    var idx = parseInt(u*options.gridWidth) + options.gridWidth*parseInt(v*options.gridDepth)
    // console.log(velocityBuffer[4*idx], velocityBuffer[4*idx+1], velocityBuffer[4*idx+2], velocityBuffer[4*idx+3])
    var projected = vec4.fromValues(
      velocityBuffer[4*idx] / 256 * 2 - 1, 
      velocityBuffer[4*idx+1] / 256 * 2 - 1, 
      0, 0)
    projected[0] *= options.searchRadius*options.searchRadius
    projected[1] *= options.searchRadius*options.searchRadius
    var len = Math.min(options.searchRadius, vec4.length(projected))
    // len *= 2
    // console.log(projected)
    // console.log(len)
  
    vec4.transformMat4(projected, projected, proj.invviewproj)
    // projected[0] /= options.gridWidth
    // projected[2] /= options.gridDepth
    projected[1] = 0
    // vec3.scale(projected, projected, 1/options.gridSize)
    vec3.normalize(projected, projected)
    vec3.scale(projected, projected, len)
    // console.log(len)
    // console.log(projected)
    return projected
  }

}