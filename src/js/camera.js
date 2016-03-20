'use strict'

var DEG2RAD = 3.14159265 / 180

var Camera = function(w, h) {
  var theta = -45 * DEG2RAD
  var phi = -45 * DEG2RAD
  var zoom = 30
  var fovy = 45 * DEG2RAD
  var width = w
  var height = h
  var near_clip = 0.1
  var far_clip = 1000

  var ref = vec3.fromValues(0,0,0)
  var rotation = mat4.create()

  var eye = vec3.create()
  vec3.transformMat4(eye, vec3.fromValues(0,0,zoom), rotation)  
  vec3.add(eye, eye, ref)

  var forward = vec3.create()
  var right = vec3.create()
  var up = vec3.create()

  var recomputeEye = function() {
    vec3.transformMat4(eye, vec3.fromValues(0,0,zoom), rotation)  
    vec3.add(eye, eye, ref)

    forward = vec3.fromValues(ref[0]-eye[0], ref[1]-eye[1], ref[2]-eye[2])
    vec3.normalize(forward, forward)
    
    vec3.cross(right, forward, vec3.fromValues(0,1,0))
    vec3.normalize(right, right)

    vec3.cross(up, right, forward)
    vec3.normalize(up, up)
  }

  var resize = function(w, h) {
    width = w
    height = h
  }

  var viewProj = function(out) {
    var proj = mat4.create()
    mat4.perspective(proj, fovy, width/height, near_clip, far_clip)

    var view = mat4.create()
    mat4.lookAt(view, eye, ref, up)

    mat4.multiply(out, proj, view)
  }

  var rotateAbout = function(angle, vector) {
    var rot = mat4.create()
    mat4.rotate(rot, rot, angle, vector)
    mat4.multiply(rotation, rot, rotation)
    vec3.transformMat4(up, up, rot)
    vec3.transformMat4(right, right, rot)
    vec3.transformMat4(forward, forward, rot)
    recomputeEye()
  }

  var mouseRotate = function(diff) {
    diff = vec2.fromValues(diff[0]/width, diff[1]/height)
    var y = vec3.fromValues(0,1,0);
    var angle = Math.acos(diff[1] / vec2.length(diff))
    var para = vec3.create()
    if (diff[0] > 0) {
      var rot = mat4.create()
      mat4.rotate(rot, rot, -angle, forward)
      vec3.transformMat4(para, up, rot)
    } else {
      var rot = mat4.create()
      mat4.rotate(rot, rot, angle, forward)
      vec3.transformMat4(para, up, rot)
    }
    var perp = vec3.create()
    vec3.cross(perp, forward, para)
    vec3.normalize(perp, perp)
    rotateAbout(-2*3.14159265*vec2.length(diff), perp)
    recomputeEye()
  }

  var toWorld = function(x, y, out) {
    var sx = 2*x / width - 1
    var sy = 1 - (2*y / height)
    var alpha = fovy / 2
    var len = vec3.create()
    vec3.sub(len, ref, eye)
    len = vec3.length(len)

    var V = vec3.create()
    var H = vec3.create()
    vec3.scale(V, up, sy*len*Math.tan(alpha))
    vec3.scale(H, right, sx*len*(width/height)*Math.tan(alpha))
    vec3.add(out, V, H)
    vec3.add(out, out, ref)
  }

  var slide = function (diff) {
    var x = width / 2 - diff[0]
    var y = height / 2 - diff[1]
    toWorld(x, y, ref)
    recomputeEye()
  }

  var zoomIn = function(amnt) {
    var len = vec3.create()
    vec3.sub(len, ref, eye)
    len = vec3.length(len)
    var fac = len / 10
    if (fac > 1) { fac = 1 }
    zoom -= amnt / 120 * fac
    recomputeEye()
  }

  rotateAbout(-30 * DEG2RAD, vec3.fromValues(1,0,0))
  rotateAbout(45 * DEG2RAD, vec3.fromValues(0,1,0))

  this.resize = resize
  this.viewProj = viewProj
  this.mouseRotate = mouseRotate
  this.slide = slide
  this.recomputeEye = recomputeEye
  this.zoomIn = zoomIn
}

module.exports = Camera