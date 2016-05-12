'use strict'

var GL = require('../../gl.js')
var Plane = require('../../objects/plane.js')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var modelMat = mat4.create()
  var invTrMat = mat4.create()
  var viewProjMat = mat4.create()


  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(texture_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(texture_fragment_shader_src, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!")
  }

  var attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  var attrNor = gl.getAttribLocation(shaderProgram, "vs_nor")
  var attrUv = gl.getAttribLocation(shaderProgram, "vs_uv")
  var unifImage = gl.getUniformLocation(shaderProgram, "u_image")
  var unifBound = gl.getUniformLocation(shaderProgram, "textureBound")

  shaderProgram.unifViewProj = gl.getUniformLocation(shaderProgram, "u_ViewProj")
  shaderProgram.unifModel = gl.getUniformLocation(shaderProgram, "u_Model")
  shaderProgram.unifInvTrans = gl.getUniformLocation(shaderProgram, "u_InvTrans")

  // var uv_coords = new Float32Array([
  //   0,0,
  //   0,1,
  //   1,1,
  //   1,0
  // ])
  // var uvs = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, uvs)
  // gl.bufferData(gl.ARRAY_BUFFER, uv_coords, gl.STATIC_DRAW)
  // uvs.itemSize = 2
  // uvs.numItems = 4

  var plane = Plane.get()
  
  this.draw = function() {
    
    // mat4.identity(modelMat)
    // mat4.scale(planeTrans, planeTrans, vec3.fromValues(options.sizeX, 1, options.sizeZ))
    // console.log(plane)

    gl.useProgram(shaderProgram)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.uniform1i(unifImage, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, plane.positions)
    gl.enableVertexAttribArray(attrPos)
    gl.vertexAttribPointer(attrPos, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(attrPos, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, plane.normals)
    gl.enableVertexAttribArray(attrNor)
    gl.vertexAttribPointer(attrNor, 4, gl.FLOAT, false, 0, 0)
    ext.vertexAttribDivisorANGLE(attrNor, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, plane.uvs)
    gl.enableVertexAttribArray(attrUv)
    gl.vertexAttribPointer(attrUv, 2, gl.FLOAT, true, 0, 0)
    ext.vertexAttribDivisorANGLE(attrUv, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indices)
    gl.drawElements(plane.drawMode, plane.count, gl.UNSIGNED_SHORT, 0)

    gl.disableVertexAttribArray(attrPos)
    gl.disableVertexAttribArray(attrNor)
    gl.disableVertexAttribArray(attrUv)
  }

  this.setViewProj = function(matrix) {
    gl.useProgram(shaderProgram);
    viewProjMat = matrix;
    if (shaderProgram.unifViewProj != -1) {
      gl.uniformMatrix4fv(shaderProgram.unifViewProj, false, viewProjMat);
    }
  }

  this.setModelMat = function(matrix) {
    gl.useProgram(shaderProgram);
    modelMat = matrix;
    mat4.transpose(invTrMat, modelMat);
    mat4.invert(invTrMat, invTrMat);
    if (shaderProgram.unifModel != -1) {
      gl.uniformMatrix4fv(shaderProgram.unifModel, false, modelMat);
    }
    if (shaderProgram.unifInvTrans != -1) {
      gl.uniformMatrix4fv(shaderProgram.unifInvTrans, false, invTrMat);
    }
  }

  this.setTexture = function(tex) {
    gl.useProgram(shaderProgram)
    if (tex) {
      gl.uniform1f(unifBound, true)
    } else {
      gl.uniform1f(unifBound, false)
    }
    this.tex = tex
  }
}
