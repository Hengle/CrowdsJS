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
var ComfortScene = require('./scenes/comfort.js')

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

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
}();

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
  var visSettings = {}
  var simSettings = {
    rightPreference: true
  }

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
    options.vis = visSettings
    options.sim = simSettings
    biocrowds.scene = scene
    biocrowds.init()
    biocrowds.initAgents(scene.agents)    
    gl.draw() 

    // document.getElementById('markerDensity').value = options.markerDensity
    // document.getElementById('searchRadius').value = options.searchRadius
    // document.getElementById('rightPreference').checked = options.rightPreference
    // document.getElementById('drawMarkers').checked = options.drawMarkers
  }

  // document.getElementById('update-btn').onclick = function() {
  //   options.markerDensity = parseFloat(document.getElementById('markerDensity').value)
  //   options.searchRadius = parseFloat(document.getElementById('searchRadius').value)
  //   options.rightPreference = document.getElementById('rightPreference').checked
  //   options.drawMarkers = document.getElementById('drawMarkers').checked
  // }

  document.getElementById('rightPreference').onclick = function() {
    simSettings.rightPreference = document.getElementById('rightPreference').checked
    biocrowds.applyOptions()
  }

  var setupVisBtns = function() {
    var btns = document.getElementsByClassName('plane-visualize-btn')
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        visSettings.groundPlane = this.getAttribute('attr-val')
        biocrowds.applyOptions()
      })
    }
  }
  setupVisBtns()

  document.getElementById('circle-scene-btn').onclick = function() {
    loadScene(CircleScene)
  }

  document.getElementById('oncoming-scene-btn').onclick = function() {
    loadScene(OncomingScene)
  }

  document.getElementById('comfort-scene-btn').onclick = function() {
    loadScene(ComfortScene)
  }

  var simulationInterval

  var diff = 33.33333
  var stepSimulation = function() {
    var t0 = performance.now()
    gl.draw()
    //biocrowds.step(diff / 1000)
    biocrowds.step(1 / 24)
    var t1 = performance.now()
    diff = Math.max(t1 - t0, 1000/80)
    var fps = 1000/diff;
    document.getElementById('fps').innerHTML = fps.toFixed(3) + ' fps';
    simulationInterval = setTimeout(stepSimulation, diff)
  }

  var runSimulation = function() {
    if (biocrowds) {
      if (!running) {
        running = true
        stepSimulation()
        /*
        simulationInterval = setInterval(function() {
          //biocrowds.step(1/24)
          var t0 = performance.now()
          gl.draw()
          var t1 = performance.now()
          var diff = t1 - t0;
          console.log((t1 - t0)/1000)
          biocrowds.step(diff/1000)
        }, 4)*/
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

  if (QueryString.vis == 'voronoi') {
    visSettings.groundPlane = 'voronoi'
  } else if (QueryString.vis == 'voronoiRefine') {
    visSettings.groundPlane = 'voronoiRefine'
  } else if (QueryString.vis == 'weights') {
    visSettings.groundPlane = 'weights'
  } else if (QueryString.vis == 'comfort') {
    visSettings.groundPlane = 'comfort'
  }

  if (QueryString.scene == 'circle') {
    loadScene(CircleScene)  
  } else if (QueryString.scene == 'oncoming') {
    loadScene(OncomingScene)
  } else if (QueryString.scene == 'comfort') {
    loadScene(ComfortScene)
  }

  runSimulation()
})