'use strict';

module.exports = function (gl, shaders) {
  var modelMat = mat4.create();
  var invTrMat = mat4.create();
  var viewProjMat = mat4.create();
  var shaderProgram;

  var getShader = function(source) {
    var shader;
    if (source.type == 'VERT') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else  if (source.type == 'FRAG') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, source.src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  this.init = function(shaders) {
    shaderProgram = gl.createProgram();
    for (var i = 0; i < shaders.length; i++) {
      var shader = getShader(shaders[i]);
      gl.attachShader(shaderProgram, shader);
    }
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not link program!");
    }

    shaderProgram.attrPos = gl.getAttribLocation(shaderProgram, "vs_pos");
    shaderProgram.attrCol = gl.getAttribLocation(shaderProgram, "vs_col");
    shaderProgram.attrNor = gl.getAttribLocation(shaderProgram, "vs_nor");
    shaderProgram.unifViewProj = gl.getUniformLocation(shaderProgram, "u_ViewProj");
    shaderProgram.unifModel = gl.getUniformLocation(shaderProgram, "u_Model");
    shaderProgram.unifInvTrans = gl.getUniformLocation(shaderProgram, "u_InvTrans");
    shaderProgram.unifCol = gl.getUniformLocation(shaderProgram, 'u_Color');
  }

  this.draw = function(obj) {
    gl.useProgram(shaderProgram);

    if (shaderProgram.attrPos != -1 && obj.positions) {
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.positions)
      gl.enableVertexAttribArray(shaderProgram.attrPos);
      gl.vertexAttribPointer(shaderProgram.attrPos, 4, gl.FLOAT, false, 0, 0);
    }
    if (shaderProgram.attrNor != -1 && obj.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.normals)
      gl.enableVertexAttribArray(shaderProgram.attrNor);
      gl.vertexAttribPointer(shaderProgram.attrNor, 4, gl.FLOAT, false, 0, 0);
    }
    if (shaderProgram.attrCol != -1 && obj.colors) {
      gl.bindBuffer(gl.ARRAY_BUFFER, obj.colors)
      gl.enableVertexAttribArray(shaderProgram.attrCol);
      gl.vertexAttribPointer(shaderProgram.attrCol, 4, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);
    gl.drawElements(obj.drawMode, obj.count, gl.UNSIGNED_SHORT, 0);

    if (shaderProgram.attrPos != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrPos)
    }
    if (shaderProgram.attrNor != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrNor)
    }
    if (shaderProgram.attrCol != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrCol)
    }
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

  this.setColor = function (col) {
    if (shaderProgram.unifCol != -1) {
      gl.useProgram(shaderProgram)
      gl.uniform4fv(shaderProgram.unifCol, col)
    }
  }

  this.init(shaders);
}