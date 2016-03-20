'use strict';

var domready = require("domready");
var ShaderProgram = require('./shaderprogram.js');
var MyGL = require('./mygl.js')
var PanelUI = require('panelui')
var ResizeSensor = require('css-element-queries/src/ResizeSensor')
var Cube = require('./objects/cube.js')
var Plane = require('./objects/plane.js')
var BioCrowds = require('./biocrowds')
var CircleScene = require('./scenes/circle.js')

var layout = {
  root: 0,
  panels: [
    {
      floating: false,
      layout: 'horizontal',
      subpanels: [1, 2]
    },
    {
      floating: false,
      id: 'main'
    },
    {
      floating: false,
      width: 400,
      id: 'sidebar'
    }
  ]
}

PanelUI.create('container', layout)

document.getElementById('sidebar').appendChild(document.getElementById('sidebar-content'))
document.getElementById('main').appendChild(document.getElementById('main-content'))

domready(function () {
  var canvas = document.getElementById('canvas')
  var gl = new MyGL()
  gl.init(canvas)
  gl.resize()

  new ResizeSensor(document.getElementById('main-content'), function() {
    gl.resize()
  })

  var biocrowds

  var running = false

  var loadScene = function(scene) {
    if (biocrowds && biocrowds.scene) {
      biocrowds.deinit()
    }
    scene.create()
    biocrowds = new BioCrowds(gl, scene.options)
    biocrowds.scene = scene
    biocrowds.init()
    biocrowds.initAgents(scene.agents)    
    gl.draw() 
  }

  document.getElementById('circle-scene-btn').onclick = function() {
    loadScene(CircleScene)
  }


  var simulationInterval
  var runSimulation = function() {
    if (biocrowds) {
      if (!running) {
        running = true
        simulationInterval = setInterval(function() {
          biocrowds.step(1/24)
          gl.draw()
        }, 1000/24)
      }
    }
  }

  var stopSimulation = function() {
    if (biocrowds) {
      if (running) {
        running = false
        clearInterval(simulationInterval)
      }
    }
  }

  var resetSimulation = function() {
    if (biocrowds) {
      var cont = running
      stopSimulation()
      loadScene(biocrowds.scene)
      if (cont) {
        runSimulation()
      }
    }
  }

  document.getElementById('run-btn').onclick = function() {
    runSimulation()
  }

  document.getElementById('stop-btn').onclick = function() {
    stopSimulation()
  }

  document.getElementById('reset-btn').onclick = function() {
    resetSimulation()
  }

  //loadScene(CircleScene)

  /*setInterval(function() {
    biocrowds.step(1/24)
    gl.draw()
  }, 1000/24)*/
})