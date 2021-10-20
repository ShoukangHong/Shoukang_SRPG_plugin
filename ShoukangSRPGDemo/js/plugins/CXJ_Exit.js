/******************************************************************************
 * CXJ_Exit.js                                                                *
 ******************************************************************************
 * Exit v1.0.1                                                                *
 * By G.A.M. Kertopermono, a.k.a. GaryCXJk                                    *
 * License: CC0 1.0 Universal                                                 *
 *          https://creativecommons.org/publicdomain/zero/1.0/                *
 ******************************************************************************/
var Imported = Imported || {};
Imported.CXJ_Exit = "1.0.1";

/*:
 * @plugindesc Adds an exit option to desktop versions of the game
 * @author G.A.M. Kertopermono
 *
 * @param Text - Exit
 * @desc Term for exit game from Title Screen menu
 * @default Exit
 *
 * @param Text - To Desktop
 * @desc Term for exit game from Game End menu
 * @default Exit
 *
 * @param Add to title
 * @type boolean
 * @on YES
 * @off NO
 * @desc Add the exit option to the title screen?
 * NO - false     YES - true
 * @default true
 *
 * @param Add to Game End
 * @type boolean
 * @on YES
 * @off NO
 * @desc Add the exit option to the Game End window?
 * NO - false     YES - true
 * @default true
 *
 * @help
 * ============================================================================
 * = About                                                                    =
 * ============================================================================
 *
 * As you all know HTML5 games don't generally need exit buttons. Neither do
 * mobile versions, as you can just Back or Home your way out. But with desktop
 * that's a whole different thing. You do want to get out without having to
 * resort to using CTRL+F4 or something similar.
 *
 * This plugin adds this option to both the title screen as well as the Game
 * End option.
 *
 * ============================================================================
 * = Usage                                                                    =
 * ============================================================================
 *
 * After you add the plugin, you can set the parameters. They're pretty much
 * self-explanatory. "Text - Exit" and "Text - To Desktop" are the text labels
 * for each respective button. The first appears in the title screen, the
 * latter in the Game End window.
 *
 * "Add to title" and "Add to Game End" both are boolean values, and determine
 * whether or not the new buttons should be added.
 *
 * On non-desktop browsers the game won't add the exit options. They could be
 * made visible, but they don't work, so it's pretty useless to keep them.
 * 
 * ============================================================================
 * = Plugin Commands                                                          =
 * ============================================================================
 *
 * This plugin contains Plugin Commands. These are as followed:
 *
 * Exit
 * ----
 * Exits the game. This can be executed for both desktop and browser-based
 * clients, but it would only work on desktop.
 *
 * ============================================================================
 * = Compatibility                                                            =
 * ============================================================================
 * 
 * This plugin overwrites the functions listed below, but still uses the old
 * version, either as the basis for the function or as a fallback. It is
 * advised to place this script below other scripts that use these functions.
 *
 * - Scene_Title.prototype.createCommandWindow
 * - Window_TitleCommand.prototype.makeCommandList
 * - Scene_GameEnd.prototype.createCommandWindow
 * - Window_GameEnd.prototype.makeCommandList
 * - Game_Interpreter.prototype.pluginCommand
 *
 * ============================================================================
 * = Changelog                                                                =
 * ============================================================================
 *
 * 1.0.2 (2018-07-30)
 * ------------------
 *
 * * Easier choice using feature from latest MV
 *
 * 1.0.1 (2015-10-27)
 * ------------------
 *
 * * Added script rename fallback
 *
 * 1.0.0 (2015-10-26)
 * ------------------
 *
 * * Initial release
 *
 * ============================================================================
 * = License                                                                  =
 * ============================================================================
 *
 * CC0 1.0 Universal (CC0 1.0)
 * Public Domain Dedication
 *
 * The person who associated a work with this deed has dedicated the work to
 * the public domain by waiving all of his or her rights to the work worldwide
 * under copyright law, including all related and neighboring rights, to the
 * extent allowed by law.
 *
 * You can copy, modify, distribute and perform the work, even for commercial
 * purposes, all without asking permission.
 *
 * https://creativecommons.org/publicdomain/zero/1.0/
 * ============================================================================
 */
 
+function() {
  if(Utils.isNwjs()) {
    var pluginName = 'CXJ_Exit';
    var _propNames = ['Text - Exit', 'Text - To Desktop', 'Add to title', 'Add to Game End'];
    var _defaultParams = {
      'Text - Exit' : 'Exit',
      'Text - To Desktop' : 'To Desktop',
      'Add to title' : 'true',
      'Add to Game End' : 'true'
    };

    var _getParameters = function(pluginName, propNames, defaultParams) {
      
      /* Private function that checks plugin content */
      var _checkPluginContent = function(parameters) {
        for(var prop in parameters) {
          if(parameters.hasOwnProperty(prop)) {
            return true;
          }
        }
        return false;
      }
      
      var parameters = PluginManager.parameters(pluginName);
      
      if(_checkPluginContent(parameters)) {
        return parameters;
      }
      var currentScript = document.currentScript;
      if(currentScript) {
        var scriptName = document.currentScript.src;
        scriptName = scriptName.substr(scriptName.indexOf('js/plugins/') + 11);
        scriptName = scriptName.substr(0, scriptName.lastIndexOf('.js'));
        parameters = PluginManager.parameters(scriptName);
      }
      
      if(_checkPluginContent(parameters)) {
        return parameters;
      }

      for(var idx = 0; idx < $plugins.length; idx++) {
        var plugin = $plugins[idx];
        var params = plugin.parameters;
        if(plugin.description.indexOf('<' + pluginName + '>') > -1) {
          return params;
        }
        var hasFound = true;
        for(var idx = 0; idx < _propNames.length; idx++) {
          if(!params.hasOwnProperty(propNames[idx])) {
            hasFound = false;
            break;
          }
        }
        if(hasFound) {
          return params;
        }
      }
      return _defaultParams;
    }
    
    var parameters = _getParameters(pluginName, _propNames, _defaultParams);
    
    TextManager.cxjExit = parameters['Text - Exit'];
    TextManager.cxjToDesktop = parameters['Text - To Desktop'];
    
    /*----------------*
     *- Title screen -*
     *----------------*/
    if(parameters['Add to title'].toLowerCase() != 'false') {
      +function() {
        var oldCreateCommandWindow = Scene_Title.prototype.createCommandWindow;
        Scene_Title.prototype.createCommandWindow = function() {
          oldCreateCommandWindow.apply(this, arguments);
          this._commandWindow.setHandler('exit',  this.commandExit.bind(this));
        }
        
        Scene_Title.prototype.commandExit = function() {
          this._commandWindow.close();
          this.fadeOutAll();
          SceneManager.exit();
        }
        
        var oldMakeCommandList = Window_TitleCommand.prototype.makeCommandList;
        Window_TitleCommand.prototype.makeCommandList = function() {
          oldMakeCommandList.apply(this, arguments);
          this.addCommand(TextManager.cxjExit, 'exit');
        }
      }();
    }
    
    /*------------*
     *- Game End -*
     *------------*/
     
    if(parameters['Add to Game End'].toLowerCase() != 'false') {
      +function() {
        var oldCreateCommandWindow = Scene_GameEnd.prototype.createCommandWindow;
        Scene_GameEnd.prototype.createCommandWindow = function() {
          oldCreateCommandWindow.call(this);
          this._commandWindow.setHandler('exit',  this.commandExit.bind(this));
        }
        
        Scene_GameEnd.prototype.commandExit = function() {
          this._commandWindow.close();
          this.fadeOutAll();
          SceneManager.exit();
        }
        
        var oldMakeCommandList = Window_GameEnd.prototype.makeCommandList;
        Window_GameEnd.prototype.makeCommandList = function() {
          oldMakeCommandList.call(this);
          for(var idx = 0; idx < this._list.length; idx++) {
            if(this._list[idx].symbol == 'cancel') {
              this._list.splice(idx, 0, {name: TextManager.cxjToDesktop, symbol: 'exit', enabled: true, ext: null});
              break;
            }
          }
        }
      }();
    }
    
    /*------------------*
     *- Plugin Command -*
     *------------------*/

    +function() {
      var oldPluginCommand = Game_Interpreter.prototype.pluginCommand;
      Game_Interpreter.prototype.pluginCommand = function(command, args) {
        oldPluginCommand.call(this, command, args);
        if (command === 'Exit') {
          SceneManager.exit();
        }
      };
    }();
  }
}();