'use strict'

var GL = require('../gl.js')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(velocity_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(velocity_fragment_shader_src, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  gl.useProgram(shaderProgram)
  shaderProgram.attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  shaderProgram.attrUv = gl.getAttribLocation(shaderProgram, "vs_uv")
  shaderProgram.unifImage0 = gl.getUniformLocation(shaderProgram, "u_image0")
  shaderProgram.unifImage1 = gl.getUniformLocation(shaderProgram, "u_image1")
  shaderProgram.unifComfortMap = gl.getUniformLocation(shaderProgram, "u_comfortMap")
  shaderProgram.unifComfortMapEnabled = gl.getUniformLocation(shaderProgram, "u_useComfortMap")
  shaderProgram.unifWeightsTex = gl.getUniformLocation(shaderProgram, "u_weights")
  shaderProgram.R = gl.getUniformLocation(shaderProgram, "u_R")
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

  gl.getExtension('OES_texture_float')
  gl.getExtension('OES_float_linear')

  var weight_tex = GL.makeTexture(options.gridWidth, options.gridDepth)
  var velocity_tex = GL.makeTexture(options.gridWidth, options.gridDepth)

  this.tex = weight_tex.tex

  this.drawWeights = function() {
    gl.useProgram(shaderProgram)
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "drawMode"), 0)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  this.drawDirections = function() {
    gl.useProgram(shaderProgram)
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "drawMode"), 1)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0) 
  }

  this.drawMarkerVecs = function() {
    gl.useProgram(shaderProgram)
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "drawMode"), 2)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0) 
  }

  var theAgents;
  var theProj;
  var agent_pts;
  var agent_uvs;
  var agent_data;
  var agent_data_tex;
  var proj;
  var velocityBufferDirty;
  var comfortMap;
  var velocityBuffer = new Uint8Array(options.gridWidth*options.gridDepth*4);
  this.draw = function() {
    gl.useProgram(shaderProgram)
    // var buffer = new Uint8Array(options.gridWidth*options.gridDepth*4)

    // gl.viewport(0, 0, options.gridWidth, options.gridDepth)
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, weight_tex.fbo)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    this.drawWeights()
    
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity_tex.fbo)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    
    // gl.activeTexture(gl.TEXTURE2)
    // gl.bindTexture(gl.TEXTURE_2D, weight_tex.tex)

    // gl.bindTexture(gl.TEXTURE_2D, null)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, weight_tex.tex)

    gl.uniform1i(shaderProgram.unifWeightsTex, 2)
    // console.log(agent_uvs)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.bufferData(gl.ARRAY_BUFFER, agent_pts, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.bufferData(gl.ARRAY_BUFFER, agent_uvs, gl.DYNAMIC_DRAW)
    
    // console.log(buffer)
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "drawMode"), 3)
    gl.drawArrays(gl.POINTS, 0, theAgents.length) 

    velocityBufferDirty = true
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW)
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
    var projected = vec4.fromValues(velocityBuffer[4*idx] / 256 * 2 - 1, velocityBuffer[4*idx+1] / 256 * 2 - 1, 0, 0)
    // console.log(projected[0], projected[1])
    // console.log(len)
    vec4.transformMat4(projected, projected, proj.invviewproj)
    projected[1] = 0
    // vec3.normalize(projected, projected)
    // console.log(len)
    // console.log(projected)
    var len = Math.max(vec4.length(projected), 4)
    vec3.normalize(projected, projected)
    vec3.scale(projected, projected, len*options.gridSize*6)
    return projected
  }

  this.init = function(agents, projector, cMap) {
    proj = projector;
    agent_data = new Float32Array(agents.length*4)
    agent_pts = new Float32Array(agents.length*4)
    agent_uvs = new Float32Array(agents.length*2)
    var projected = vec3.create()
    for (var i = 0; i < agents.length; i++) {
      vec3.transformMat4(projected, agents[i].pos, projector.projection)
      agent_data[4*i+0] = 0.5*(projected[0]+1)
      agent_data[4*i+1] = 0.5*(projected[1]+1)
      agent_pts[4*i+0] = projected[0]
      agent_pts[4*i+1] = projected[1]
      agent_pts[4*i+2] = 0.5
      agent_pts[4*i+3] = 1
      agent_uvs[2*i+0] = 0.5*(projected[0]+1)
      agent_uvs[2*i+1] = 0.5*(projected[1]+1)

      vec3.transformMat4(projected, agents[i].goal, projector.projection)
      agent_data[4*i+2] = 0.5*(projected[0]+1)
      agent_data[4*i+3] = 0.5*(projected[1]+1)
    } 

    agent_data_tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, agent_data_tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, agents.length, 1, 0, gl.RGBA, gl.FLOAT, agent_data)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(shaderProgram)
    if (cMap) {
      gl.uniform1f(shaderProgram.unifComfortMapEnabled, true)
      gl.uniform1i(shaderProgram.unifComfortMap, 2)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, comfortMap)
      comfortMap = cMap
    } else {
      gl.uniform1f(shaderProgram.unifComfortMapEnabled, false)
    }
  }

  this.setupDraw = function(agents, proj, voronoi) {
    theAgents = agents;

    // var agent_data = new Float32Array(agents.length*4)
    // agent_pts = new Float32Array(agents.length*4)
    // agent_uvs = new Float32Array(agents.length*2)
    var projected = vec3.create()
    for (var i = 0; i < agents.length; i++) {
      vec3.transformMat4(projected, agents[i].pos, proj)
      // console.log(projected)
      agent_data[4*i+0] = 0.5*(projected[0]+1)
      agent_data[4*i+1] = 0.5*(projected[1]+1)

      agent_pts[4*i+0] = projected[0]
      agent_pts[4*i+1] = projected[1]
      agent_pts[4*i+2] = 0.5
      agent_pts[4*i+3] = 1
      
      agent_uvs[2*i+0] = 0.5*(projected[0]+1)
      agent_uvs[2*i+1] = 0.5*(projected[1]+1)

      vec3.transformMat4(projected, agents[i].goal, proj)
      agent_data[4*i+2] = 0.5*(projected[0]+1)
      agent_data[4*i+3] = 0.5*(projected[1]+1)
    } 

    // var agent_positions = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, agent_data_tex)
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, agents.length, 1, 0, gl.RGBA, gl.FLOAT, agent_data)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, agent_data.length/4, 1, gl.RGBA, gl.FLOAT, agent_data)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.useProgram(shaderProgram);

    gl.uniform1f(shaderProgram.gridScale, options.gridSize)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "numAgents"), agents.length)
    gl.uniform2f(shaderProgram.windowSize, options.gridWidth, options.gridDepth)
    gl.uniform1i(shaderProgram.unifImage0, 0)
    gl.uniform1i(shaderProgram.unifImage1, 1)
    gl.uniform1i(shaderProgram.unifComfortMap, 2)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, voronoi)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, agent_data_tex)

    if (comfortMap) {
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, comfortMap)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.enableVertexAttribArray(shaderProgram.attrPos);
    gl.vertexAttribPointer(shaderProgram.attrPos, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(shaderProgram.attrPos, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.enableVertexAttribArray(shaderProgram.attrUv);
    gl.vertexAttribPointer(shaderProgram.attrUv, 2, gl.FLOAT, true, 0, 0);
    ext.vertexAttribDivisorANGLE(shaderProgram.attrUv, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    // gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    // gl.drawArrays(gl.POINTS, 0, agentPositions.length/2) 
  }

  this.teardown = function() {
    gl.disableVertexAttribArray(shaderProgram.attrPos)
    gl.disableVertexAttribArray(shaderProgram.attrUv)
  }
}