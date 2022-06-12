//====================================================================================================================
// SRPG_ActionOrder_SRG.js
//--------------------------------------------------------------------------------------------------------------------
// SRG‘s custom ActionOrder plugin version
//====================================================================================================================
/*:
 * @plugindesc SRG‘s custom ActionOrder plugin version
 * @author Shoukang
 *
 * @param face number
 * @type number
 * @max 14
 * @desc number of faces to display in turn indicator window(limited by face size and face padding)
 * @default 5
 *
 * @param face size
 * @type number
 * @desc size of face in turn indicator window.
 * @default 72
 *
 * @param face padding
 * @type number
 * @desc padding of face in turn indicator window.
 * @default 6
 *
 * @param face frame
 * @type file
 * @dir img/system/
 * @desc Image for face frame. Sample: github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/FaceFrame.png
 * 
 * @param face back
 * @type file
 * @dir img/system/
 * @desc Image for face back. Sample: github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/FaceBack.png
 *
 * @help
 * This plugin changes the battle mode to individual turn order based on the speed of each battler.
 * 
 * Action order rule:
 * Characters move in order of speed, and each character can only move one round per turn.
 *
 * Turn rule:
 * Enter the next round when all characters have acted.
 *
 * Tips:
 * Event with <type:actorTurn> and <type:enemyTurn> will never run, as there the SRPG actor/enemy turn no longer exists.
 * ========================================================================================================================
 * Plugin commands
 * $gameSystem.updateActionSequence();  will update action sequence window.
 * ==========================================================================================================================
 * v1.04 Will reset action sequence if new actor/enemy is added.
 * v1.03 Fix event start bug and disable next L/R actor command.
 * v1.02 Minor change on some function calls.
 * v1.01 Improve turn indicator window
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin needs to be placed above all the other srpg plugins(includin battle prepare) except SRPG_core.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_ActionOrder_SRG');
    var _faceNumber = Number(parameters['face number']) || 5;
    var _faceSize = Number(parameters['face size']) || 72;
    var _facePadding = Number(parameters['face padding']);
    var _faceFrame = parameters['face frame'];
    var _faceBack = parameters['face back'];
    // ===================================================
    // Utils (Helper functions)
    // ===================================================
    Game_Map.prototype.aliveBattlerEvents = function() {
        return $gameMap.events().filter(function(event) {
          return event.isAliveBattler();
        });
    };

    Game_Map.prototype.aliveBattlers = function() {
        return this.aliveBattlerEvents().map(function(event){
            return $gameSystem.EventToUnit(event.eventId())[1];
        })
    };

    Game_CharacterBase.prototype.isBattler = function(){
        var battlerArray = $gameSystem.EventToUnit(this.eventId())
        return !this.isErased() && battlerArray && battlerArray[1] 
    }

    Game_CharacterBase.prototype.isAliveBattler = function(){
        return this.isBattler() && $gameSystem.EventToUnit(this.eventId())[1].isAlive()
    }

    //store remaining move after move route force
    var shoukang_Game_Event_srpgMoveRouteForce = Game_Event.prototype.srpgMoveRouteForce;
    Game_Event.prototype.srpgMoveRouteForce = function(array) {
        var battlerArray = $gameSystem.EventToUnit(this.eventId());
        battlerArray[1].changeSpeedPlusByMove(array);
        shoukang_Game_Event_srpgMoveRouteForce.call(this, array);
    };

    var _SRPG_Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
    Game_BattlerBase.prototype.initMembers = function() {
        _SRPG_Game_BattlerBase_initMembers.call(this);
        this._srpgTurnEnd = false;
        this._srpgActionTiming = -1; // 0:攻撃側、1:防御側
        this._actionEnd = false;
        this._speedPlus = 0;
    };

    Object.defineProperties(Game_BattlerBase.prototype, {
        actionEnd: { get: function() { return this._actionEnd; },
            set: function(value) {this._actionEnd = value}, configurable: true},
        speedPlus: { get: function() { return this._speedPlus; },
            set: function(value) {this._speedPlus = value}, configurable: true},
        actionOrder: { get: function() { return this._actionOrder; },
            set: function(value) {this._actionOrder = value}, configurable: true},
    });

    Game_BattlerBase.prototype.changeSpeedPlusByMove = function(array) {
        var step = 0;
        for (var i = 0; i < array.length; i++){
            if (array[i] !== 0) step += 1;
        }

        if (step === 0){
            this.speedPlus = 50; /** @param  不移动时增加的速度值。*/
        } else {
            this.speedPlus = 25; /** @param  移动时增加的速度值, 可以用 step 得到移动的步数。*/
        }
    }

    Game_BattlerBase.prototype.SRPGSpeed = function(){
        var a = this;
        var speed = a.agi + a.speedPlus; /** @param  行动速度公式，a.speedPlus为角色移动后导致的补正。*/
        return Math.max(speed, 0); 
    }

    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(skill) {
        if ($gameSystem.isSRPGMode() && skill) {
            if (this.event() === $gameTemp.activeEvent()){
                this.speedPlus = 0;     /** @param  使用技能时的速度增加值*/
            }
        }
        _Game_Battler_useItem.call(this, skill);
    };

    Game_System.prototype.actionSequence = function() {
        return this._actionSequence
    }

    Game_System.prototype.actionCount = function() {
        return this._actionCount
    }

    Game_System.prototype.nextBattler = function() {
        return this._actionSequence[0]
    }

    Game_System.prototype.setActionSequence = function(array) {
        this._actionSequence = array
    }

    // ===================================================
    // compatibility stuff
    // ===================================================

    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._actionSequence = [];
        this._actionCount = 0
    };

    var _Game_System_clearData = Game_System.prototype.clearData
    Game_System.prototype.clearData = function() {
        _Game_System_clearData.call(this);
        while ($gameTemp.isSrpgEventList()) {
            $gameTemp.shiftSrpgEventList();
        }
        $gameActors._data.forEach(function(actor){
            if (actor) actor.actionOrder = undefined;
        });
    };

    /**These functions are not needed*/
    Game_System.prototype.getNextLActor = function() {};

    Game_System.prototype.getNextRActor = function() {};

    /**This is the best place I can find to reset a newly added battler's flag and wait time.*/
    var _Game_System_setEventToUnit = Game_System.prototype.setEventToUnit
    Game_System.prototype.setEventToUnit = function(event_id, type, data) {
        _Game_System_setEventToUnit.call(this, event_id, type, data)
        if ($gameMap.event(event_id).isBattler()){
            this.EventToUnit(event_id)[1].setSrpgTurnEnd(true);
            //this.EventToUnit(event_id)[1].actionEnd = true;
            if ($gameSystem.isBattlePhase() !== 'initialize' && $gameSystem.isBattlePhase() !== 'battle_prepare') {
                $gameSystem.updateActionSequence();
                $gameSystem.srpgNextBattlerAction();
            }
        }
    };
    /**These functions are just srpgNextBattlerAction in sequence battle*/
    Game_System.prototype.srpgStartActorTurn = function() {
        this.srpgNextBattlerAction();
    };

    Game_System.prototype.srpgStartAutoActorTurn = function() {
        this.srpgNextBattlerAction();
    };

    Game_System.prototype.srpgStartEnemyTurn = function() {
        this.srpgNextBattlerAction();
    };

    // ===================================================
    // Main sequence battle flow
    // ===================================================
    /**battle start initialize things*/
    var _Game_System_runBattleStartEvent = Game_System.prototype.runBattleStartEvent
    Game_System.prototype.runBattleStartEvent = function() {
        _Game_System_runBattleStartEvent.call(this)
        this._actionCount = 0
        $gameMap.aliveBattlers().forEach(function(battler){
            battler.actionEnd = false;
            battler.changeSpeedPlusByMove([]);
        });
    };

    /**activate next battler, set battle phase*/
    Game_System.prototype.srpgNextBattlerAction = function() {
        if (this.actionSequence().length <= 0){
            $gameSystem.updateActionSequence();
        }
        $gameSystem.setBattlerFlags();

        var nextBattler = this.nextBattler();
        if (nextBattler.isRestricted()){
            nextBattler.actionEnd = true;
            nextBattler.changeSpeedPlusByMove([]);
            this.updateActionSequence();
            $gameSystem.updateSRPGTurn();
            this.srpgNextBattlerAction();
            return;
        }

        if (nextBattler.isActor() && nextBattler.isAutoBattle()){
            this.setBattlePhase('auto_actor_phase');
            this.setSubBattlePhase('auto_actor_command');
        } else if (nextBattler.isActor()){
            var nextEvent = nextBattler.event()
            $gameTemp.setAutoMoveDestinationValid(true);
            $gameTemp.setAutoMoveDestination(nextEvent.posX(), nextEvent.posY());
            this.setBattlePhase('actor_phase');
            this.setSubBattlePhase('initialize');
        } else {
            this.setBattlePhase('enemy_phase');
            this.setSubBattlePhase('enemy_command');
        }
    };

    /**finish up battler action, update sequence and action count, call srpgNextBattlerAction*/
    Scene_Map.prototype.srpgAfterAction = function() {
        var battler = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        battler.srpgCheckFloorEffect($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY());
        if (battler.SRPGActionTimes() <= 1) {
            battler.setSrpgTurnEnd(true);
        } else {
            battler.useSRPGActionTimes(1);
        }
        
        $gameSystem.clearSRPGBattleMode();
        $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
        $gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
        $gameTemp.clearMoveTable();
        $gameTemp.clearTargetEvent();
        $gameParty.clearSrpgBattleActors();
        $gameTroop.clearSrpgBattleEnemys();
        if ($gameSystem.isBattlePhase() === 'actor_phase' || $gameSystem.isBattlePhase() === 'auto_actor_phase') {
            this.eventUnitEvent();
        }
        this.eventAfterAction();

        //srpg_moveAfterAction Fix
        if (battler.SrpgRemainingMove && battler.srpgTurnEnd() && !battler.isSrpgAfterActionMove() && 
            battler.SrpgRemainingMove() && !$gameTemp.isTurnEndFlag() &&
            $gameSystem.isBattlePhase() !== 'auto_actor_phase'){
                return;
        }

        if (battler.srpgTurnEnd()){
            battler.actionEnd = true;
            $gameSystem.updateSRPGTurn();
            $gameSystem.updateActionSequence();
            $gameSystem.srpgNextBattlerAction();
        }
        
        $gameTemp.clearActiveEvent();
    };
    
    /**predict action sequence and store, refresh */
    Game_System.prototype.updateActionSequence = function() {
        var aliveBattlers = $gameMap.aliveBattlers();
        this.updateActionSequenceWithSRGRule(aliveBattlers);
        if ($gameSystem.isSRPGMode() && SceneManager._scene._turnIndicatorWindow){
            SceneManager._scene._turnIndicatorWindow.refresh();
        }
    };

    /**predict action sequence of next 15 actions based on 100 meter dash rule.*/
    Game_System.prototype.updateActionSequenceWithSRGRule = function(aliveBattlers, battlerWaitTimes){
        var actionSequence = aliveBattlers.sort(function(a, b) {
            if (a.actionEnd == b.actionEnd ){
                return b.SRPGSpeed() - a.SRPGSpeed();
            } else return a.actionEnd ? 1 : -1;
        });

        for (var i = 0; i < actionSequence.length; i++){
            actionSequence[i].actionOrder = i + 1;
        }

        this.setActionSequence(actionSequence);
    };

    /**update action count and trigger turn end if meets requirenment*/
    Game_System.prototype.updateSRPGTurn = function() {
        var notActionEndBattlers = $gameMap.aliveBattlers().filter(function(battler) {
            return !battler.actionEnd;
        });
        if (notActionEndBattlers.length === 0){
            this.srpgTurnEnd();
        }
    }

    /**turn end, update states, buffs, turn, action count, and trigger <type:turnEnd> event.*/
    Game_System.prototype.srpgTurnEnd = function() {
        $gameMap.aliveBattlers().forEach(function(battler){
            battler.onTurnEnd();
        })
        $gameMap.events().forEach(function(event) {
            if (event.isType() === 'turnEnd') {
                if (event.pageIndex() >= 0) event.start();
                $gameTemp.pushSrpgEventList(event);
            }
        });
        //srpg_Summon fix
        if (this.updateEnemySummonedEvents){
            this.updateEnemySummonedEvents();
            this.updateActorSummonedEvents();
        }
        this.srpgTurnPlus();
    };

    // ターン終了時の処理
    var _SRPG_Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        if ($gameSystem.isSRPGMode() == true) this.actionEnd = false;
        return _SRPG_Game_Battler_onTurnEnd.call(this);
    };

    /**end srpg, clear up data*/
    var _Game_System_endSRPG = Game_System.prototype.endSRPG
    Game_System.prototype.endSRPG = function() {
        if ($gameSystem.isSRPGMode() && SceneManager._scene._turnIndicatorWindow){
            SceneManager._scene._turnIndicatorWindow.hide();
        }
        $gameSystem.setActionSequence([]);
        _Game_System_endSRPG.call(this);
    };

    /**activeate next battler and deactivate all the other battlers*/
    Game_System.prototype.setBattlerFlags = function() {
        $gameMap.aliveBattlers().forEach(function(battler) {
            battler.setSrpgTurnEnd(true);
        })

        this.nextBattler().setSrpgTurnEnd(false);
        this.nextBattler().SRPGActionTimesSet();
    }

    // =========================
    // Turn indicator Window 
    // =========================
    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        this.createTurnIndicatorWindow();
        _SRPG_SceneMap_createAllWindows.call(this);
    };

    Scene_Map.prototype.createTurnIndicatorWindow = function() {
        this._turnIndicatorWindow = new Window_TurnIndicator();
        this.addWindow(this._turnIndicatorWindow);
    };

    window.Window_TurnIndicator = function() {
        this.initialize.apply(this, arguments);
    }

    Window_TurnIndicator.prototype = Object.create(Window_Base.prototype);
    Window_TurnIndicator.prototype.constructor = Window_TurnIndicator;

    Window_TurnIndicator.prototype.initialize = function(x, y) {
        var width = this.windowWidth();
        var height = this.windowHeight();
        x = x || 0;                                 /** @param 行动顺序窗口x轴位置（最左侧为0）*/
        y = y || (Graphics.boxHeight - height)/2;   /** @param 行动顺序窗口y轴位置（最上侧为0）*/
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.setBackgroundType(2);
        this._actionSequence = [];
        this._faceFrame = ImageManager.loadSystem(_faceFrame);
        this._faceBack = ImageManager.loadSystem(_faceBack);
        this.resetCount();
        this.refresh();
    };

    Window_TurnIndicator.prototype.resetCount = function() {
        this._count = 30;
    };

    Window_TurnIndicator.prototype.disableCount = function() {
        this._count = Number.POSITIVE_INFINITY;
    };

    Window_TurnIndicator.prototype.faceSize = function() {
        return _faceSize;
    };

    Window_TurnIndicator.prototype.faceNumber = function() {
        return _faceNumber;
    };

    Window_TurnIndicator.prototype.facePadding = function() {
        return _facePadding;
    };

    Window_TurnIndicator.prototype.windowWidth = function() {
        return 250;
    };

    Window_TurnIndicator.prototype.windowHeight = function() {
        var contetHeight = this.faceNumber() * (this.faceSize() + this.facePadding());
        return Math.min(contetHeight + 2 * this.standardPadding(),
            Graphics.boxHeight - (Graphics.boxHeight - 2 * this.standardPadding())%(this.faceSize() + this.facePadding()));
    };

    Window_TurnIndicator.prototype.refresh = function() {
        var fp = this.facePadding();
        var fw = Window_Base._faceWidth;
        var fh = Window_Base._faceHeight
        this.contents.clear();
        this.resetCount();
        this._actionSequence = $gameSystem.actionSequence();
        for (var i = 0; i < Math.min(this._actionSequence.length, this.faceNumber()); i++){
            var battler = this._actionSequence[i]
            if (battler.isActor()){
                this.drawActorFace(battler, 0, fp/2 + (this.faceSize() + fp)*i, fw, fh);
            } else {
                this.drawEnemyFace(battler, 0, fp/2 + (this.faceSize() + fp)*i, fw, fh);
            }
            //this.drawCharacter(event.characterName(), event.characterIndex(), 18, this.lineHeight() * (i+1));
            // this.drawActorName(this._actionSequence[i], 48, this.lineHeight() * i);
        }
    };

    /** update again after certain frame in case image is not loaded*/
    Window_TurnIndicator.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (!$gameSystem.isSRPGMode() || $gameMap.isEventRunning()){
            this.hide();
        } else this.show();
        if (this._actionSequence){
            this._count -= 1;
            if (this._count%30 === 0){
                this.refresh();
                this.disableCount();
            }
        }
    };

    Window_TurnIndicator.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
        width = width || Window_Base._faceWidth;
        height = height || Window_Base._faceHeight;
        var bitmap = ImageManager.loadFace(faceName);
        var pw = Window_Base._faceWidth;
        var ph = Window_Base._faceHeight;
        var sw = Math.min(width, pw);
        var sh = Math.min(height, ph);
        var dx = Math.floor(x + Math.max(width - pw, 0) / 2);
        var dy = Math.floor(y + Math.max(height - ph, 0) / 2);
        var sx = faceIndex % 4 * pw + (pw - sw) / 2;
        var sy = Math.floor(faceIndex / 4) * ph + (ph - sh) / 2;
        this.contents.blt(this._faceBack, 0, 0, this._faceBack.width, this._faceBack.height, dx, dy, this.faceSize(), this.faceSize());
        this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, this.faceSize(), this.faceSize());
        this.contents.blt(this._faceFrame, 0, 0, this._faceFrame.width, this._faceFrame.height, dx, dy, this.faceSize(), this.faceSize());
    };

    var _SRPG_Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        _SRPG_Sprite_Character_updateCharacterFrame.call(this);
        this.updateActionOrderFrame();
    };

    Sprite_Character.prototype.updateActionOrderFrame = function() {
        if ($gameSystem.isSRPGMode() && this._character.isEvent()) {
            var battlerArray = $gameSystem.EventToUnit(this._character.eventId());
            if (!this._character.isErased() && battlerArray && battlerArray[1] && battlerArray[1].actionOrder){
                this.createActionOrderSprite();
                this.refreshActionOrder(battlerArray[1].actionOrder);
                return;
            }
        }
        this.removeChild(this._actionOrderSprite);
        this._actionOrderSprite = null;
    }

    Sprite_Character.prototype.refreshActionOrder = function(order) {
        this._actionOrderSprite.bitmap.visible = true;
        if (this._actionOrder === order) return
        this._actionOrder = order;
        var bitmap = this._actionOrderSprite.bitmap
        bitmap.clear();
        if (order === 1){
            bitmap.textColor = '#FF0000';       /** @param  高亮字体颜色*/
            bitmap.outlineColor = '#FFFFFF';    /** @param  高亮字体轮廓颜色*/
            bitmap.drawText(order, bitmap.actionOrderX, bitmap.actionOrderY, 64, bitmap.fontSize);
            bitmap.textColor = '#FFFFFF';       /** @param  普通字体颜色，请与下方字体颜色保持一致*/
            bitmap.outlineColor = '#000000';    /** @param  普通字体轮廓颜色，请与下方字体轮廓颜色保持一致*/
        } else {
            bitmap.drawText(order, bitmap.actionOrderX, bitmap.actionOrderY, 64, bitmap.fontSize);
        }

    }

    /** 此函数中的参数可以控制行动顺序图标的样式*/
    Sprite_Character.prototype.createActionOrderSprite = function() {
        if (!this._actionOrderSprite) {
            var sprite = new Sprite();
            sprite = new Sprite();
            sprite.bitmap = new Bitmap();
            sprite.bitmap.resize(64, 64);
            sprite.setFrame(0, 0, 64, 64);
            sprite.bitmap.textColor = '#FFFFFF';    /** @param  字体颜色*/
            sprite.bitmap.outlineColor = '#000000'; /** @param  字体轮廓颜色*/
            sprite.bitmap.fontSize = 16;            /** @param  字体大小*/
            sprite.bitmap.outlineWidth = 4;         /** @param  字体轮廓厚度*/
            sprite.bitmap.actionOrderX = 4;         /** @param  行动顺序图标x轴位置（最左侧为0，最右侧约为48）*/
            sprite.bitmap.actionOrderY = 16;        /** @param  行动顺序图标y轴位置（最上侧为0，最下侧约为48）*/
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1;
            this._actionOrderSprite = sprite
            this.addChild(this._actionOrderSprite);
        }
    };

})();
