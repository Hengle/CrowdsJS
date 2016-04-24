'use strict'

var GL = require('../gl.js')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var shrinkAmnt = parseInt(Math.ceil(0.5 / options.gridSize / 2))
  var frag_shader = voronoi_refine_fragment_shader_src.replace(/1337/g, shrinkAmnt)

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(voronoi_refine_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(frag_shader, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  shaderProgram.attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  shaderProgram.attrUv = gl.getAttribLocation(shaderProgram, "vs_uv")
  shaderProgram.uImage = gl.getUniformLocation(shaderProgram, "u_image")
  shaderProgram.windowSize = gl.getUniformLocation(shaderProgram, "windowSize")
  shaderProgram.gridScale = gl.getUniformLocation(shaderProgram, "u_gScale")

  var positions = [
  -1,-1,0,1,
  1,-1,0,1,
  -1,1,0,1,
  1,1,0,1
  ]

  var uvs = [
    0,0,
    1,0,
    0,1,
    1,1
  ]

  var indices = [0,1,2,1,2,3]

  positions = new Float32Array(positions)
  uvs = new Float32Array(uvs)
  indices = new Uint16Array(indices)

  var v_pos = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

  var v_uv = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW)

  var idx = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  var refined_tex = GL.makeTexture(options.gridWidth, options.gridDepth)

  this.tex = refined_tex.tex
  this.fbo = refined_tex.fbo
  this.rbo = refined_tex.rbo

  this.draw = function(voronoi_tex) {
    gl.useProgram(shaderProgram)

    gl.uniform2f(shaderProgram.windowSize, options.gridWidth, options.gridDepth)
    gl.uniform1f(shaderProgram.gridScale, options.gridSize)

    gl.uniform1i(shaderProgram.unifImage, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, voronoi_tex)

    // gl.bindFramebuffer(gl.FRAMEBUFFER, refined_tex.fbo)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.enableVertexAttribArray(shaderProgram.attrPos);
    gl.vertexAttribPointer(shaderProgram.attrPos, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(shaderProgram.attrPos, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.enableVertexAttribArray(shaderProgram.attrUv);
    gl.vertexAttribPointer(shaderProgram.attrUv, 2, gl.FLOAT, true, 0, 0);
    ext.vertexAttribDivisorANGLE(shaderProgram.attrUv, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    
    gl.bindTexture(gl.TEXTURE_2D, null)
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}