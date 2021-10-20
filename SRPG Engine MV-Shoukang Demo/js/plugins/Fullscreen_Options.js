/*=============================================================================
 *  Fullscreen_Options.js
 *=============================================================================*/

/*:=============================================================================
* @plugindesc v1.1 Add fullscreen option, force fullscreen in Stretch Mode and disable F3.
* @author Krimer
*
* @param fullscreenOptionName
* @desc Fullscreen option name 
* Default: Fullscreen
* @default Fullscreen
* 
* @param forceFullscreen
* @desc Force fullscreen during first game start? true or false Default: false
* @default true
*
* @param Add command to option?
* @desc Add command to option menu? true or false Default: false
* @default true
*
* @param Disable F3?
* @desc Disable F3? and force Stretch Mode by default. true or false Default: false
* @default true
*
* @param Disable F4?
* @desc true or false Default: false
* @default false
*
* @help
* "config.rpgsave" from "save" folder must be deleted to perform clean
* first start. 
* After clean first start the "config.rpgsave" would be created 
* and all changes in 'Options' would be saved there.
* =============================================================================*/

(function() {
	
	var parameters = PluginManager.parameters('Fullscreen_Options');
	var fullscreenOptionName = String(parameters['fullscreenOptionName']) || 'Fullscreen';
	var forceFullscreen = String(parameters['forceFullscreen']);
	var fullscreenOptionCommand = String(parameters['Add command to option?']) === 'true' ? true : false;
	var disable_F3 = String(parameters['Disable F3?']) === 'true' ? true : false;
	var disable_F4 = String(parameters['Disable F4?']) === 'true' ? true : false;
	
	/* Alias */
	var _ConfigManager_makeData_Alias = ConfigManager.makeData;
	ConfigManager.makeData = function() {
		var config = _ConfigManager_makeData_Alias.call(this);
		config.callFullscreen = this.callFullscreen;
		return config;
	};

	/* Alias */
	var _ConfigManager_applyData_Alias = ConfigManager.applyData;
	ConfigManager.applyData = function(config) {
		this.callFullscreen = this.readFlag(config, 'callFullscreen');
		_ConfigManager_applyData_Alias.call(this, config);
	};

	/* Alias */
	_Graphics_defaultStretchMode_Alias = Graphics._defaultStretchMode;
	Graphics._defaultStretchMode = function() {
		if (disable_F3 == true){
			return true
		} else {
			_Graphics_defaultStretchMode_Alias.call(this)
		}
	};

	/* Overwrite */
	Graphics._onKeyDown = function(event) {
		if (!event.ctrlKey && !event.altKey) {
			switch (event.keyCode) {
			case 114:   /* F2 */
				event.preventDefault();
				this._switchFPSMeter();
				break;
			case 113:   /* F3 */
				if (disable_F3 == true) return;
				event.preventDefault();
				this._switchStretchMode();
				break;
			case 115:   /* F4 */
				if (disable_F4 == true) return;
				event.preventDefault();
				this._switchFullScreen();
				break;
			}
		}
	};

	/* Alias */
	var _Scene_Title_start_Alias = Scene_Title.prototype.start;
	Scene_Title.prototype.start = function() {
		if (ConfigManager.callFullscreen && StorageManager.exists(-1)) {
			Graphics._requestFullScreen();
		} else if (!ConfigManager.callFullscreen && StorageManager.exists(-1)) {
			Graphics._cancelFullScreen();
		}
		if (!StorageManager.exists(-1) &&  eval(forceFullscreen)){
			Graphics._switchFullScreen();
			ConfigManager.callFullscreen = eval(forceFullscreen);
		}
		ConfigManager.save();
		_Scene_Title_start_Alias.call(this)
	};
	

	/* Alias */
	var _Window_Options_addGeneralOptions_Alias = Window_Options.prototype.addGeneralOptions;
	Window_Options.prototype.addGeneralOptions = function() {
		if (fullscreenOptionCommand == true) {
			this.addCommand(fullscreenOptionName, 'callFullscreen');
		}
		_Window_Options_addGeneralOptions_Alias.call(this);
	};

	/* Alias */
	var _Window_Options_processOk_Alias = Window_Options.prototype.processOk;
	Window_Options.prototype.processOk = function() {
		_Window_Options_processOk_Alias.call(this)
		var index = this.index();
		var symbol = this.commandSymbol(index);
		if (ConfigManager.callFullscreen && symbol == "callFullscreen") {
                        event.preventDefault();
                        this._switchFullScreen();
			//Graphics._requestFullScreen();
		} else if (!ConfigManager.callFullscreen && symbol == "callFullscreen") {
			Graphics._cancelFullScreen();
		}
	};
})();