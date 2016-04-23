var GL = require('../gl.js')

module.exports = function() {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(noise_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(noise_fragment_shader_src, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  var attrPos = gl.getAttribLocation(shaderProgram, 'vs_pos')
  var attrUV = gl.getAttribLocation(shaderProgram, 'vs_uv')

  var unifScale = gl.getUniformLocation(shaderProgram, 'u_Scale')

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  gl.useProgram(shaderProgram)

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


  this.generate = function(width, height, scale) {
    var noise_tex = GL.makeTexture(width, height)

    gl.bindFramebuffer(gl.FRAMEBUFFER, noise_tex.fbo)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    gl.useProgram(shaderProgram)

    gl.uniform1f(unifScale, scale)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.enableVertexAttribArray(attrPos);
    gl.vertexAttribPointer(attrPos, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(attrPos, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.enableVertexAttribArray(attrUV);
    gl.vertexAttribPointer(attrUV, 2, gl.FLOAT, true, 0, 0);
    ext.vertexAttribDivisorANGLE(attrUV, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return noise_tex.tex
  }
}