/**
 * Copyright (c) 2017 Split Media Labs, All rights reserved.
 * <licenseinfo@splitmedialabs.com>
 * 
 * You may only use this file subject to direct and explicit grant of rights by Split Media Labs,
 * either by written license agreement or written permission.
 * 
 * You may use this file in its original or modified form solely for the purpose, and subject to the terms,
 * stipulated by the license agreement or permission.
 * 
 * If you have not received this file in source code format directly from Split Media Labs,
 * then you have no right to use this file or any part hereof.
 * Please delete all traces of the file from your system and notify Split Media Labs immediately.
 */
let xjs = require('xjs');
"use strict";
if(typeof window.external.SetLocalProperty !== "undefined"){
	window.external.SetLocalProperty("prop:Browser60fps","1");  
}

/**
 * [XBCAudioVisualizer is a class that allows the manipulation of audio visualizations]
 */
var XBCAudioVisualizer = function(config = {}){

	/**
	 * [config contains all the needed information to startup]
	 * @type {[type]}
	 */
	this.config = config;
	/**
	 * [_defaults a queueable object where we can merge local defaults with defaults of the user.]
	 * @type {Object}
	 */
	this._defaults = {}
	/**
	 * [paths is an array that will display multiple visualizations when used on frequece bars]
	 * @type {[type]}
	 */
	this.paths = null;
	/**
	 * [path indicated the individual path to be treated into the array ]
	 * @type {[type]}
	 */
	this.path = null;
	/**
	 * [visualizer is the DOM ELEMENT that contains the visualizer]
	 * @type {[type]}
	 */
	this.visualizer = null;
	/**
	 * [mask is the DOM ELEMENT that contain the mask to be used.]
	 * @type {[type]}
	 */
	this.mask = null;
	/**
	 * [AudioContext is an instance of AudioContext Browser Worker]
	 * @type {AudioContext}
	 */
	this.audioContent = new AudioContext();

	/**
	 * [audioStream is a handler for the audio stream]
	 * @type {null}
	 */
	this.audioStream = null;

	/**
	 * [analyser is an object that will help with analysing the wave.]
	 * @type {[type]}
	 */
	this.analyser = null;
	/**
	 * [enableLog enables/disables internal logs]
	 * @type {Boolean}
	 */
	this.enableLog = true;

	/**
	 * [canvas container]
	 * @type {[type]}
	 */
	this.canvas = null;

	this.wave = 0;

	/**
	 * [log prints into the console the given arguments]
	 * @return {[type]} [description]
	 */
	this.log = (args) =>{
		var self = this;
		if(self.enableLog){
			$("#log").text(args);
		}
	}
	/**
	 * [description]
	 * @param  {[type]} visualizerId [description]
	 * @param  {[type]} maskId       [description]
	 * @return {[type]}              [description]
	 */
	this.prepare = (visualizerId,maskId) => {
		var self = this;
		self.paths = document.getElementsByTagName('path');
		//self.visualizer = document.getElementById(visualizerId);
		//self.mask = visualizer.getElementById(maskId); 
	}

	/**
	 * [setXBCAudioDeviceAsSource sets an audio device to be used by XBCAudioVisualizer. if no parameters are given, then Directshow is implemented as default]
	 * @param  {String} XBCAudioDeviceId [the audio device ID]
	 * @return {[type]}                  [description]
	 */
	this.setXBCAudioDeviceAsSource = (XBCAudioDeviceId = '') => {
		var self = this;
		/**
		 * [if no device id is given, then we will use the default 'XSplitBroadcaster (DirectShow)' source]
		 */
		if(XBCAudioDeviceId === ''){
			let defaultDeviceId = null;
			navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
				for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
					if (uuidAudioSourceId[i].kind === 'audioinput') {
						if(uuidAudioSourceId[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0){
							defaultDeviceId = uuidAudioSourceId[i].deviceId;
							break;
						}
					}
				}
				 navigator.getUserMedia({
					video: false,
					audio: {deviceId : {
						exact: defaultDeviceId
					}}
				}, self.soundAllowed, self.soundNotAllowed);
			})
			
		/**
		 * Otherwise we map what we can get from the configuration.
		 */
		} else {
			navigator.getUserMedia({
				video: false,
				audio: {deviceId : {
					exact: XBCAudioDeviceId
				}}
			}, self.soundAllowed, self.soundNotAllowed);
		}
	}
	/**
	 * [soundAllowed allows you to prepare and display the wave stream into your graphic.]
	 * @param  {Object}   stream   [the audio stream to be processed]
	 * @param  {Function} callback [is a function that can be used to send the stream out of the scope of this class in order to be manipulated by other users]
	 * @return {[type]}            [description]
	 */
	this.soundAllowed = (stream) => {
		var self = this;
		let resizeHandler = () => {
			let w = window.innerWidth;
			let h = window.innerHeight;
			console.log(w+','+h);
			let cx = w / 2;
			let cy = h / 2;
			self.visualizer.canvas.width = w;
			self.visualizer.canvas.height = h;
			self.canvas.width = w;
			self.canvas.height = h
		};

		/**
		 * [we prepare the stream by connecting the audio stream to the needed analyzer]
		 */
		window.persistAudioStream = stream;
		self.audioStream = self.audioContent.createMediaStreamSource( stream );
		self.analyser = self.audioContent.createAnalyser();
		self.analyser.fftSize = 1024;
		resizeHandler();

		/**
		 * we clear the frame
		 */
		self.visualizer.clearRect(0,0,self.canvas.width,self.canvas.height)

		/**
		 * [then we prepare a audioprocessor to fetch the frequencyArray to be drawn]
		 */
		let bufferLength = self.analyser.frequencyBinCount;
		let frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);
		let javascriptNode = self.audioContent.createScriptProcessor(1024,1,1);
		
		console.log(frequencyArray);
		
		window.addEventListener('resize',resizeHandler,false)

		/**
		 * [and we draw what comes in the audio process]
		 */
		javascriptNode.onaudioprocess = (e) => {
			self.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);
			self.analyser.getByteFrequencyData(frequencyArray);
			var spaceh = window.innerWidth/bufferLength;
			//self.visualizer.fillRect(0, 0, self.canvas.width, self.canvas.height);
			self.visualizer.setLineDash([4,4])
			self.visualizer.lineWidth = 4
			
			var tmpPath = null;
			let adjustedLength = 0;
			let pos = 0;
			let calc1 = 0;
			let calc2  = 0;
			for(var i = 0; i < bufferLength/2; i++) {
				
				calc1 = (frequencyArray[i]/bufferLength);
				calc2 = (window.innerHeight * calc1)*2;           	
				if(i==0){
					pos = 0
					if(adjustedLength > self.wave){
						self.wave = adjustedLength;
						console.log('new max:',self.wave);
					}
				} else {
					pos = (i)*spaceh*2;
				}

				var gradientObject = self.visualizer.createLinearGradient(pos,(self.canvas.height - calc2),pos,self.canvas.height);
				gradientObject.addColorStop('0' ,'#ff0a0a')
				gradientObject.addColorStop('0.2' ,'#f1ff0a')
				gradientObject.addColorStop('0.9' ,'#d923b9')
				gradientObject.addColorStop('1' ,'#050d61')
				tmpPath = new Path2D('M '+(pos)+','+self.canvas.height+' v -'+calc2);
				self.visualizer.strokeStyle = gradientObject;
				self.visualizer.shadowBlur = 40;
				self.visualizer.shadowColor = "white";
				self.visualizer.stroke(tmpPath);
			}
		}

		/**
		 * finally we connect all the pieces and run the visualization.
		 */
		self.audioStream.connect(self.analyser); 
		self.analyser.connect(javascriptNode); 
		javascriptNode.connect(self.audioContent.destination); 
	}
	/**
	 * [soundNotAllowed throws an exception when the audio is not being handled properly (wrong device, system error, etc)]
	 * @param  {Object} error [description]
	 * @return {[type]}       [description]
	 */
	this.soundNotAllowed = (error) => {
		throw ('there was an error fetching audio:')
		console.error(error);
	}

	/**
	 * [init will read the config passed to the class and put everything in order to start to work]
	 * @return {[type]} [description]
	 */
	this.init = () => {
		var self = this;
		var defaults = {
			visualizer : 'visualizer',
			isSVG : false,
			isCANVAS: false,
			haveMask : true,
			isMaskMarkup : false,
			mask : 'mask',
			audioDeviceId : '',
			hasCustomSoundAllowed : false,
			customSoundAllowed : function() {},
			customSoundNotAllowed : function() {},
			is3d : false,
			enableLog:false
		}

		/**
		 * then we pass the arguments to the _default attribute to be shared on the class...
		 */
		self._defaults = $.extend({},defaults,self.config);

		var self = this;
		if(typeof self.config.visualizer === 'undefined') throw 'It is required the use of the id of the visualizer container';
		if(document.getElementById(self._defaults.visualizer) === null) throw 'The visualizer container was not found into the HTML DOM';
		if(typeof self.config.canvas_width === 'undefined') throw 'The visualizer width was not found on the settings';
		if(typeof self.config.canvas_height === 'undefined') throw 'The visualizer height was not found on the settings';

		if(self._defaults.enableLog){
			self.enableLog = true;
		}

		/**
		 * starting up instances...
		 */
		self.canvas = document.getElementById(self._defaults.visualizer);
		self.visualizer = self.canvas.getContext("2d")
		self.mask = document.getElementById(self._defaults.mask); 
		
		/** 
		 * ready to go!
		 */
		self.setXBCAudioDeviceAsSource()
	}

	/**
	 * finally we execute the class (call it a rudimentary constructor)
	 */
	this.init();
}


$(function(){
	var config = {
		visualizer : 'visualizer',
		haveMask : true,
		canvas_width : '100%',
		canvas_height : '100%',
		enableLog : true
	}
	new XBCAudioVisualizer(config);	
})