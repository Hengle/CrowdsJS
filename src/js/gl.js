'use strict'

var GL

module.exports =  {
  set: function(gl) {
    GL = gl
  },

  get: function() {
    return GL
  },

  getShader: function(source, type) {
    var shader = GL.createShader(type)

    GL.shaderSource(shader, source);
    GL.compileShader(shader);

    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert(GL.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  },

  makeTexture: function(width, height) {
    var texture = GL.createTexture()
    GL.bindTexture(GL.TEXTURE_2D, texture)
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST)
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST)
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null)

    var fbo = GL.createFramebuffer()
    GL.bindFramebuffer(GL.FRAMEBUFFER, fbo)
    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0)

    var rbo = GL.createRenderbuffer()
    GL.bindRenderbuffer(GL.RENDERBUFFER, rbo)
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, width, height)

    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0)
    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, rbo)

    GL.bindTexture(GL.TEXTURE_2D, null)
    GL.bindRenderbuffer(GL.RENDERBUFFER, null)
    GL.bindFramebuffer(GL.FRAMEBUFFER, null)

    return {
      tex: texture,
      fbo: fbo,
      rbo: rbo
    }
  },

  loadImageTexture: function(src) {
    var texture = GL.createTexture()
    var image = new Image()
    image.onload = function() {
      GL.bindTexture(GL.TEXTURE_2D, texture)
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
      GL.generateMipmap(GL.TEXTURE_2D);
      GL.bindTexture(GL.TEXTURE_2D, null);
    }
    image.src = src
    return texture
  }
}