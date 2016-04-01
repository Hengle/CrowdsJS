'use strict'

module.exports = function(options) {

  var viewproj = mat4.create()
  var invviewproj = mat4.create()
  var view = mat4.create()
  var projection = mat4.create()
  mat4.lookAt(view, vec3.fromValues(0,100,0), vec3.fromValues(0,0,0), vec3.fromValues(0,0,-1))
  mat4.ortho(projection, 
    options.originX, options.sizeX + options.originX, 
    options.originZ, options.sizeZ + options.originZ, 
    0.1, 200)
  mat4.multiply(viewproj, projection, view)
  mat4.invert(invviewproj, viewproj)

  var projector = {
    view: view,
    projection: projection,
    viewproj: viewproj,
    invviewproj: invviewproj,
    RES: 10,
    col2ID: function(col) {
      var id = [
      Math.round(col[0]/255*projector.RES), 
      Math.round(col[1]/255*projector.RES), 
      Math.round(col[2]/255*projector.RES)]
      id = id[0] + id[1]*projector.RES + id[2]*projector.RES*projector.RES
      return id
    }
  }

  return projector

}