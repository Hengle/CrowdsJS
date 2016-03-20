module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        files: {
          'js/bundle.js': 'src/js/**/*.js'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'js/bundle.min.js': 'js/bundle.js'
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/js/**/*.js'],
        tasks: ['browserify', 'uglify'],
        options: {
          spawn: false,
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['browserify', 'uglify']);
}