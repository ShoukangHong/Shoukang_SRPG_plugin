//====================================================================================================================
// SRPG_AdvancedInteraction.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit     v1.07 add command text color option 
//====================================================================================================================
/*:
 * @plugindesc Add Advanced interaction for SRPG battle.
 * @author Shoukang
 *
 * @param default no interaction
 * @desc if true, all events except unitevent will have no interaction unless it has <act:xxxx> note tag.
 * @type boolean
 * @default false
 *
 * @param text object interaction
 * @desc default text for object interaction, if not specified by <act:xxxx>
 * @default interact
 *
 * @param text unitEvent interaction
 * @desc default text for unitEvent interaction, if not specified by <act:xxxx>
 * @default open
 *
 * @param text battler interaction
 * @desc default text for battler interaction, if not specified by <act:xxxx>
 * @default talk
 *
 *
 * @param interaction command color Id
 * @type number
 * @desc color id. refer to color table in img/system/Window.png, count start from 0.
 * @default 29
 *
 * @param wrap appear Animation Id
 * @desc appear animation for wrap skill
 * @default 52
 *
 * @param wrap disappear Animation Id
 * @desc disappear animation for wrap skill
 * @default 52
 *
 * @help
 *
 * Unit event will be triggered by actor command, rather than simply wait on top of it.
 * Object events, actors and enemies can be triggered by actor command when you stand by.
 * You can simply change your unitEvents to Objects to see the change.
 * To let the plugin recognize that an event is already triggered/not triggerable, leave the current page of your event blank, or use <act:null> or <condition:XXXX>.
 * After changing the plugin parameters (and the event note tags), you need to restart the Srpg battle to see the change, loading a file
 * that is in the middle of an srpg battle will have no effect.
 * ==========================================================================================================================
 * new event note tags:
 * <act:xxxx> set the specific interaction name for the event, this name will appear in actor command.
 * built in interation names:
 * <act:wait> wait on the event can trigger this interaction, no extra interaction command show up. Same as how original unit event work.
 * <act:null> this event is not interactable, no matter it has contents in the page or not.
 * ==========================================================================================================================
 * new event comments (not note tag), put in the first line of your current event page:
 * <condition:XXXX>  define in which condition is the event interactable, XXXX will be considered as code and get evaluated.
 * s[n]         value of switch n
 * v[n]         value of variable n
 * a            the active battler
 * b            the battler of this event(if this event is a battler)
 * ea           the active event
 * eb           this event
 * 
 * For example: <condition: s[2] == true> means this interaction is valid when switch 2 is on.
 * <condition: a.actorId() == 1 || a.actorId() == 2> means only actor 1 and actor 2 can interact with this event.
 * =========================================================================================================================
 * new script calls:
 * $gameMap.event(eventId).setInteractionName('name'); 
 * Can be used to: 1. change the interaction name for events that can be triggered repeatedly, for exampele: 'open' --> 'close' --> 'open' --> 'close'
 * 2. disable interaction by $gameMap.event(eventId).setInteractionName('null');
 *
 * this.wrap(size, type, eventId);             # make a wrap interaction
 * Put the code in a unitEvent or object event can make the event do a wrap interaction.
 * Put the code in a common event for your wrap skill. Trigger the common event via skill effect.
 * Refer to Srpg AoE for size and type(shape).
 * Type and eventId are optional, default type is 'circle', default eventId is the target event's Id.
 * If you set the eventId to the active event Id: $gameTemp.activeEvent().eventId(), the actor will wrap.
 * ==========================================================================================================================
 * v1.07 add command text color option 
 * v1.06 fix compatibility issue with direction mode plugin
 * v1.05 fix wrap exceed map boundary bug. Fix object passability bug
 * v1.04 include a way to cast wrap skill and warp interaction!
 * v1.03 include Actor-enemy and actor-actor interaction.  Add built-in interactions and <condition:XXXX> note tag
 * v1.02 simplify note tag to <act:xxxx>, support moveafteraction plugin better. New plugin command.
 * v1.01 new event note tag and bug fix.
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin requires newly released SRPG_BattlePrepare(7/28/2021), and place it below battlePrepare.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_AdvancedInteraction');
    var _defaultNoInteraction = !!eval(parameters['default no interaction']);
    var _textObject = parameters['text object interaction'] || 'interact';
    var _textUnitEvent = parameters['text unitEvent interaction'] || 'open';
    var _textTalk = parameters['text battler interaction'] || 'talk';
    var _interactionColorId = Number(parameters['interaction command color Id'] || 29);
    var _appearAnimation = Number(parameters['wrap appear Animation Id'] || 52);
    var _disappearAnimation = Number(parameters['wrap disappear Animation Id'] || 52);
// TODO: add plugin parameters for the command text.

//=================================================================================================
//Types and names(you can consider it as subtype)
//=================================================================================================

    Game_System.prototype.setSrpgInteractionType = function(type) {
        this._srpgInteractionType = type;
    }

    Game_System.prototype.clearSrpgInteractionType = function() {
        this._srpgInteractionType = undefined;
    }

    Game_System.prototype.srpgInteractionType = function() {
        return this._srpgInteractionType;
    }

    Game_System.prototype.setSrpgInteractionName = function(name) {
        this._srpgInteractionName = name;
    }

    Game_System.prototype.clearSrpgInteractionName = function() {
        this._srpgInteractionName = undefined;
    }

    Game_System.prototype.srpgInteractionName = function() {
        return this._srpgInteractionName;
    }

    var _Game_System_setAllEventType = Game_System.prototype.setAllEventType
    Game_System.prototype.setAllEventType = function() {
        _Game_System_setAllEventType.call(this);
        $gameMap.events().forEach(function(event) {
            event.initInteractionName();
        });
    }

    Game_Event.prototype.setInteractionName = function(name){
        this._interaction = name;
    }

    Game_Event.prototype.initInteractionName = function(){
        //TODO: set a default interaction type for an event type.
        if (this.event() && this.event().meta.interaction){
           this._interaction = this.event().meta.interaction;
        } else if (this.event() && this.event().meta.act){
           this._interaction = this.event().meta.act;
        } else if (this.isType() === 'unitEvent'){
            this._interaction = _textUnitEvent;
        } else if (_defaultNoInteraction){
            this._interaction = 'null';
        } else if (this.isType() === 'object'){
            this._interaction = _textObject;
        } else if (this.isType() === 'actor' || this.isType() === 'enemy'){
            this._interaction = _textTalk;
        } else {
            this._interaction = 'null';
        }
    }

    Game_Event.prototype.getInteractionName = function(){
        if (!this._interaction) this.initInteractionName();
        return this._interaction;
    }

    Game_Event.prototype.canInteract = function(type, name){
        if (this.isErased() || !this.page() || this.getInteractionName() === 'wait' || 
            this.getInteractionName() === 'null' || this.isType() !== type) return false;
        if (name && name !== this.getInteractionName()) return false;

        var firstLine = this.list()[0]
        if (firstLine.code === 108){
            if (firstLine.parameters[0].match(/\s*<condition:(.+)>/)) {
                var condition = RegExp.$1
                var s = $gameSwitches._data;
                var v = $gameVariables._data;
                var ea = $gameTemp.activeEvent();
                var eb = this;
                var a = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
                var b = undefined;
                if ($gameSystem.EventToUnit(this.eventId())) {
                    var b = $gameSystem.EventToUnit(this.eventId())[1];
                }
                if (!eval(condition)) return false;
            }
        }


        if (['object', 'unitEvent', 'actor', 'enemy'].contains(type)){
            return this.pageIndex() >= 0 && this.list().length > 1; //return false if the page has nothing.
        }
        //TODO: define whether this event can interact with your type and name
    }

//=================================================================================================
//Command creation
//=================================================================================================

//interaction commands stay on top of the other commands.
    var _SRPG_Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        if ($gameSystem.isSRPGMode() == true && $gameSystem.isBattlePhase() == 'actor_phase' && this._actor) {
            this.addInteractionCommands();
        }
        _SRPG_Window_ActorCommand_makeCommandList.call(this);
    };

    Window_ActorCommand.prototype.addInteractionCommands = function() {
        var dist0Events = $gameMap.eventsXy($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY())
        var dist1Events = $gameMap.getSurroundingEvents($gameTemp.activeEvent());// this gets all events that surrounds(distance = 1) the activeEvent
        this.addActorInteractionCommand(dist1Events);
        this.addEnemyInteractionCommand(dist1Events);
        this.addObjectInteractionCommand(dist1Events);
        this.addUnitEventInteractionCommand(dist0Events);
        //TODO: use a function to add your command, make the function similar to the addObjectCommand function
    };

    //TODO: make similar function, this function define in which condition will you add your command, and add if meets condition.

    Window_ActorCommand.prototype.addActorInteractionCommand = function(events) {
        var nameList = []
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('actor')){
                var name = events[i].getInteractionName();
                if (nameList.indexOf(name) < 0) {
                    this.addCommand(name, 'actor', true, name);
                    nameList.push(name);
                }
            }
        }
    };

    Window_ActorCommand.prototype.addEnemyInteractionCommand = function(events) {
        var nameList = []
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('enemy')){
                var name = events[i].getInteractionName();
                if (nameList.indexOf(name) < 0) {
                    this.addCommand(name, 'enemy', true, name);
                    nameList.push(name);
                }
            }
        }
    };

    Window_ActorCommand.prototype.addObjectInteractionCommand = function(events) {
        var nameList = []
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('object')){
                var name = events[i].getInteractionName();
                if (nameList.indexOf(name) < 0) {
                    this.addCommand(name, 'object', true, name);
                    nameList.push(name);
                }
            }
        }
    };

    Window_ActorCommand.prototype.addUnitEventInteractionCommand = function(events) {
        var nameList = []
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('unitEvent')){
                var name = events[i].getInteractionName();
                if (nameList.indexOf(name) < 0) {
                    this.addCommand(name, 'unitEvent', true, name);
                    nameList.push(name);
                }
            }
        }
    };

    Window_ActorCommand.prototype.drawItem = function(index) {
        console.log(this.commandSymbol(index))
        var rect = this.itemRectForText(index);
        var align = this.itemTextAlign();
        if (['object', 'unitEvent', 'actor', 'enemy'].contains(this.commandSymbol(index))){
            this.changeTextColor(this.textColor(_interactionColorId))
        } else{
            this.resetTextColor();
        }
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(this.commandName(index), rect.x, rect.y, rect.width, align);
        this.resetTextColor();
    };

    var _Scene_Map_createSrpgActorCommandWindow = Scene_Map.prototype.createSrpgActorCommandWindow;
    Scene_Map.prototype.createSrpgActorCommandWindow = function(){
        _Scene_Map_createSrpgActorCommandWindow.call(this);
        this._mapSrpgActorCommandWindow.setHandler('object', this.commandObject.bind(this));
        this._mapSrpgActorCommandWindow.setHandler('unitEvent', this.commandUnitEvent.bind(this));
        this._mapSrpgActorCommandWindow.setHandler('actor', this.commandActorInteraction.bind(this));
        this._mapSrpgActorCommandWindow.setHandler('enemy', this.commandEnemyInteraction.bind(this));
        //TODO: bind your symbol/type with commandInteraction, the symbol/type will be used to determine which kind of interaction is required.
    };

    Scene_Map.prototype.commandActorInteraction = function() {
        this.commandObject();
    };

    Scene_Map.prototype.commandEnemyInteraction = function() {
        this.commandObject();
    };

    Scene_Map.prototype.commandObject = function() {
        $gameSystem.setSrpgInteractionType(this._mapSrpgActorCommandWindow.currentSymbol());
        $gameSystem.setSrpgInteractionName(this._mapSrpgActorCommandWindow.currentExt());
        $gameTemp.clearMoveTable();
        var interactionEvents = $gameMap.surroundingInteractionEvents($gameTemp.activeEvent(), $gameSystem.srpgInteractionType(), $gameSystem.srpgInteractionName());
        var confusingEvents = $gameMap.surroundingInteractionEvents($gameTemp.activeEvent(), $gameSystem.srpgInteractionType(), undefined);
        $gameTemp.setAutoMoveDestinationValid(true);
        $gameTemp.setAutoMoveDestination(interactionEvents[0].posX(), interactionEvents[0].posY())
        if (interactionEvents.length === 1 && confusingEvents.length === 1){
            $gameTemp.setTargetEvent(interactionEvents[0]);
            $gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
            $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
            $gameSystem.setSubBattlePhase('start_Interaction');
        } else {
            $gameTemp.makeInteractionTable($gameTemp.activeEvent());
            $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
            $gameSystem.setSubBattlePhase('actor_Interaction');
        }
    };

//its different from commandObject because it only need to check one tile and will always trigger immediately.
    Scene_Map.prototype.commandUnitEvent = function() {
        var x = $gameTemp.activeEvent().posX();
        var y = $gameTemp.activeEvent().posY();
        $gameSystem.setSrpgInteractionType(this._mapSrpgActorCommandWindow.currentSymbol());
        $gameSystem.setSrpgInteractionName(this._mapSrpgActorCommandWindow.currentExt());
        $gameTemp.clearMoveTable();
        $gameTemp.setAutoMoveDestinationValid(true);
        $gameTemp.setAutoMoveDestination(x, y);
        $gameTemp.setTargetEvent($gameMap.getInteractionEvent(x, y));
        $gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
        $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
        $gameSystem.setSubBattlePhase('start_Interaction');
    };

    Scene_Map.prototype.eventUnitEvent = function() {
        $gameMap.eventsXy($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY()).forEach(function(event) {
            if (event.isType() === 'unitEvent' && event.getInteractionName() === 'wait') {
                if (event.pageIndex() >= 0) event.start();
                $gameTemp.pushSrpgEventList(event);
                $gameSystem.pushSearchedItemList([$gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY()]);
            }
        });
    };

//==================================================================================================
//Surrounding events related
//==================================================================================================

//this defines what are the surrounding tiles and returns their location. Here only distance 1 tiles will be included.
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
            events = events.concat($gameMap.eventsXy(xy[0], xy[1]));
        });
        return events;
    }

//get the event that can interact at the specific tile.
    Game_Map.prototype.getInteractionEvent = function(x, y){
        var events = $gameMap.eventsXy(x, y);
        for (var i = 0; i < events.length; i++) {
            if (events[i].canInteract($gameSystem.srpgInteractionType(), $gameSystem.srpgInteractionName())) {
                return events[i];
            }
        }
    }

//get the surrounding events that can interact at the specific tile.
    Game_Map.prototype.surroundingInteractionEvents = function(event, type, name){
        var events = $gameMap.getSurroundingEvents(event);
        var interactionEvents = [];
        for (var i = 0; i < events.length; i++) {
            if (events[i].canInteract(type, name)) {
                interactionEvents.push(events[i]);
            }
        }
        return interactionEvents;
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

//============================================================================
//trigger interaction
//============================================================================
    var _SRPG_Game_Player_startMapEvent = Game_Player.prototype.startMapEvent
    Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
        if ($gameSystem.isSubBattlePhase() === 'actor_Interaction' &&  $gameSystem.isSRPGMode() == true && !$gameMap.isEventRunning() ){
            if (triggers[0] !== 0 || $gameTemp.RangeTable(x, y)[0] !== true) return;

            if ($gameSystem.srpgInteractionType() === 'wrap'){
                var targetArray = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())
                var tag = targetArray ? targetArray[1].srpgThroughTag() : 0;
                if ($gameTemp.targetEvent().srpgMoveCanPass(x, y, 5, tag) && $gameMap.positionIsOpen(x, y)){
                    $gameSystem.setSubBattlePhase('start_Interaction');
                } else SoundManager.playBuzzer();
                return;
            }

            var event = $gameMap.getInteractionEvent(x, y);
            if (event){
                $gameTemp.setTargetEvent(event);
                $gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
                $gameSystem.setSubBattlePhase('start_Interaction');
            } else SoundManager.playBuzzer();

        } else _SRPG_Game_Player_startMapEvent.call(this, x, y, triggers, normal)
    };

    Scene_Map.prototype.triggerInteraction = function(){
        var type = $gameSystem.srpgInteractionType();
        var name = $gameSystem.srpgInteractionName();
        if (['object', 'unitEvent', 'actor', 'enemy'].contains(type)){
            this.startRegularInteraction();
        } 
        if (type === 'wrap'){
            this.startWrap();
        }
        //TODO: else if ... do other interaction, build a function for the interaction as startObjectInteraction function
    }

//TODO: make a similar function to define what the specific interaction should do.
    Scene_Map.prototype.startRegularInteraction = function(){
        var event = $gameTemp.targetEvent();
        event.turnTowardCharacter($gameTemp.activeEvent());
        $gameTemp.activeEvent().turnTowardCharacter(event);
        event.start();
        $gameTemp.pushSrpgEventList(event);
        $gameSystem.pushSearchedItemList([event.posX(), event.posY()]);
        $gameSystem.clearSrpgInteractionType();
        $gameSystem.clearSrpgInteractionName();
    }

    Scene_Map.prototype.startWrap = function(){
        $gameTemp.targetEvent().setPosition($gamePlayer.posX(), $gamePlayer.posY());
        $gameTemp.targetEvent().turnTowardCharacter($gameTemp.activeEvent());
        $gameTemp.activeEvent().turnTowardCharacter($gameTemp.targetEvent());
        $gameTemp.targetEvent().requestAnimation(_appearAnimation);
        $gameTemp.clearWrapInfo();
        $gameSystem.clearSrpgInteractionType();
        $gameTemp.targetEvent().setTransparent(false);
    }


    var _SRPG_MB_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_MB_SceneMap_update.call(this);
        if ($gameSystem.isSRPGMode() && $gameSystem.isSubBattlePhase() === 'start_Interaction') {
            if ($gameSystem.srpgInteractionType()) this.triggerInteraction();
            if (!$gameSystem.srpgInteractionType() && !$gameMap.isEventRunning()){
                // considering the moveAfterAction plugin, I copied the commandwait contents here, rather than call it
                var actor = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1];
                actor.onAllActionsEnd();
                this.srpgAfterAction();
                $gameSystem.clearSrpgInteractionName();
            }
        }
    };

    var _Scene_Map_srpgCancelActorTarget = Scene_Map.prototype.srpgCancelActorTarget
    Scene_Map.prototype.srpgCancelActorTarget = function(){
        if ($gameSystem.srpgInteractionType() === 'wrap'){
            $gameSystem.setSubBattlePhase('start_Interaction');
            $gameSystem.clearSrpgInteractionType();
            $gameTemp.targetEvent().requestAnimation(_appearAnimation);
            $gameTemp.clearWrapInfo();
            $gameTemp.targetEvent().setTransparent(false);
        } else{
            _Scene_Map_srpgCancelActorTarget.call(this);
            $gameSystem.clearSrpgInteractionType();
            $gameSystem.clearSrpgInteractionName();
        }
    }

//============================================================================
//wrap
//============================================================================

    Game_Interpreter.prototype.wrap = function(size, type, eventId) {
        if (eventId) $gameTemp.setTargetEvent($gameMap.event(eventId));
        $gameTemp.setWrapInfo(size, type);
        $gameTemp.targetEvent().requestAnimation(_disappearAnimation);
        $gameTemp.targetEvent().setTransparent(true);
        $gameSystem.setSrpgInteractionType('wrap');
        $gameSystem.setBattlePhase('actor_phase');
        $gameSystem.setSubBattlePhase('actor_Interaction');
        $gameTemp.clearMoveTable();
        $gameTemp.drawWarpCell();
    }

    Game_Temp.prototype.setWrapInfo = function(size, type){
        this._wrapInfo = {
            size : size,
            type : type
        };
    }

    Game_Temp.prototype.wrapInfo = function(){
        return this._wrapInfo;
    }

    Game_Temp.prototype.clearWrapInfo = function(){
        this._wrapInfo = undefined;
    }

    var _Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        if ($gameSystem.srpgInteractionType() !== 'wrap'){
            _Scene_Map_srpgAfterAction.call(this);
        } else{
            $gameSystem.setBattlePhase('actor_phase');
            $gameSystem.setSubBattlePhase('actor_Interaction');
        }
    };

    Game_Temp.prototype.drawWarpCell = function(){
        var size = this.wrapInfo().size;
        var type = this.wrapInfo().type;
        var width = $gameMap.width();
        var height = $gameMap.height();
        for (var x = 0; x < 1+size*2; x++) {
            for (var y = 0; y < 1+size*2; y++) {
                var aoex = x-size + this.targetEvent().posX();
                var aoey = y-size + this.targetEvent().posY();
                if ($gameMap.isLoopVertical()) aoex = ((aoex % width) + width) % width;
                if ($gameMap.isLoopHorizontal()) aoey = ((aoey % height) + height) % height;
                if ($gameMap.inArea(x-size, y-size, size, 1, type) && $gameMap.isValid(aoex, aoey)) {
                    this.setRangeTable(aoex,aoey, true, null);
                    this.pushMoveList([aoex, aoey, false]);
                }
            }
        }
        this.setResetMoveList(true);
    }

    if (!Game_Map.prototype.positionIsOpen){
        Game_Map.prototype.positionIsOpen = function(x, y) {
            return this.events().every(function(event) {
                if (event.isErased() || !event.pos(x, y) || !event.isType()) return true;
                if (event.isType() === 'actor') return false;
                if (event.isType() === 'enemy') return false;
                if (event.isType() === 'object' && event.characterName() !== '') return false;
                if (event.isType() === 'playerEvent') return false;
                return true;
            });
        };
    }

    Game_Event.prototype.canPass = function(x, y, d) {
        if ($gameSystem.isSRPGMode() && this.isType() == 'object'){
            var x2 = $gameMap.roundXWithDirection(x, d);
            var y2 = $gameMap.roundYWithDirection(y, d);
            if (!$gameMap.isValid(x2, y2)) {
                return false;
            }
            if (this.isThrough() || this.isDebugThrough()) {
                return true;
            }
            if (!this.isMapPassable(x, y, d)) {
                return false;
            }
            if (this.isCollidedWithCharacters(x2, y2)) {
                return false;
            }
            return true;
        } else return Game_CharacterBase.prototype.canPass.call(this, x, y, d)
    };

    // Game_Character.prototype.setSelected = function(val){
    //     this._isSelected = val;
    // }

    // Game_Character.prototype.isSelected = function(){
    //     return this._isSelected;
    // }
    //         // $gameMap.setActiveEvent(store);
    // var _Sprite_Character_updateVisibility = Sprite_Character.prototype.updateVisibility
    // Sprite_Character.prototype.updateVisibility = function() {
    //     _Sprite_Character_updateVisibility.call(this);
    //     if (this._character.isSelected()){
    //         if (this._frameCount === undefined) this._frameCount = 0;
    //         this._frameCount = (this._frameCount + 1) % 60;
    //         this.visible = this._frameCount <= 30;
    //     }
    // };

})();
