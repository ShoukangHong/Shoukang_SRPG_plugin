//====================================================================================================================
// SRPG_AdvancedInteraction.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit    v1.00 first release!
//====================================================================================================================
/*:
 * @plugindesc Add Advanced interaction for SRPG battle.
 * @author Shoukang
 *
 * @param text unitEvent
 * @desc
 * @default open
 *
 * @help
 *
 * unitEvent will be triggered by actor command when you stand by a unit event, rather than simply wait on top of it.
 * To let the plugin recognize that an event is already triggered, leave the last page of your event blank.
 *==========================================================================================================================
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin requires newly released SRPG_BattlePrepare(7/28/2021), and place it below battlePrepare.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_BattlePrepare');
    var _textUnitEvent = parameters['text unitEvent'] || 'open';
// TODO: add plugin parameters for the command text.

//paramerters from core plugin, just in case.
    var coreParameters = PluginManager.parameters('SRPG_core');

//=================================================================================================
//plugin command
//=================================================================================================
    // var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    // Game_Interpreter.prototype.pluginCommand = function(command, args) {
    //     _Game_Interpreter_pluginCommand.call(this, command, args);
    //     if (command === 'EnableSRPGPrepare') $gameSystem.setSRPGPrepare(true);
    //     if (command === 'DisableSRPGPrepare') $gameSystem.setSRPGPrepare(false);
    // };

//=================================================================================================
//All the things to do are here.
//=================================================================================================

    var _Scene_Map_createSrpgActorCommandWindow = Scene_Map.prototype.createSrpgActorCommandWindow;
    Scene_Map.prototype.createSrpgActorCommandWindow = function() {
        _Scene_Map_createSrpgActorCommandWindow.call(this);
        this._mapSrpgActorCommandWindow.setHandler('unitEvent', this.commandInteraction.bind(this));
        //TODO: bind your symbol/tag with commandInteraction, the symbol/tag will be used to determine which kind of interaction is required.
    };

    Game_Event.prototype.canInteract = function(tag){
        if (this.isErased()) return false;
        if (tag === 'unitEvent'){
            return this.isType() === 'unitEvent' && this.pageIndex() >= 0 && this.list().length > 1; //return false if the page has nothing.
        }
        //TODO: define whether this event can interact with your tag
    }

    Window_ActorCommand.prototype.addInteractionCommands = function() {
        var events = $gameMap.getSurroundingEvents($gameTemp.activeEvent());// this gets all events that surrounds(distance = 1) the activeEvent
        this.addUnitEventCommand(events);
        //TODO: use a function to add your command, make the function similar to the addUnitEventCommand function
    };

    //TODO: make similar function, this function define in which condition will you add your command, and add if meets condition.
    //All the surrounding events are passed into it for you to check.
    Window_ActorCommand.prototype.addUnitEventCommand = function(events) {
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('unitEvent')){
                this.addCommand(_textUnitEvent, 'unitEvent');
                return;
            }
        }
    };

    Game_Player.prototype.triggerInteraction = function(tag){
        if (tag === 'unitEvent'){
            this.startUnitEventInteraction();
        }
        //TODO: else if ... do other interaction, build a function for the interaction as startUnitEventInteraction function

    }

//TODO: make a similar function to define what the specific interaction should do.
    Game_Player.prototype.startUnitEventInteraction = function(){
        var event = $gameTemp.targetEvent()
        event.start();
        $gameTemp.pushSrpgEventList(event);
        $gameSystem.pushSearchedItemList([event.posX(), event.posY()]);
        //Normally speaking interaction should consume the actor's turn, otherwise it will act similar to an immediate skill.
        // but I didn't put currentActorwait at the bottom of triggerInteraction function in case there are any specific needs.
        this.currentActorWait();
    }

//===================================================================================
// These are some functions that you may want to call.
//===================================================================================
    Game_Player.prototype.currentActorWait = function(){
        var actor = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
        actor.onAllActionsEnd();
        $gameSystem.setSubBattlePhase('after_action');
        $gameSystem.clearSrpgInteractionTag();
    }

    Game_System.prototype.setSrpgInteractionTag = function(tag) {
        this._srpgInteractionTag = tag;
    }

    Game_System.prototype.clearSrpgInteractionTag = function() {
        this._srpgInteractionTag = undefined;
    }

    Game_System.prototype.srpgInteractionTag = function() {
        return this._srpgInteractionTag;
    }

//===================================================================================
// These are some functions that you should not worry about, unless a bug is found.
//===================================================================================

//this defines what are the surrounding tiles. Here only distance 1 tiles will be included.
    Game_Map.prototype.getSurroundingTiles = function(event){
        var oriX = event.posX();
        var oriY = event.posY();
        var tiles = [];
        for (var d = 2; d < 10; d += 2){
            if (!event.srpgRangeCanPass(oriX, oriY, d)) continue;
            var dx = $gameMap.roundXWithDirection(oriX, d);
            var dy = $gameMap.roundYWithDirection(oriY, d);
            tiles.push([dx, dy]);
        }
        return tiles;
    }

    Game_Map.prototype.getSurroundingEvents = function(event) {
        var events = [];
        this.getSurroundingTiles(event).forEach(function(xy) {
            events = events.concat($gameMap.eventsXyNt(xy[0], xy[1]));
        });
        return events;
    }

// make the surrounding tiles red.
    Game_Temp.prototype.makeInteractionTable = function(event){
        $gameMap.getSurroundingTiles(event).forEach(function(xy) {
            $gameTemp.setRangeTable(xy[0],xy[1], true, null);
            $gameTemp.pushRangeList([xy[0], xy[1], true]);
        });
        this.pushRangeListToMoveList();
        this.setResetMoveList(true);
    }

//get ready for intaraction phase.
    Scene_Map.prototype.commandInteraction = function() {
        $gameSystem.setSrpgInteractionTag(this._mapSrpgActorCommandWindow.currentSymbol());
        $gameTemp.clearMoveTable();
        $gameTemp.makeInteractionTable($gameTemp.activeEvent());
        $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
        $gameSystem.setSubBattlePhase('actor_Interaction');
    };

    var _SRPG_Game_Player_startMapEvent = Game_Player.prototype.startMapEvent
    Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
        if ($gameSystem.isSubBattlePhase() === 'actor_Interaction' &&  $gameSystem.isSRPGMode() == true && !$gameMap.isEventRunning() ){
            if (triggers[0] !== 0 || $gameTemp.RangeTable(x, y)[0] !== true) return;
            var event = this.getInteractionEvent(x, y);
            if (event){
                $gameTemp.setTargetEvent(event);
                this.triggerInteraction($gameSystem.srpgInteractionTag());
            } else SoundManager.playBuzzer();
        } else _SRPG_Game_Player_startMapEvent.call(this, x, y, triggers, normal)
    };

//get the event that can interact at the specific tile.
    Game_Player.prototype.getInteractionEvent = function(x, y){
        var events = $gameMap.eventsXy(x, y);
        for (var i = 0; i < events.length; i++) {
            if (events[i].canInteract($gameSystem.srpgInteractionTag())) {
                return events[i];
            }
        }
    }

//interaction commands stay on top of the other commands.
    var _SRPG_Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() == 'actor_phase' && this._actor) {
            this.addInteractionCommands();
        }
        _SRPG_Window_ActorCommand_makeCommandList.call(this);
    };

    var _Scene_Map_srpgCancelActorTarget = Scene_Map.prototype.srpgCancelActorTarget
    Scene_Map.prototype.srpgCancelActorTarget = function(){
        _Scene_Map_srpgCancelActorTarget.call(this);
        $gameSystem.clearSrpgInteractionTag();
    }

    var _SRPG_MB_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_MB_SceneMap_update.call(this);
        if ($gameSystem.isSRPGMode() && $gameSystem.isSubBattlePhase() === 'after_action') {
            this.srpgAfterAction();
            return;
        }
    };

//no longer needed, do nothing when actor step on top of a unitEvent
    Scene_Map.prototype.eventUnitEvent = function() {
        return;
    };

})();
