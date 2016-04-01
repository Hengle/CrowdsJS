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
var OncomingScene = require('./scenes/oncoming.js')

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

  var options = {}

  // var applyOptions = function(options) {
  //   if (biocrowds) {
  //     biocrowds.setOptions(options)
  //   }
  // }

  var loadScene = function(scene) {
    if (biocrowds && biocrowds.scene) {
      biocrowds.deinit()
    }
    scene.create()
    biocrowds = new BioCrowds(gl, scene.options())
    options = biocrowds.getOptions()
    biocrowds.scene = scene
    biocrowds.init()
    biocrowds.initAgents(scene.agents)    
    gl.draw() 

    document.getElementById('markerDensity').value = options.markerDensity
    document.getElementById('searchRadius').value = options.searchRadius
    document.getElementById('rightPreference').checked = options.rightPreference
    document.getElementById('drawMarkers').checked = options.drawMarkers
  }

  document.getElementById('update-btn').onclick = function() {
    options.markerDensity = parseFloat(document.getElementById('markerDensity').value)
    options.searchRadius = parseFloat(document.getElementById('searchRadius').value)
    options.rightPreference = document.getElementById('rightPreference').checked
    options.drawMarkers = document.getElementById('drawMarkers').checked
  }

  document.getElementById('circle-scene-btn').onclick = function() {
    loadScene(CircleScene)
  }

  document.getElementById('oncoming-scene-btn').onclick = function() {
    loadScene(OncomingScene)
  }

  var simulationInterval
  var runSimulation = function() {
    if (biocrowds) {
      if (!running) {
        running = true
        simulationInterval = setInterval(function() {
          //biocrowds.step(1/24)
          gl.draw()
          biocrowds.step(1/24)
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

  window.onkeypress = function(e) {
    if (e.keyCode == 32) {
      if (running) {
        stopSimulation()
      } else {
        runSimulation()
      }
    } else if (e.keyCode == 114) {
      resetSimulation()
    }
  }

  loadScene(CircleScene)
  runSimulation()
})