//#gljs varname: 'voronoi_vertex_shader_src' 

attribute vec4 vs_pos;
attribute vec3 vs_offset;
attribute vec3 vs_velocity;
attribute vec3 vs_id;
varying vec4 fs_col;
uniform mat4 u_ViewProj;

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    float v1 = 3.14159265/2.0 - atan(x,y);
    float v2 = atan(x,y);
    return (1.0-float(s))*v1 + float(s)*v2;
}

void main(void) { 
  fs_col = vec4(vs_id, 1);
  vec3 pos = vec3(vs_pos.x, 0, vs_pos.z);
  vec3 vel = normalize(vs_velocity);
  mat4 rot = rotationMatrix(vec3(0,1,0), atan2(-vel.z, vel.x));
  float fac = 2.0 + dot(normalize(pos), normalize(vs_velocity));
  fac = fac / 3.0;
  pos = vec3(rot * vs_pos);
  gl_Position = u_ViewProj * (vec4(pos,1) + vec4(vs_offset, 0));
}