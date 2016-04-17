'use strict';

var Cube = require('./objects/cube.js')
var Plane = require('./objects/plane.js')
var Cylinder = require('./objects/cylinder.js')
var Cone = require('./objects/cone.js')
var Triangle = require('./objects/triangle.js')
var ShaderProgram = require('./shaderprogram.js')
var Camera = require('./camera.js')
var GL = require('./gl.js')

module.exports = function() {
  var gl;
  var cam;

  this.drawables = []

  this.getGL = function() {
    return gl
  }

  this.init = function(canvas) {
    this.canvas = canvas
    try {
      GL.set(canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: true
      }))
      gl = GL.get()
      gl.viewportWidth = canvas.width
      gl.viewportHeight = canvas.height
      cam = new Camera(gl.viewportWidth, gl.viewportHeight)
      cam.recomputeEye()
    } catch(e) {
      console.log(e)
    }
    if (!gl) {
      alert('Could not initialize WebGL! :(')
    }

    gl.enable(gl.DEPTH_TEST)

    Cube.create(gl)
    Plane.create(gl)
    Cylinder.create(gl)
    Triangle.create(gl)
    Cone.create(gl)

    gl.lineWidth(1.0)
    
    this.Lambert = new ShaderProgram(gl, [
      require('./shaders/lambert-vs.js'), 
      require('./shaders/lambert-fs.js')
    ])
    this.MarkerShader = new ShaderProgram(gl, [ 
      require('./shaders/marker-vs.js'),
      require('./shaders/marker-fs.js')
    ])
    this.VoronoiShader = new ShaderProgram(gl, [ 
      require('./shaders/voronoi-vs.js'),
      require('./shaders/voronoi-fs.js')
    ])
    this.PixelShader = new ShaderProgram(gl, [
      require('./shaders/pixel-vs.js'),
      require('./shaders/marker-fs.js')
    ])
    this.VelocityShader = new ShaderProgram(gl, [ 
      require('./shaders/velocity-vs.js'),
      require('./shaders/velocity-fs.js')
    ])
    this.TestShader = new ShaderProgram(gl, [ 
      require('./shaders/test-vs.js'),
      require('./shaders/test-fs.js')
    ])

    // SETUP MOUSE HANDLERS
    var that = this

    var shiftKey = false;
    window.onkeydown = function(e) {
        if(e.keyCode == 16) {
            shiftKey = true;
        }
    };
    window.onkeyup = function(e) {
        if(e.keyCode == 16) {
            shiftKey = false;
        }
    };

    canvas.addEventListener('wheel', function(e) {
      e.preventDefault()
      cam.zoomIn(e.wheelDeltaY)
      that.draw()
    })

    canvas.addEventListener('mousedown', function(e) {
      e.preventDefault()
      
      var pos = [e.pageX, e.pageY]
      var moveHandler = function(e) {
        var newpos = [e.pageX, e.pageY]
        if (shiftKey) {
          cam.slide([newpos[0] - pos[0], newpos[1] - pos[1]])
        } else {
          cam.mouseRotate([newpos[0] - pos[0], newpos[1] - pos[1]])
        }
        that.draw()
        pos = newpos
      }

      var upHandler = function(e) {
        if (e.button == 1) {
          window.removeEventListener('mouseup', upHandler)    
          window.removeEventListener('mousemove', moveHandler)  
        }  
      }

      if (e.button == 1) {
        window.addEventListener('mouseup', upHandler)
        window.addEventListener('mousemove', moveHandler)
      }
    })
  }

  this.resize = function() {
    canvas.setAttribute('width', canvas.offsetWidth);
    canvas.setAttribute('height', canvas.offsetHeight);
    gl.viewportWidth = canvas.offsetWidth;
    gl.viewportHeight = canvas.offsetHeight;
    cam.resize(gl.viewportWidth, gl.viewportHeight)
    this.draw()
  }

  this.draw = function () {
    gl.clearColor(0.2, 0.2, 0.2, 1.0)
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    var viewProj = mat4.create();
    cam.viewProj(viewProj);
    this.Lambert.setViewProj(viewProj);
    this.MarkerShader.setViewProj(viewProj);

    /*var model = mat4.create();
    var plane = {
      transform: mat4.create(),
      geo: Plane,
      shader: this.Lambert,
      draw: function() {
        plane.shader.setModelMat(plane.transform),
        plane.shader.draw(plane.geo.get())
      }
    }*/

    // this.drawables.push(plane)

    for (var i = 0; i < this.drawables.length; i++) {
      //Lambert.setModelMat(this.drawables[i].transform)
      //Lambert.draw(this.drawables[i].geo.get())
      this.drawables[i].draw()
    }
  }
}