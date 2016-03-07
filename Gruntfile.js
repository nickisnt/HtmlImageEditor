'use strict';
var path = require('path');

module.exports = function( grunt ) {

  require("matchdep").filterDev("grunt-*").forEach( grunt.loadNpmTasks );

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    src:"src",
    express: {
      server: {
        options: {
          bases: ['src','node_modules']
        }   
      }   
    }
  });
   
  grunt.registerTask('server', ['express','express-keepalive']);
};
