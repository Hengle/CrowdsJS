//#gljs varname: 'reachability_fragment_shader_src' 

precision highp float;

uniform sampler2D back;
uniform sampler2D data;
uniform sampler2D obstacles;
uniform vec2 windowSize;

varying vec2 fs_uv;

const int D = 1337;

const float falloff = 0.005;

vec2 uv_clamp(vec2 vec) {
  return clamp(vec, vec2(0.001,0.001), vec2(0.999,0.999));
}

void main(void) {
  float current = texture2D(back, fs_uv).x;

  float xsize = 1.0 / windowSize.x;
  float ysize = 1.0 / windowSize.y;

  vec2 l = uv_clamp(vec2(fs_uv.x - xsize, fs_uv.y));
  vec2 r = uv_clamp(vec2(fs_uv.x + xsize, fs_uv.y));
  vec2 u = uv_clamp(vec2(fs_uv.x, fs_uv.y - ysize));
  vec2 d = uv_clamp(vec2(fs_uv.x, fs_uv.y + ysize));

  vec2 dl = uv_clamp(vec2(fs_uv.x - xsize, fs_uv.y - ysize));
  vec2 dr = uv_clamp(vec2(fs_uv.x + xsize, fs_uv.y - ysize));
  vec2 ul = uv_clamp(vec2(fs_uv.x - xsize, fs_uv.y + ysize));
  vec2 ur = uv_clamp(vec2(fs_uv.x + xsize, fs_uv.y + ysize));

  float col_l = texture2D(back, l).x + falloff;
  float col_r = texture2D(back, r).x + falloff;
  float col_u = texture2D(back, u).x + falloff;
  float col_d = texture2D(back, d).x + falloff;

  float col_dl = texture2D(back, dl).x + falloff*1.41421356;
  float col_dr = texture2D(back, dr).x + falloff*1.41421356;
  float col_ul = texture2D(back, ul).x + falloff*1.41421356;
  float col_ur = texture2D(back, ur).x + falloff*1.41421356;

  // float col = min(current, min(left, min(right, min(up, down))));

  float low = min(current, min(col_l, min(col_r, min(col_u, min(col_d, min(col_dl, min(col_dr, min(col_ul, col_ur))))))));

  // float sum = col_l+col_r+col_u+col_d+col_dl+col_dr+col_ul+col_ur;
  // float avg = sum / 8.0;
  // float col = min(avg, low);
  // float col = sum - 8.0;
  // float col = min(current, low + 0.01);
  // float col = 1.0 - (8.0 - sum)/7.1 + 0.01;
  // float infl = (1.0 - avg);
  float col = min(low, current) + texture2D(obstacles, fs_uv).x;

  gl_FragColor = vec4(col, col, col, 1.0);
}