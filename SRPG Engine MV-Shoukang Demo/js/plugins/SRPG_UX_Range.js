//-----------------------------------------------------------------------------
// copyright 2019 Doktor_Q all rights reserved.
// Released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc SRPG visual overhaul of move and attack ranges
 * @author Dr. Q
 *
 * @param Range Image
 * @parent Use Range Images
 * @desc Image set for move and attack ranges
 * @require 1
 * @dir img/system/
 * @type file
 * @default srpgRange
 *
 * @param Range Frames
 * @parent Range Image
 * @desc Number of animation frames for ranges
 * @type number
 * @min 1
 * @default 1
 *
 * @param Range Frame Delay
 * @parent Range Image
 * @desc Number of frames spent on each animation frame
 * @type number
 * @min 1
 * @default 40
 *
 * @param Range Blend Mode
 * @parent Range Image
 * @desc Blend mode for move and attack ranges
 * @type select
 * @option Normal
 * @value 0
 * @option Add
 * @value 1
 * @option Multiply
 * @value 2
 * @option Screen
 * @value 3
 * @default 1
 *
 * @param Range Opacity Eval
 * @parent Range Image
 * @desc Calculates opacity during animation
 * You can use 'frame' and 'max' in the equations
 * @type string
 * @default 0.55 * (max - frame) / max
 *
 * @param Range Layer
 * @parent Range Image
 * @desc Whether the ranges appear above or below events
 * @type select
 * @option Below All Events
 * @value 0
 * @option Below Player
 * @value 2
 * @option Above Player
 * @value 4
 * @option Above All Events
 * @value 6
 * @default 2
 *
 * @help
 * Replace the movement and attack range indicators with images you can customize
 */

(function(){
	var parameters = PluginManager.parameters('SRPG_UX_Range');

	var _rangeImages = !!eval(parameters['Use Range Images']);
	var _rangeFileName = parameters['Range Image'] || "srpgRange";
	var _rangeFrames = Number(parameters['Range Frames']) || 1;
	var _rangeDelay = Number(parameters['Range Frame Delay']) || 10;
	var _rangeBlendMode = Number(parameters['Range Blend Mode']) || 0;
	var _rangeOpacity = parameters['Range Opacity Eval'] || "1.0";
	var _rangeLayer = Number(parameters['Range Layer']) || 0;

//====================================================================
// Sprite_SrpgMoveTile
//====================================================================

	Sprite_SrpgMoveTile._bitmap = ImageManager.loadSystem(_rangeFileName);

	var _srpgMoveTile_initialize = Sprite_SrpgMoveTile.prototype.initialize;
	Sprite_SrpgMoveTile.prototype.initialize = function() {
		_srpgMoveTile_initialize.call(this);
		this.z = _rangeLayer;
	};

	Sprite_SrpgMoveTile.prototype.setThisMoveTile = function(x, y, attackFlag) {
		this._frameCount = 0;
		this._posX = x;
		this._posY = y;
		this._attack = attackFlag;
	};

	Sprite_SrpgMoveTile.prototype.createBitmap = function() {
		this.bitmap = Sprite_SrpgMoveTile._bitmap;
		this.anchor.x = 0.5;
		this.anchor.y = 0.5;
		this.blendMode = _rangeBlendMode;
	};

	Sprite_SrpgMoveTile.prototype.updateAnimation = function() {
		this._frameCount++;
		this._frameCount %= _rangeFrames * _rangeDelay;

		var w = this.bitmap.width / _rangeFrames;
		var h = this.bitmap.height / 3;
		var x = Math.floor(this._frameCount / _rangeDelay);
		var y = this._attack ? 1 : 0;
		this.setFrame(x*w, y*h, w, h);

		var frame = this._frameCount;
		var max = Math.max(_rangeFrames * _rangeDelay, 1);
		this.opacity = 255 * Number(eval(_rangeOpacity));
	};

//====================================================================
// Sprite_SrpgAoE (alters AoE display if SRPG_AoE is in use)
//====================================================================

	if (window.Sprite_SrpgAoE) {
		var _srpgAoE_initialize = Sprite_SrpgAoE.prototype.initialize;
		Sprite_SrpgAoE.prototype.initialize = function() {
			_srpgAoE_initialize.call(this);
			this.z = _rangeLayer;
		};

		Sprite_SrpgAoE.prototype.drawCell = function(bitmap, x, y, tileWidth, tileHeight) {
			var src = Sprite_SrpgMoveTile._bitmap;
			var w = src.width / _rangeFrames;
			var h = src.height / 3;
			var f = Math.floor(this._frameCount / _rangeDelay);
			var xOff = (tileWidth-w)/2;
			var yOff = (tileHeight-h)/2;
			bitmap.bltImage(src, f*w, 2*h, w, h, x+xOff, y+yOff, w, h);
		};

/*		Sprite_SrpgAoE.prototype.updateAnimation = function() {
			var oldFrame = Math.floor(this._frameCount / _rangeDelay);
			this._frameCount++;
			this._frameCount %= _rangeFrames * _rangeDelay;
			var newFrame = Math.floor(this._frameCount / _rangeDelay);

			var frame = this._frameCount;
			var max = Math.max(_rangeFrames * _rangeDelay, 1);
			this.opacity = 255 * Number(eval(_rangeOpacity));
			if (oldFrame != newFrame) this.redrawArea(this._size, this._minSize, this._type, this._dir);
		};
*/
		var _setAoE = Sprite_SrpgAoE.prototype.setAoE;
		Sprite_SrpgAoE.prototype.setAoE = function(x, y, size, minSize, type, dir) {
			_setAoE.call(this, x, y, size, minSize, type, dir);
			this.blendMode = _rangeBlendMode;
		};
	}

})();