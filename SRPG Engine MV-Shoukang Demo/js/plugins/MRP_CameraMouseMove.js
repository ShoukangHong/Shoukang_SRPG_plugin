//=============================================================================
// Camera Mouse Move
// MRP_CameraMouseMove.js
// By Magnus0808 || Magnus Rubin Peterson
// Version 1.1.1
//=============================================================================
/*:
 * @plugindesc Camera moves when the mouse is at edge of screen.
 * @author Magnus0808
 *
 * @help Plug and play for default settings.
 * You can use the middle mouse button to use the dragging movement function.
 *
 * The following plugin command can be used to turn off/on the plugin:
 * CameraMouseMove On/Off/Toggle (depending on what you want)
 *
 * You can also turn off/on the dragging function:
 * CameraMouseMove On/Off/Toggle drag (depending on what you want)
 
 * @param Dragging Movement
 * @type Boolean
 * @desc Set to true to enable dragging movement
 * @default true  
 *
 * @param Border Distance
 * @type Number
 * @desc The distance the mouse should be from the border to move the camera.
 * @default 50
 *
 * @param Move Speed
 * @type Number
 * @decimals 2
 * @desc The speed the camera will move with when the mouse is by the border.
 * @default 0.20
 *
 * @param Always Show Player Move
 * @type Boolean
 * @desc If true then when the player moves the camera will always show it.
 * @default true
*/

 var Imported = Imported || {};
 Imported.MRP_CameraMouseMove = true;
 
 var MRP = MRP || {};
 MRP.CameraMouseMove = MRP.CameraMouseMove ||{};

(function(){
	
	MRP.CameraMouseMove.Parameters = PluginManager.parameters('MRP_CameraMouseMove');
	MRP.CameraMouseMove.on = true;
	MRP.CameraMouseMove.dragOn = (String(MRP.CameraMouseMove.Parameters['Dragging Movement']) == 'true');
	MRP.CameraMouseMove.borderDistance = Number(MRP.CameraMouseMove.Parameters['Border Distance']);
	MRP.CameraMouseMove.moveSpeed = Number(MRP.CameraMouseMove.Parameters['Move Speed']);
	MRP.CameraMouseMove.playerCenter = (String(MRP.CameraMouseMove.Parameters['Always Show Player Move']) == 'true');
	
	MRP.CameraMouseMove.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		MRP.CameraMouseMove.Game_Interpreter_pluginCommand.call(this, command, args)
		
		if (command === 'CameraMouseMove'){
			switch(args[0].toLowerCase()){
				case "on":
					if(args[1] && args[1].toLowerCase() == "drag") MRP.CameraMouseMove.dragOn = true;
					else MRP.CameraMouseMove.on = true;
					break;
				case "off":
					if(args[1] && args[1].toLowerCase() == "drag") MRP.CameraMouseMove.dragOn = false;
					else MRP.CameraMouseMove.on = false;
					break;
				case "toggle":
					if(args[1] && args[1].toLowerCase() == "drag") MRP.CameraMouseMove.dragOn = !MRP.CameraMouseMove.dragOn;
					else MRP.CameraMouseMove.on = !MRP.CameraMouseMove.on;
					break;
			}
		}
	};
	
	MRP.CameraMouseMove.Game_Map_update = Game_Map.prototype.update;
	Game_Map.prototype.update = function(sceneActive) {
		MRP.CameraMouseMove.Game_Map_update.call(this, sceneActive);
		this.updateCamera();
	};
	
	Game_Map.prototype.updateCamera = function(){
		if($gameTemp._withinBorderDistance) $gameTemp._withinBorderDistance = TouchInput.isMouseInCameraBoarder();
		if(MRP.CameraMouseMove.dragOn && TouchInput._middlePressed){
			var mouseX = TouchInput._mouseX;
			var mouseY = TouchInput._mouseY;
			
			if($gameTemp._oldMouseX && $gameTemp._oldMouseY){
				var moveX = (mouseX - $gameTemp._oldMouseX) / PIXI.ticker.shared.FPS;
				var moveY = (mouseY - $gameTemp._oldMouseY) / PIXI.ticker.shared.FPS;
				moveX < 0 ? this.scrollRight(Math.abs(moveX)) : this.scrollLeft(Math.abs(moveX));
				moveY < 0 ? this.scrollDown(Math.abs(moveY)) : this.scrollUp(Math.abs(moveY));
				
			}
			
			$gameTemp._oldMouseX = mouseX;
			$gameTemp._oldMouseY = mouseY;
		} else if(MRP.CameraMouseMove.on && !$gameTemp._withinBorderDistance) {
			var mouseX = TouchInput._mouseX;
			var mouseY = TouchInput._mouseY;
			
			if(mouseX < MRP.CameraMouseMove.borderDistance) this.scrollLeft(MRP.CameraMouseMove.moveSpeed);
			if(mouseY < MRP.CameraMouseMove.borderDistance) this.scrollUp(MRP.CameraMouseMove.moveSpeed);
			if(mouseX > Graphics.boxWidth - MRP.CameraMouseMove.borderDistance) this.scrollRight(MRP.CameraMouseMove.moveSpeed);
			if(mouseY > Graphics.boxHeight - MRP.CameraMouseMove.borderDistance) this.scrollDown(MRP.CameraMouseMove.moveSpeed);
			
			$gameTemp._oldMouseX = false;
			$gameTemp._oldMouseY = false;
		} else {
			$gameTemp._oldMouseX = false;
			$gameTemp._oldMouseY = false;
		}
	}
	
	MRP.CameraMouseMove.TouchInput__onMiddleButtonDown = TouchInput._onMiddleButtonDown;
	TouchInput._onMiddleButtonDown = function(event) {
		MRP.CameraMouseMove.TouchInput__onMiddleButtonDown.call(this, event);
		this._middlePressed = true;
	};
	
	MRP.CameraMouseMove.TouchInput__onMouseUp = TouchInput._onMouseUp;
	TouchInput._onMouseUp = function(event) {
		MRP.CameraMouseMove.TouchInput__onMouseUp.call(this, event);
		if (event.button === 1) {
			if(this.isMouseInCameraBoarder()) $gameTemp._withinBorderDistance = true;
			this._middlePressed = false;
		}
	};
	
	TouchInput.isMouseInCameraBoarder = function(){
			var mouseX = TouchInput._mouseX;
			var mouseY = TouchInput._mouseY;
			return (mouseX < MRP.CameraMouseMove.borderDistance || 
					mouseY < MRP.CameraMouseMove.borderDistance ||
					mouseX > Graphics.boxWidth - MRP.CameraMouseMove.borderDistance ||
					mouseY > Graphics.boxHeight - MRP.CameraMouseMove.borderDistance);
	}
	
	MRP.CameraMouseMove.Game_Player_updateScroll = Game_Player.prototype.updateScroll;
	Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
		MRP.CameraMouseMove.Game_Player_updateScroll.call(this, lastScrolledX, lastScrolledY);	
		if(MRP.CameraMouseMove.playerCenter && this.isMoving()){
			if(this._realX + 1 < $gameMap._displayX) {
				$gameMap.scrollLeft($gameMap._displayX + this.centerX() - this._realX);
			}
			if(this._realX - 1 > $gameMap._displayX + this.centerX() * 2) {
				$gameMap.scrollRight(this._realX - $gameMap._displayX + this.centerX() * 2);
			}
			if(this._realY + 1 < $gameMap._displayY) {
				$gameMap.scrollUp($gameMap._displayY + this.centerY() - this._realY);
			}
			if(this._realY -1 > $gameMap._displayY + this.centerY() * 2) {
				$gameMap.scrollDown(this._realY - $gameMap._displayY + this.centerY() * 2);
			}	
		}
		
	};
	
	MRP.CameraMouseMove.TouchInput__onMouseMove = TouchInput._onMouseMove;
	TouchInput._onMouseMove = function(event) {
		MRP.CameraMouseMove.TouchInput__onMouseMove.call(this, event);
		this._mouseX = Graphics.pageToCanvasX(event.pageX);
		this._mouseY = Graphics.pageToCanvasY(event.pageY);
	};
	
})();