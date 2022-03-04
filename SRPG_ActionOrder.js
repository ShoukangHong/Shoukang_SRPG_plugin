//====================================================================================================================
// SRPG_ActionOrder.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit     v1.00 First release
//====================================================================================================================
/*:
 * @plugindesc Change the battle mode to sequenece battle based on speed of each battler.
 * @author Shoukang
 *
 * @param speed formula
 * @desc default formula to calculate speed.
 * @default a.agi
 *
 * @help
 * This plugin changes the battle mode to individual turn order based on the speed of each battler.
 *
 * Action order rule:
 * Imagine a '100 meter dash' competition between all battlers, the first one reached the end will be the next
 * battler to act. It will immediately go back to the start point and run again. The other battlers will keep running.
 *
 * Turn rule:
 * If there are n units in battle. A turn would end after n actions. When the turn ends, states, buffs will update and
 * event with <type:turnEnd> will start
 *
 * Tips:
 * Event with <type:actorTurn> and <type:enemyTurn> will never run, as there the SRPG actor/enemy turn no longer exists.
 * ==========================================================================================================================
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin needs to be placed above all the other srpg plugins(includin battle prepare) except SRPG_core.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_ActionOrder');
    var _speedFormula = parameters['speed formula'] || 'a.agi';
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

    Game_BattlerBase.prototype.standardDistToAction = function() {
        return 100; //100 meter dash
    }

    Game_BattlerBase.prototype.SRPGSpeed = function(){
        var a = this
        return eval(_speedFormula)
    }

    Game_BattlerBase.prototype.waitTime = function() {
        return this._distToAction / this.SRPGSpeed();
    }

    Game_BattlerBase.prototype.waitTimePerAction = function() {
        return this.standardDistToAction() / this.SRPGSpeed();
    }

    Game_BattlerBase.prototype.updateDistToAction = function(time) {
        this._distToAction -= time * this.SRPGSpeed();
    }

    Game_BattlerBase.prototype.resetDistToAction = function() {
        this._distToAction = this.standardDistToAction();
    }

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

    var _Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        _Game_Actor_setup.call(this, actorId);
        this._distToAction = this.standardDistToAction();
    };

    var _Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y) {
        _Game_Enemy_setup.call(this, enemyId, x, y);
        this._distToAction = this.standardDistToAction();
    };

    /**This is the best place I can find to reset a newly added battler's flag and wait time.*/
    var _Game_System_setEventToUnit = Game_System.prototype.setEventToUnit
    Game_System.prototype.setEventToUnit = function(event_id, type, data) {
        _Game_System_setEventToUnit.call(this, event_id, type, data)
        if ($gameMap.event(event_id).isBattler()){
            this.EventToUnit(event_id)[1].resetDistToAction();
            this.EventToUnit(event_id)[1].setSrpgTurnEnd(true);
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
            battler.resetDistToAction();
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
            nextBattler.resetDistToAction();
            this.updateActionSequence();
            $gameSystem.updateActionCount();
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
    }

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
            battler.resetDistToAction();
            $gameSystem.updateActionSequence();
            $gameSystem.updateActionCount();
            $gameSystem.srpgNextBattlerAction();
        }
    };
        // if (currentBattler.srpgTurnEnd() && !currentBattler.isSrpgAfterActionMove() && 
        //     currentBattler.SrpgRemainingMove() && !$gameTemp.isTurnEndFlag() &&
        //     $gameSystem.isBattlePhase() !== 'auto_actor_phase'){
    /**predict action sequence and store, refresh */
    Game_System.prototype.updateActionSequence = function() {
        var aliveBattlers = $gameMap.aliveBattlers()
        var actionSequence = []
        var battlerWaitTimes = aliveBattlers.map(function(battler){return battler.waitTime()})

        //predict action sequence of next 15 actions.
        while (actionSequence.length < 15){
            var nextIndex = 0
            for (var i = 0; i < aliveBattlers.length; i++){
                if (battlerWaitTimes[i] < battlerWaitTimes[nextIndex]){
                    nextIndex = i
                }
            }
            actionSequence.push(aliveBattlers[nextIndex]);
            battlerWaitTimes[nextIndex] += aliveBattlers[nextIndex].waitTimePerAction();
        }
        this.setActionSequence(actionSequence);

        var nextBattler = this.nextBattler();
        var time = nextBattler.waitTime();
        aliveBattlers.forEach(function(battler){battler.updateDistToAction(time)})
        //console.log(aliveBattlers[0].name())
        if ($gameSystem.isSRPGMode() && SceneManager._scene._turnIndicatorWindow){
            SceneManager._scene._turnIndicatorWindow.refresh();
        }
    }

    /**update action count and trigger turn end if meets requirenment*/
    Game_System.prototype.updateActionCount = function() {
        this._actionCount += 1;
        if (this._actionCount >= $gameMap.aliveBattlers().length){
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
        this._actionCount = 0;
        this.srpgTurnPlus();
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


    // TODO: 1. Set window width, height, x and y position. 
    //       2. Code what to draw in Window_TurnIndicator.prototype.refresh

    /**@param x: x position of the window(top left)
     * @param y: y position of the window(top left)*/
    Window_TurnIndicator.prototype.initialize = function(x, y) {
        x = x || 0;
        y = y || Graphics.boxHeight / 4;
        var width = this.windowWidth();
        var height = this.windowHeight();
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.setBackgroundType(2);
        this._actionSequence = []
        this.refresh();
    };

    Window_TurnIndicator.prototype.windowWidth = function() {
        return 250;
    };

    Window_TurnIndicator.prototype.windowHeight = function() {
        return (Graphics.boxHeight / 2 - (Graphics.boxHeight / 2) % this.fittingHeight(1));
    };

    Window_TurnIndicator.prototype.refresh = function() {
        this.contents.clear();
        this._actionSequence = $gameSystem.actionSequence();
        for (var i = 0; i < this._actionSequence.length; i++){
            var event = this._actionSequence[i].event();
            this.drawCharacter(event.characterName(), event.characterIndex(), 18, this.lineHeight() * (i+1));
            this.drawActorName(this._actionSequence[i], 48, this.lineHeight() * i);
        }
    };

    /**It's basically the same as Window_Base.prototype.drawCharacter. Only difference is var ph = ...
     * Some chararcters won't show up. The bug is somewhere else as the save/load menu also won't display some characters.*/
    Window_TurnIndicator.prototype.drawCharacter = function(characterName, characterIndex, x, y) {
        var bitmap = ImageManager.loadCharacter(characterName);
        var big = ImageManager.isBigCharacter(characterName);
        var pw = bitmap.width / (big ? 3 : 12);
        var ph = bitmap.height / (big ? 4 : 8) * 7/10;
        var n = characterIndex;
        var sx = (n % 4 * 3 + 1) * pw;
        var sy = (Math.floor(n / 4) * 4) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x - pw / 2, y - ph);
    };

    // ======================================================
    // TODO: This is guidance on some other thing you might want to fix:
    // ======================================================
    /** to remove turn end sprite from enemies, check this function in SRPG_Core:
     * Sprite_Character.prototype.updateCharacterFrame
     */

    /**Test compatibility with skill note tag <addActionTimes: X> in SRPG_Core.
     * If anything breaks try to fix by editing Scene_Map.prototype.srpgAfterAction in this plugin*/

})();
