'use strict'

var GL = require('../../gl')

module.exports = function(options, cond) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")
  gl.getExtension('OES_texture_float')
  gl.getExtension('OES_float_linear')

  var agent_pts
  var agent_uvs
  var agent_data
  var agent_data_tex
  var projector

  var agents
  var condition = cond

  var v_pos
  var v_uv

  this.init = function(theAgents, proj) {
    agents = []
    for (var i = 0; i < theAgents.length; i++) {
      if (condition(theAgents[i])) {
        agents.push(theAgents[i])
      }
    }
    projector = proj
    // 0: agent u
    // 1: agent v
    // 2: goal u
    // 3: goal v
    agent_data = new Float32Array(agents.length*4)
    agent_pts = new Float32Array(agents.length*4)
    agent_uvs = new Float32Array(agents.length*2)

    var projected = vec3.create()
    for (var i = 0; i < agents.length; i++) {
      vec3.transformMat4(projected, agents[i].pos, projector.viewproj)

      agent_data[4*i+0] = 0.5*(projected[0]+1)
      agent_data[4*i+1] = 0.5*(projected[1]+1)
      agent_pts[4*i+0] = projected[0]
      agent_pts[4*i+1] = projected[1]
      agent_pts[4*i+2] = 0.5
      agent_pts[4*i+3] = 1
      agent_uvs[2*i+0] = 0.5*(projected[0]+1)
      agent_uvs[2*i+1] = 0.5*(projected[1]+1)

      vec3.transformMat4(projected, agents[i].goal, projector.viewproj)
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

    v_pos = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.bufferData(gl.ARRAY_BUFFER, agent_pts, gl.DYNAMIC_DRAW)

    v_uv = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.bufferData(gl.ARRAY_BUFFER, agent_uvs, gl.DYNAMIC_DRAW)

    this.data = agent_data
    this.tex = agent_data_tex

    this.buffer_pos = v_pos
    this.buffer_uv = v_uv

    this.count = agents.length
  }

  this.draw = function() {
    var projected = vec3.create()

    for (var i = 0; i < agents.length; i++) {
      vec3.transformMat4(projected, agents[i].pos, projector.viewproj)

      agent_data[4*i+0] = 0.5*(projected[0]+1)
      agent_data[4*i+1] = 0.5*(projected[1]+1)
      agent_pts[4*i+0] = projected[0]
      agent_pts[4*i+1] = projected[1]
      agent_pts[4*i+2] = 0.5
      agent_pts[4*i+3] = 1
      agent_uvs[2*i+0] = 0.5*(projected[0]+1)
      agent_uvs[2*i+1] = 0.5*(projected[1]+1)

      vec3.transformMat4(projected, agents[i].goal, projector.viewproj)
      agent_data[4*i+2] = 0.5*(projected[0]+1)
      agent_data[4*i+3] = 0.5*(projected[1]+1)
    }

    gl.bindTexture(gl.TEXTURE_2D, agent_data_tex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, agent_data.length/4, 1, gl.RGBA, gl.FLOAT, agent_data)
    gl.bindTexture(gl.TEXTURE_2D, null)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.bufferData(gl.ARRAY_BUFFER, agent_pts, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.bufferData(gl.ARRAY_BUFFER, agent_uvs, gl.DYNAMIC_DRAW)
  }
}