/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	AFRAME.registerComponent('sprite', {
	    
	    schema: {
	        src: {
	            default: ''
	        },
	        resize:{
	            default: '1 1 1'
	        }
	    },


	    init: function()
	    {
			//console.log("creating sprite");
	        this.textureLoader = new THREE.TextureLoader();
			this.map = 100;
	    },


	    play: function()
	    {
			this.map = new THREE.Texture( document.querySelector(this.data.src) );
			this.map.needsUpdate = true;
			//this.map = this.textureLoader.load(this.data.src);

	        this.material = new THREE.SpriteMaterial({
	            map: this.map
	        });
			
			this.material.blending = 2;
			this.material.depthTest = false;
			this.material.opacity = 0.15;
			this.material.dithering = true;
			this.material.transparent = true;
			//console.log( this.material.blending );

	        this.sprite = new THREE.Sprite(this.material);
			//console.log("assigned sprite");

	        resizeData = this.data.resize.split(' ');
	        this.sprite.scale.set( resizeData[0], resizeData[1], resizeData[2] );

	        this.el.setObject3D('mesh', this.sprite);
	    },


	    remove: function() {
	        console.log('remove sprite');
	        if (this.mesh) this.el.removeObject3D('mesh');
	    }

	});

	AFRAME.registerPrimitive('a-sprite', {
	    defaultComponents: {
	        sprite: {}
	    },
	    mappings: {
	        src: 'sprite.src',
	        resize: 'sprite.resize'
	    }
	});


/***/ }
/******/ ]);