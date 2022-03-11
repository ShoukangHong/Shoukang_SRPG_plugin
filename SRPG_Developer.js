//====================================================================================================================
// SRPG_Developer.js Provide fast game flow and SRPG battle log
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit     v1.00 First release
//====================================================================================================================
/*:
 * @plugindesc Allow you to skip animation, accelerate move and window(message). Add SRPG battle review.
 * @author Shoukang
 *
 * @help
 *
 * This plugin will add developer commands in Options Window.
 * New Options:
 * FPS                      Change FPS, this works without developer mode.
 * Developer Mode           Turn on/off developer mode. If it's off options below will not have any effect.
 * Accelerate Only SRPG     Only enable acceleration and skip animation on srpg mode
 * Skip Animation           Turn on/off animation(not guarenteed to turn of all animation)
 * Accelerate Window        Choose window speed(including message window)
 * Accelerate Move          Choose move speed
 * 
 * Key command in Developer Mode:
 * D: Decrease FPS
 * F: Fasten FPS
 * 1-9: Choose the corresponding choice in the current command window.
 *
 * Key command in Developer Mode and SRPG Battle:
 * H: Go to the beginning of SRPG Battle
 * J: Go to previous action/move
 * K: Go to next action/move
 * L: Return the current stage of SRPG Battle
 * A: Turn On Constant Auto Battle.
 * S: Stop Constant Auto Battle. (If it happens to freeze the battle, press A again)
 * D: Decrease FPS
 * F: Fasten FPS
 * 1-9: Choose the corresponding choice in the current command window.
 *
 * IMPORTANT facts about SRPG Battle Log: 
 * You should never use Battle log to trace back and play.
 * It only displays history info but can't restore battler's hp, mp, states, or variables, events, etc.
 * Therefore, always press L before you continue the battle.
 *
 * Script call:
 * $gameSystem.developerMode            return ture if is developer mode and false if not. Otherwise return false.
 * $gameSystem.isDeveloperSRPGMode()    return ture if is developer mode and is SRPG Mode. Otherwise return false.
 * 
 * this.developerModeBreak()    Will end event processing and force actor turn in Developer mode.
 * This can be used to review extremely fast auto SRPG battle. Press A to continue auto battle.
 * ==========================================================================================================================
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * Place it below all the other SRPG and Dynamic action/motion/map plugins.
 * Recommended to use with SRPG_BattleResultAutoClose to accelerate battles.
 * Work with 1.32Q and my demo. Need SRPG_AOE.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_Developer');

    var coreParams = PluginManager.parameters('SRPG_core');
    var _srpgAutoBattleStateId = Number(coreParams['srpgAutoBattleStateId'] || 14);

    // =====================================
    // Overwrite functions for hotkey
    // =====================================
    var _maxFPS = 1000;
    var _baseFPS = 60;
    var _fpsOptions = [60, 90, 120, 180, 240, 360, 480, 600, 720, 960];
    var _options = ['srpgOnly', 'skipAnimation', 'accelerateWindow', 'accelerateMove'];

    Game_Interpreter.prototype.developerModeBreak = function(){
        if (!$gameSystem.isDeveloperSRPGMode()) return;
        this.command115();
        $gameSystem.setBattlePhase('actor_phase');
        $gameSystem.setSubBattlePhase('normal');
    };

    SceneManager.changeFPS = function(val) {
        var idx = _fpsOptions.indexOf(Math.round(1/SceneManager._deltaTime));
        if (idx === -1) idx = 0;
        this._deltaTime = 1/(_fpsOptions[(idx + _fpsOptions.length + val)%_fpsOptions.length]);
        return this._deltaTime;
    }

    Object.defineProperty(ConfigManager, '_deltaTime', {
        get: function() { return SceneManager['_deltaTime']},
        set: function(value) {SceneManager['_deltaTime'] = value},
        configurable: true
    });

    Object.defineProperty(ConfigManager, 'developerMode', {
        get: function() { return $gameSystem['developerMode']},
        set: function(value) {$gameSystem.changeDeveloperMode()},
        configurable: true
    });

    _options.forEach(function(key){
        Object.defineProperty(ConfigManager, key, {
            get: function() { return $gameSystem[key]},
            set: function(value) {$gameSystem[key] = value},
            configurable: true
        });
    });

    var _Window_Options_statusText = Window_Options.prototype.statusText
    Window_Options.prototype.statusText = function(index) {
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if ('_deltaTime' == symbol){
            return Math.round(1/value);
        } if (['accelerateWindow', 'accelerateMove'].contains(symbol)){
            return ['OFF', 'Low', 'High', 'Max'][value || 0];
        } else {
            return _Window_Options_statusText.call(this, index);
        }
    };

    var _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand('FPS', '_deltaTime');
        this.addCommand('Developer Mode', 'developerMode');
        this.addCommand('Accelerate Only SRPG', 'srpgOnly');
        this.addCommand('Skip Animation', 'skipAnimation');
        this.addCommand('Accelerate Window', 'accelerateWindow');
        this.addCommand('Accelerate Move', 'accelerateMove');
    };

    var _Window_Options_processOk = Window_Options.prototype.processOk
    Window_Options.prototype.processOk = function() {
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        if (symbol == '_deltaTime'){
            value = SceneManager.changeFPS(1);
            SceneManager.changeFPS(-1);
            this.changeValue(symbol, value);
        } else if (['accelerateWindow', 'accelerateMove'].contains(symbol)) {
            value = (1 + (value||0)) % 4 // (0:normal, 1: fast, 2: very fast, 3: instant)
            this.changeValue(symbol, value);
        } else {
            _Window_Options_processOk.call(this);
        }
    };

    var _Window_Selectable_open = Window_Selectable.prototype.open;
    Window_Selectable.prototype.open = function(){
        _Window_Selectable_open.call(this);
        $gameTemp.currentWindow = this;
    }

    var _Window_Selectable_show = Window_Selectable.prototype.show;
    Window_Selectable.prototype.show = function(){
        _Window_Selectable_show.call(this);
        $gameTemp.currentWindow = this;
    }

    var _Window_Selectable_activate = Window_Selectable.prototype.activate;
    Window_Selectable.prototype.activate = function(){
        _Window_Selectable_activate.call(this);
        $gameTemp.currentWindow = this;
    }

    var _Input_onKeyDown = Input._onKeyDown
    Input._onKeyDown = function(event) {
        if (window.$gameSystem && $gameSystem.developerMode){
            if ($gameSystem.isDeveloperSRPGMode() && event.keyCode === 83) {    //Stop Auto battle S
                return $gameTemp.turnOffConstandAutoBattle();
            }

            if (event.keyCode === 68){ // decrease FPS D
                SceneManager.changeFPS(-1);
                return;
            } else if (event.keyCode === 70){ // Fasten FPS F
                var time = SceneManager._deltaTime;
                SceneManager.changeFPS(1);
                return;
            }

            if ($gameTemp.currentWindow && $gameTemp.currentWindow.select && $gameTemp.currentWindow.isOpenAndActive()){
                for (var i = 1; i < 10; i++){
                    if (event.keyCode === 48 + i) {    //Number key i (1-9)
                        $gameTemp.currentWindow.select(i - 1);
                        $gameTemp.currentWindow.processOk();
                        return;
                    }
                }
            }

            if ($gameSystem.isDeveloperSRPGMode() && $gameSystem.isBattlePhase() == 'actor_phase' 
                && $gameSystem.isSubBattlePhase() === 'normal' && $gamePlayer.canMove()
                && SceneManager._scene instanceof Scene_Map){

                if (event.keyCode === 65) {    //Auto battle(Until break) A
                    return $gameTemp.turnOnConstandAutoBattle();
                } else if (event.keyCode === 74) {    //prev action J
                    return $gameTemp.prevLogAction();
                } else if (event.keyCode === 75) {    //next action K
                    return $gameTemp.nextLogAction();
                } else if (event.keyCode === 72) {    //to first log H
                    return $gameTemp.toFirstLog();
                } else if ($gameTemp.isLogMod()){ //end log L or any key
                    return $gameTemp.endLog();
                } else if (event.keyCode === 82) {    //Reload R, not available yet

                }
            }
        }
        _Input_onKeyDown.call(this, event);
    };

    // =====================================
    // Overwrite functions for log
    // =====================================
    Scene_Map.prototype.createDeveloperLogWindow = function() {
        this._developerLogWindow = new Window_BattleLog();
        this.addWindow(this._developerLogWindow);
        this._developerLogWindow.hide();
    };

    var _SRPG_MB_SceneMap_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _SRPG_MB_SceneMap_create.call(this);
        $gameTemp.developerSpritesNeedRefresh = $gameSystem.isDeveloperSRPGMode();
    };
    
    var _SRPG_MB_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_MB_SceneMap_update.call(this);
        if ($gameSystem.isDeveloperSRPGMode() && $gameTemp.developerSpritesNeedRefresh !== false){
            $gameTemp.currentLog().createData();
            $gameTemp.developerSpritesNeedRefresh = false;
        }
    };

    var _Scene_Map_srpgBattleStart = Scene_Map.prototype.srpgBattleStart
    Scene_Map.prototype.srpgBattleStart = function(actionArray, targetArray) {
        if ($gameSystem.isDeveloperSRPGMode()){
            $gameTemp.currentLog().addBattle(actionArray[1], targetArray[1]);
        }
        _Scene_Map_srpgBattleStart.call(this, actionArray, targetArray);
    }

    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        this.createDeveloperLogWindow();
        _SRPG_SceneMap_createAllWindows.call(this);
    };

    var _Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        _Scene_Map_srpgAfterAction.call(this);
        if ($gameTemp.constandAutoBattle() === false){
            $gameTemp._constandAutoBattle = undefined;
            if ($gameSystem.isBattlePhase() == 'auto_actor_phase'){
                $gameSystem.setBattlePhase('actor_phase');
                $gameSystem.setSubBattlePhase('normal');
            }
            $gameMap.events().forEach(function(event){
                var actor = $gameSystem.EventToUnit(event.eventId());
                if (actor && actor[1] && actor[1].isActor()) {
                    actor[1].removeState(_srpgAutoBattleStateId);
                }
            });
        }

        if ($gameTemp.constandAutoBattle()){
            $gameTemp.setTurnEndFlag(true);
            $gameTemp.setAutoBattleFlag(true);
            $gameMap.events().forEach(function(event){
                var actor = $gameSystem.EventToUnit(event.eventId());
                if (actor && actor[1] && actor[1].isActor()) {
                    actor[1].addState(_srpgAutoBattleStateId);
                }
            })
        }

        if ($gameSystem.isDeveloperSRPGMode() && battler.battleMode() !== 'stand') $gameTemp.pushDeveloperLog(new SRPG_Log());
    };

    var _Game_Temp_initialize = Game_Temp.prototype.initialize 
    Game_Temp.prototype.initialize = function() {
        _Game_Temp_initialize.call(this);
        this.initDeveloperLog();
    };

    var _Game_System_endSRPG = Game_System.prototype.endSRPG
    Game_System.prototype.endSRPG = function() {
        _Game_System_endSRPG.call(this);
        $gameTemp.initDeveloperLog();
    };

    var _Game_Event_srpgMoveRouteForce = Game_Event.prototype.srpgMoveRouteForce
    Game_Event.prototype.srpgMoveRouteForce = function(route) {
        _Game_Event_srpgMoveRouteForce.call(this, route);
        if ($gameSystem.isDeveloperSRPGMode()){
            $gameTemp.currentLog().addMove(this, $gameSystem.EventToUnit(this.eventId())[1],route)
        }
    };

    Window_BattleLog.prototype.actionToText = function(subject, item) {
        if (DataManager.isSkill(item)) {
            if (item.message1) {
               return subject.name() + item.message1.format(item.name);
            }
            if (item.message2) {
                return item.message2.format(item.name);
            }
        } else {
            return TextManager.useItem.format(subject.name(), item.name);
        }
        return ''
    };

    // =====================================
    // Overwrite functions for speed
    // =====================================
    var _Scene_Map_srpgInvokeMapSkill = Scene_Map.prototype.srpgInvokeMapSkill;
    Scene_Map.prototype.srpgInvokeMapSkill = function(data){
        _Scene_Map_srpgInvokeMapSkill.call(this, data);
        if ($gameSystem.canAccelerateAnimation()) this._waitCount = 0;
    }

    var _Scene_Map_setSkillWait = Scene_Map.prototype.setSkillWait
    Scene_Map.prototype.setSkillWait = function(time) {
        _Scene_Map_setSkillWait.call(this, time);
        if ($gameSystem.canAccelerateAnimation()) this._skillWait = 0;
    };

    var _Game_Screen_startShake = Game_Screen.prototype.startShake
    Game_Screen.prototype.startShake = function(power, speed, duration) {
        _Game_Screen_startShake.call(this, power, speed, duration)
        this._shakeDuration = 0;
    };

    var _Game_Message_scrollSpeed = Game_Message.prototype.scrollSpeed
    Game_Message.prototype.scrollSpeed = function() {
        if ($gameSystem.canAccelerateWindow()){
            return Math.pow(2, $gameSystem.accelerateWindow) * this._scrollSpeed;
        }
        _Game_Message_scrollSpeed.call(this);
    };

    var _Window_Base_processCharacter = Window_Base.prototype.processCharacter
    Window_Base.prototype.processCharacter = function(textState) {
        if ($gameSystem.canAccelerateWindow()){
            for (var i = 0; i < Math.pow(2, $gameSystem.accelerateWindow * 2 - 1); i++){
                if (textState.index >= textState.text.length) break;
                _Window_Base_processCharacter.call(this, textState);
            }
        } else {
            _Window_Base_processCharacter.call(this, textState);
        }
    }

    var _Window_Message_onEndOfText = Window_Message.prototype.onEndOfText
    Window_Message.prototype.onEndOfText = function() {
        if ($gameSystem.canAccelerateWindow()) this._pauseSkip = true;
        _Window_Message_onEndOfText.call(this);
    };

    var _Game_System_useMapBattle =Game_System.prototype.useMapBattle
    Game_System.prototype.useMapBattle = function() {
        return $gameSystem.canAccelerateAnimation() || _Game_System_useMapBattle.call(this);
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        if ($gameSystem.canAccelerateAnimation() && command.contains('nrp.animation.')) return
        _Game_Interpreter_pluginCommand.call(this, command, args);
    }

    if (Game_Action.prototype.isDynamicAnimation){
        var _Game_Action_isDynamicAnimation = Game_Action.prototype.isDynamicAnimation
        Game_Action.prototype.isDynamicAnimation = function(animationId) {
            if ($gameSystem.canAccelerateAnimation()) return false;
            _Game_Action_isDynamicAnimation.call(this, animationId)
        };

        var _Scene_Map_setDynamicSkillWait = Scene_Map.prototype.setDynamicSkillWait
        Scene_Map.prototype.setDynamicSkillWait = function(item, interpreter) {
            if ($gameSystem.canAccelerateAnimation()) return;
            _Scene_Map_setDynamicSkillWait.call(this, item, interpreter)
        }
    }

    var _Game_CharacterBase_requestAnimation = Game_CharacterBase.prototype.requestAnimation
    Game_CharacterBase.prototype.requestAnimation = function(animationId) {
        if ($gameSystem.canAccelerateAnimation()) return;
        _Game_CharacterBase_requestAnimation.call(this, animationId);
    };

    if (Game_CharacterBase.prototype.playMotion){
        var _Game_CharacterBase_playMotion = Game_CharacterBase.prototype.playMotion
        Game_CharacterBase.prototype.playMotion = function(motion, wait) {
            if ($gameSystem.canAccelerateAnimation()) return;
            _Game_CharacterBase_playMotion.call(this, motion, wait);
        };
    }

    var _Sprite_Character_setupDamagePopup_MB = Sprite_Character.prototype.setupDamagePopup_MB
    Sprite_Character.prototype.setupDamagePopup_MB = function() {
        if ($gameSystem.canAccelerateAnimation()) return;
        _Sprite_Character_setupDamagePopup_MB.call(this);
    };

    var _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        if ($gameSystem.canAccelerateMove()){
            var oldSpeed = _Game_Player_realMoveSpeed.call(this);
            return Math.max(Math.min($gameSystem.accelerateMove + oldSpeed, 7), oldSpeed);
        } else return _Game_Player_realMoveSpeed.call(this)
    };

    var _Game_CharacterBase_distancePerFrame = Game_CharacterBase.prototype.distancePerFrame
    Game_CharacterBase.prototype.distancePerFrame = function() {
        if ($gameSystem.canAccelerateMove() && this !== $gamePlayer){
            return Math.min(256, Math.pow(2, $gameSystem.accelerateMove) * _Game_CharacterBase_distancePerFrame.call(this));
        } else return _Game_CharacterBase_distancePerFrame.call(this);
    };

    if (Game_Player.prototype.slideTo){
        var _Game_Player_slideTo = Game_Player.prototype.slideTo
        Game_Player.prototype.slideTo = function(x, y) {
            if ($gameSystem.canAccelerateMove()){
                this.setPosition(x, y);
            } else _Game_Player_slideTo.call(this, x, y)
        };
    };

    var _Window_Base_updateOpen = Window_Base.prototype.updateOpen;
    Window_Base.prototype.updateOpen = function() {
        if ($gameSystem.canAccelerateWindow()){
            if (this._opening) {
                this.openness += 255;
                if (this.isOpen()) {
                    this._opening = false;
                }
            }
        } else _Window_Base_updateOpen.call(this);
    };

    var _Window_Base_updateClose = Window_Base.prototype.updateClose;
    Window_Base.prototype.updateClose = function() {
        if ($gameSystem.canAccelerateWindow()){
            if (this._closing) {
                this.openness -= 255;
                if (this.isClosed()) {
                    this._closing = false;
                }
            }
        } else _Window_Base_updateClose.call(this);
    };

    var _Window_SrpgBattleResult_setRewards = Window_SrpgBattleResult.prototype.setRewards
    Window_SrpgBattleResult.prototype.setRewards = function(rewards) {
        _Window_SrpgBattleResult_setRewards.call(this, rewards);
        if ($gameSystem.canAccelerateWindow()){
            this._changeExp = Math.min(this._changeExp, Math.round(this._changeExp/$gameSystem.accelerateWindow), 1);
            if ($gameSystem.accelerateWindow === 3) this._changeExp = 1;
        }
    };

    var _Window_SrpgBattleResult_updateAutoClose = Window_SrpgBattleResult.prototype.updateAutoClose
    Window_SrpgBattleResult.prototype.updateAutoClose = function() {
        _Window_SrpgBattleResult_updateAutoClose.call(this);
        if ($gameSystem.canAccelerateWindow()){
            this._waitCount -= $gameSystem.accelerateWindow;
            if ($gameSystem.accelerateWindow === 3){
                this._waitCount = 0;
                this._changeExp = 0;
            }
        }
    };

    // =====================================
    // Developer mode utils
    // =====================================
    /**end srpg, clear up data*/
    var _SRPG_Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _SRPG_Game_System_initialize.call(this);
        this.developerMode = false;
        this.skipAnimation = false;
        this.accelerateWindow = 0; // normal, fast, very fast, instant.
        this.accelerateMove = 0;
        this.srpgOnly = true;
    };

    Game_System.prototype.developerSpeedMode = function() {
        return this.developerMode && this.isSRPGMode();
    };

    Game_System.prototype.canAccelerate = function() {
        return this.developerMode && (this.isSRPGMode() || !this.srpgOnly);
    };

    Game_System.prototype.canAccelerateAnimation = function() {
        return this.canAccelerate() && this.skipAnimation;
    };

    Game_System.prototype.canAccelerateWindow = function() {
        return this.canAccelerate() && this.accelerateWindow;
    };

    Game_System.prototype.canAccelerateMove = function() {
        return this.canAccelerate() && this.accelerateMove;
    };

    Game_System.prototype.isDeveloperSRPGMode = function() {
        return this.developerMode && this.isSRPGMode();
    };

    Game_System.prototype.changeDeveloperMode = function() {
        this.developerMode = !this.developerMode;
        if (this.developerMode){
            $gameTemp.pushDeveloperLog(new SRPG_Log());
            $gameTemp.developerSpritesNeedRefresh = true;
        }
    };

    Game_Temp.prototype.constandAutoBattle = function() {
        return this._constandAutoBattle;
    };

    Game_Temp.prototype.turnOnConstandAutoBattle = function() {
        this._constandAutoBattle = true;
        $gameTemp.setTurnEndFlag(true);
        $gameTemp.setAutoBattleFlag(true);
        $gameSystem.setBattlePhase('auto_actor_phase')
        $gameMap.events().forEach(function(event){
            var actor = $gameSystem.EventToUnit(event.eventId());
            if (actor && actor[1] && actor[1].isActor()) {
                actor[1].addState(_srpgAutoBattleStateId);
            }
        });
    };

    Game_Temp.prototype.turnOffConstandAutoBattle = function() {
        this._constandAutoBattle = false;
        $gameTemp.setAutoBattleFlag(false);
        $gameMap.events().forEach(function(event){
            var actor = $gameSystem.EventToUnit(event.eventId());
            if (actor && actor[1] && actor[1].isActor()) {
                actor[1].removeState(_srpgAutoBattleStateId);
            }
        })
    };

    Game_Temp.prototype.initDeveloperLog = function() {
        this._developerLog = [new SRPG_Log(true)];
        this._currentLogIndex = 0;
        this.developerSpritesNeedRefresh = undefined;
        this.currentWindow = undefined;

    };

    Game_Temp.prototype.developerLog = function() {
        return this._developerLog;
    };

    Game_Temp.prototype.currentLog = function() {
        return this._developerLog[this._currentLogIndex];
    };

    Game_Temp.prototype.isLogMod = function() {
        return this._currentLogIndex < this._developerLog.length - 1 || !this.currentLog().isEnd();
    }

    Game_Temp.prototype.pushDeveloperLog = function(log) {
        this._developerLog.push(log);
        if (this._developerLog.length > 500){
            this._developerLog = this._developerLog.slice(1);
        }
        this._currentLogIndex = this._developerLog.length - 1;
    };

    Game_Temp.prototype.prevLogAction = function() {
        SceneManager._scene._developerLogWindow.clear();
        if (!this.currentLog().isStart()){
            this.currentLog().prevAction();
        } else {
            this.currentLog().reproduceAll();
            if (this._currentLogIndex > 0){
                this._currentLogIndex -= 1;
            }
        }
    };

    Game_Temp.prototype.nextLogAction = function() {
        SceneManager._scene._developerLogWindow.clear();
        if (!this.currentLog().isEnd()){
            this.currentLog().nextAction();
        } else {
            if (this._currentLogIndex < this._developerLog.length - 1){
                this._currentLogIndex += 1;
                this.currentLog().reproduceAll();
            }
        }
    };

    Game_Temp.prototype.toFirstLog = function(){
        this.currentLog().setStart();
        while (this._currentLogIndex > 0){
            this._currentLogIndex -= 1;
            this.currentLog().setStart();
        }
        SceneManager._scene._developerLogWindow.hide();
        this.currentLog().reproduceAll();
        this.refreshDisplayInfo();
    }

    Game_Temp.prototype.endLog = function(){
        this.currentLog().setEnd();
        while (this._currentLogIndex < this._developerLog.length - 1){
            this._currentLogIndex += 1;
            this.currentLog().setEnd();
        }
        SceneManager._scene._developerLogWindow.hide();
        this.currentLog().reproduceAll();
        this.currentLog().reproduceAll();
        this.refreshDisplayInfo();
    }

    Game_Temp.prototype.refreshDisplayInfo = function() {
        this.clearMoveTable();
        this.setResetMoveList(true);
    };

    if (!Game_Temp.prototype.getAreaEvents){
        Game_Temp.prototype.getAreaEvents = function() {
            var events = []
            for (var i = 0; i < this._areaTargets.length; i ++ ) {
                if (this._areaTargets[i].event) events.push(this._areaTargets[i].event);
            }
            return events;
        };
    }

    // =====================================
    // SRPG_Log  data structure
    // =====================================
    window.SRPG_Log = function(isDefault) {
        this.initialize(isDefault);
    }

    SRPG_Log.prototype.initialize = function(isDefault) {
        this.turnEventMap = new Map();
        this.actions = [];
        this.currentIdx = 0;
        this.text = '';
        this.errorMessage = '';
        if (!isDefault) this.createData();
    };

    SRPG_Log.prototype.createData = function() {
        $gameMap.events().forEach(function(event) {
            this.addEvent(event);
        }, this);
        this.reproduceAll();
    };

    SRPG_Log.prototype.isEnd = function() {
        return this.currentIdx >= this.actions.length;
    }

    SRPG_Log.prototype.setEnd = function() {
        this.currentIdx = this.actions.length;
    }

    SRPG_Log.prototype.isStart = function() {
        return this.currentIdx <= 0;
    }

    SRPG_Log.prototype.setStart = function() {
        this.currentIdx = 0;
    }

    SRPG_Log.prototype.addEvent = function(event, map) {
        var map = map || this.turnEventMap;
        var info = {}
        info.x = event.posX();
        info.y = event.posY();
        info.dir = event.direction();
        info.isErased = event.isErased();
        var battlerArray = $gameSystem.EventToUnit(event.eventId())
        if (battlerArray && battlerArray[1]) {
            info.battler = battlerArray[1];
            info.isAlive = battlerArray[1].isAlive();
            info.turnEnd = battlerArray[1].srpgTurnEnd();
            info.hp = battlerArray[1].hp;
            info.mp = battlerArray[1].mp;
            info.tp = battlerArray[1].tp;
        }
        map.set(event, info);
    };

    SRPG_Log.prototype.reproduceAll = function() {
        if (this.turnEventMap.size <= 0 || !SceneManager._scene._spriteset) return;
        for(var sprite of SceneManager._scene._spriteset._characterSprites){
            if (!sprite._character.isEvent()) continue;
            var info = this.turnEventMap.get(sprite._character);
            this.reproduceEvent(sprite._character, info, sprite);
        }
    };

    SRPG_Log.prototype.reproduceEvent = function(event, info, sprite) {
        if (!info || info.isErased){
            event.erase();
            sprite.hide();
            return;
        }
        event.appear();
        sprite.show();
        event.setPosition(info.x, info.y);
        event.setDirection(info.dir);
        var battler = info.battler
        if (!battler) return;
        if (battler.isActor()) {
            event.setImage(battler.characterName(), battler.characterIndex());
        } else if (battler.isEnemy()) {
            var characterName = battler.enemy().meta.characterName;
            var characterIndex = Number(battler.enemy().meta.characterIndex);
            event.setImage(characterName, characterIndex);
        }
        sprite.refreshDeverloperSprite(info);
    };

    SRPG_Log.prototype.prevAction = function() {
        $gameTemp.refreshDisplayInfo();
        if (!this.isStart()) {
            this.currentIdx -= 1;
            var action = this.actions[this.currentIdx]
            if (action.type == 'move'){
                this.showMove(action);
                $gamePlayer.center(action.start[0], action.start[1]);
                $gamePlayer.setPosition(action.start[0], action.start[1]);
                action.event.setPosition(action.start[0], action.start[1]);
                if (action.route.length > 0) action.event.setDirection(action.dir);
            } else if (action.type == 'battle'){
                this.showBattle(action);
            }
        }
    };

    SRPG_Log.prototype.nextAction = function() {
        $gameTemp.refreshDisplayInfo();
        if (!this.isEnd()) {
            var action = this.actions[this.currentIdx]
            if (action.type == 'move'){
                this.showMove(action);
                $gamePlayer.center(action.end[0], action.end[1]);
                $gamePlayer.setPosition(action.end[0], action.end[1]);
                action.event.setPosition(action.end[0], action.end[1]);
                if (action.route.length > 0) {
                    action.event.setDirection(action.route[action.route.length - 1]);
                }
            } else if (action.type == 'battle'){
                this.showBattle(action);
            }
        }

        this.currentIdx += 1;
    };

    SRPG_Log.prototype.addMove = function(event, user, route) {
        var data = {}
        data.type = 'move';
        data.event = event;
        data.user = user;
        data.start = [event.posX(), event.posY()];
        data.route = route;
        data.dir = event.direction();
        var x = event.posX();
        var y = event.posY();
        for (var i = 0; i < route.length; i++){
            x = $gameMap.roundXWithDirection(x, route[i]);
            y = $gameMap.roundYWithDirection(y, route[i]);
        }
        data.end = [x, y];
        data.text = user.name() + 'move from ' + data.start + ' to ' + data.end;
        this.actions.push(data);
        this.currentIdx = this.actions.length
    };

    SRPG_Log.prototype.showMove = function(data) {
        var x = data.start[0];
        var y = data.start[1];
        var route = data.route;
        $gameTemp.pushMoveList([x, y, false]);
        for (var i = 0; i < data.route.length; i++){
            x = $gameMap.roundXWithDirection(x, route[i]);
            y = $gameMap.roundYWithDirection(y, route[i]);
            $gameTemp.pushMoveList([x, y, false]);
        }
        SceneManager._scene._developerLogWindow.show();
        SceneManager._scene._developerLogWindow.push('addText', data.text);
    };

    SRPG_Log.prototype.addBattle = function(user, target) {
        if (!user.action(0) || !user.action(0).item()) return;
        var data = {};
        data.type = 'battle';
        data.user = user;
        data.target = target;
        data.eventMap = new Map();
        data.areaTargets = $gameTemp._areaTargets ? $gameTemp.getAreaEvents() : [];
        data.action = user.action(0).item();
        data.targetPos = [target.event().posX(), target.event().posY()];
        data.aoeArea = $gameTemp._activeAoE;
        this.actions.push(data);
        this.currentIdx = this.actions.length;
        data.areaTargets.concat([user.event(), target.event()]).forEach(function(event){
            this.addEvent(event, data.eventMap);
        },this);
        data.text = Window_BattleLog.prototype.actionToText.call(this, data.user, data.action);
        for(var sprite of SceneManager._scene._spriteset._characterSprites){
            if (!sprite._character.isEvent()) continue;
            var info = data.eventMap.get(sprite._character);
            if (info) this.reproduceEvent(sprite._character, info, sprite);
        }
        // data.areaTargets = [];
        // if (this._areaTargets){
        //     data.areaTargets = $gameTemp.getAreaEvents();
        // }
    };

    SRPG_Log.prototype.showBattle = function(data) {
        for(var sprite of SceneManager._scene._spriteset._characterSprites){
            if (!sprite._character.isEvent()) continue;
            var info = data.eventMap.get(sprite._character);
            if (info) this.reproduceEvent(sprite._character, info, sprite);
        }
        $gameTemp.pushMoveList([data.user.event().posX(), data.user.event().posY(), false]);
        if (!data.aoeArea){
            $gamePlayer.center(data.targetPos[0], data.targetPos[1]);
            $gamePlayer.setPosition(data.targetPos[0], data.targetPos[1]);
            $gameTemp.pushMoveList([data.targetPos[0], data.targetPos[1], true]);
        } else {
            var ox = data.aoeArea.x;
            var oy = data.aoeArea.y;
            var size = data.aoeArea.size;
            var minSize = data.aoeArea.minSize;
            var shape = data.aoeArea.shape;
            var dir = data.aoeArea.dir;
            $gamePlayer.center(ox, oy);
            $gamePlayer.setPosition(ox, oy);
            for (var x = 0; x < 1+size*2; x++) {
                for (var y = 0; y < 1+size*2; y++) {
                    if ($gameMap.inArea(x-size, y-size, size, minSize, shape, dir)) {
                        $gameTemp.pushMoveList([ox - size + x, oy - size + y, true]);
                    }
                }
            }
        }
        SceneManager._scene._developerLogWindow.show();
        SceneManager._scene._developerLogWindow.push('addText', data.text);
    };


    // ===============================================
    // developer sprite
    // ===============================================
    // var _SRPG_Sprite_Character_setCharacterBitmap = Sprite_Character.prototype.setCharacterBitmap;
    // Sprite_Character.prototype.setCharacterBitmap = function() {
    //     _SRPG_Sprite_Character_setCharacterBitmap.call(this);
    // };

    var _SRPG_Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        _SRPG_Sprite_Character_updateCharacterFrame.call(this);
        if ($gameSystem.isDeveloperSRPGMode() && this._character.isEvent()) {
            this.createDeveloperSprite();
            if (this._HpGauge) this._HpGauge.close();
            var battlerArray = $gameSystem.EventToUnit(this._character.eventId());
            if (!this._character.isErased() && battlerArray && battlerArray[1]) {
                this._developerSprite.bitmap.visible = true;
            } else{
                this._developerSprite.bitmap.visible = false;
            }
        } else {
            if (this._HpGauge) this._HpGauge.open();
            if (this._developerSprite) {
                this.removeChild(this._developerSprite);
                this._developerSprite = null;
            }
        }
    };

    Sprite_Character.prototype.refreshDeverloperSprite = function(info) {
        var prevInfo = this._developerSprite.info;
        this.createDeveloperSprite();
        var bitmap = this._developerSprite.bitmap
        bitmap.clear();
        if (info.hp !== undefined){
            bitmap.textColor = '#FF0000';
            bitmap.outlineColor = '#333333';
            bitmap.drawText(info.hp, 0, 16 * 3, 64, 16);
            if (prevInfo.hp !== undefined && prevInfo.hp !== info.hp){
                bitmap.textColor = '#FF4500';
                bitmap.outlineColor = '#FFFFFF';
                bitmap.fontSize = 20;
                var sign = (info.hp - prevInfo.hp > 0 ?'+':'')
                bitmap.drawText(sign + (info.hp - prevInfo.hp).toString(), 12, 4, 64, 16);
                bitmap.fontSize = 16;
            }
        }
        if (info.mp !== undefined){
            bitmap.textColor = '#0000FF';
            bitmap.outlineColor = '#333333';
            bitmap.drawText(info.mp, 0, 16 * 2, 64, 16);
            if (prevInfo.mp !== undefined && prevInfo.mp !== info.mp){
                bitmap.textColor = '#00BFFF';
                bitmap.outlineColor = '#FFFFFF';
                bitmap.fontSize = 20;
                var sign = (info.mp - prevInfo.mp>0 ?'+':'')
                bitmap.drawText(sign + (info.mp - prevInfo.mp).toString(), 12, 22, 64, 16);
                bitmap.fontSize = 16;
            }
        }
        this._developerSprite.info = info;
    }

    Sprite_Character.prototype.createDeveloperSprite = function() {
        if (!this._developerSprite) {
            var sprite = new Sprite();
            sprite = new Sprite();
            sprite.bitmap = new Bitmap();
            sprite.bitmap.resize(64, 64);
            sprite.setFrame(0, 0, 64, 64);
            sprite.bitmap.fontSize = 16;
            sprite.bitmap.outlineWidth = 4;
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1;
            sprite.info = {};
            this._developerSprite = sprite
            this.addChild(this._developerSprite);
        }
    };

})();
