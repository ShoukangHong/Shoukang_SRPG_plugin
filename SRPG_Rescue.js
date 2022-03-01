//====================================================================================================================
// SRPG_Rescue.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit     v1.00 First release
//====================================================================================================================
/*:
 * @plugindesc Add Advanced interaction for SRPG battle.
 * @author Shoukang
 *
 * @param text rescue
 * @desc default text for Rescue interaction.
 * @default Rescue
 *
 * @param text drop
 * @desc default text for drop interaction.
 * @default Drop
 *
 * @param rescue requirenment formula
 * @desc default requirenment for rescue interaction.
 * @default a.agi - b.agi >= 4
 *
 * @param rescue sprite
 * @type file
 * @dir img/characters/
 * @desc default sprite to indicate that a unit have rescued battler
 * @default $Rescue
 *
 * @help
 * Allow battlers to rescue/drop actors.
 * If the carrier dies, the rescued unit will drop regardless of the tile passibility.
 * Need a rescue sprite. Get a sample here: https://github.com/ShoukangHong/Shoukang_SRPG_plugin/blob/main/Demos/%24Rescue.png
 * Place the image in img/characters/
 * ==========================================================================================================================
 * actor/class note tag:
 * <carrier>  give a carrier meta property to the actor/actor class.
 * You can check for this property in the rescue requirenment formula, for example:
 * (a.actor().meta.carrier || a.currentClass().meta.carrier) && a.agi - b.agi >= 4
 * The '(a.actor().meta.carrier || a.currentClass().meta.carrier)' part check for the meta data.
 * ==========================================================================================================================
 * v1.00 first release!
 * =========================================================================================================================
 * Compatibility:
 * This plugin requires SRPG_BattlePrepare and SRPG_AdvancedInteraction(updated 3/1/2022), and place it below them.
 */

(function () {
    'use strict';
    var parameters = PluginManager.parameters('SRPG_Rescue');
    var _textRescue = parameters['text rescue'] || 'Rescue';
    var _textDrop = parameters['text drop'] || 'Drop';
    var _rescueFormula = parameters['rescue requirenment formula'] || 'a.agi - b.agi >= 4';
    var _rescueSprite = parameters['rescue sprite'] || '$Rescue';

    var _Window_ActorCommand_addActorInteractionCommand = Window_ActorCommand.prototype.addActorInteractionCommand
    Window_ActorCommand.prototype.addActorInteractionCommand = function(events) {
        _Window_ActorCommand_addActorInteractionCommand.call(this, events);
        for (var i = 0; i < events.length; i++){
            if(events[i].canInteract('rescue')){
                this.addCommand(_textRescue, 'rescue', true);
                return;
            }
        }
        if ($gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].rescuedBattler()){
            this.addCommand(_textDrop, 'drop', true);
        }
    };

    var _Window_ActorCommand_highlightSymbolList = Window_ActorCommand.prototype.highlightSymbolList
    Window_ActorCommand.prototype.highlightSymbolList = function(){
        return _Window_ActorCommand_highlightSymbolList.call(this).concat(['rescue', 'drop'])
    }

    var _Scene_Map_createSrpgActorCommandWindow = Scene_Map.prototype.createSrpgActorCommandWindow;
    Scene_Map.prototype.createSrpgActorCommandWindow = function(){
        _Scene_Map_createSrpgActorCommandWindow.call(this);
        this._mapSrpgActorCommandWindow.setHandler('rescue', this.commandRescue.bind(this));
        this._mapSrpgActorCommandWindow.setHandler('drop', this.commandDrop.bind(this));
    };

    Scene_Map.prototype.commandRescue = function() {
        $gameSystem.setSrpgInteractionType('rescue');
        $gameSystem.setBattlePhase('actor_phase');
        $gameSystem.setSubBattlePhase('actor_Interaction');
        $gameTemp.clearMoveTable();
        $gameTemp.makeInteractionTable($gameTemp.activeEvent());
        $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
    };

    Scene_Map.prototype.commandDrop = function() {
        var actor = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]
        $gameTemp.setTargetEvent(actor.rescuedBattler().event());
        $gameSystem.setSrpgInteractionType('drop');
        $gameSystem.setBattlePhase('actor_phase');
        $gameSystem.setSubBattlePhase('actor_Interaction');
        $gameTemp.clearMoveTable();
        $gameSystem.clearSrpgActorCommandWindowNeedRefresh();
        $gameTemp.makeInteractionTable($gameTemp.activeEvent());
    }

    var _SRPG_Game_Player_startInteractionEvent = Game_Player.prototype.startInteractionEvent
    Game_Player.prototype.startInteractionEvent = function(x, y, triggers, normal) {
        if ($gameSystem.srpgInteractionType() === 'drop'){
            $gameTemp.targetEvent().appear()//appear so that srpgMoveCanPass can work properly
            $gameTemp.activeEvent().turnTowardPlayer()
            var targetArray = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())
            var tag = targetArray ? targetArray[1].srpgThroughTag() : 0;
            if ($gameTemp.targetEvent().srpgMoveCanPass($gameTemp.activeEvent().posX(), $gameTemp.activeEvent().posY(), $gameTemp.activeEvent().direction(), tag) &&
                $gameMap.positionIsOpen(x, y)){
                $gameSystem.setSubBattlePhase('start_Interaction');
            } else {
                SoundManager.playBuzzer();
            }
            $gameTemp.targetEvent().erase()
        } else _SRPG_Game_Player_startInteractionEvent.call(this, x, y, triggers, normal)
    }

    var _Scene_Map_triggerInteraction = Scene_Map.prototype.triggerInteraction
    Scene_Map.prototype.triggerInteraction = function(){
        var type = $gameSystem.srpgInteractionType();
        if (type == 'rescue'){
            this.startRescue();
        } else if (type === 'drop'){
            this.startDrop($gameTemp.activeEvent(), $gameTemp.targetEvent(), $gamePlayer.posX(), $gamePlayer.posY());
        } else {
            _Scene_Map_triggerInteraction.call(this)
        }
    }


    Scene_Map.prototype.startRescue = function(){
        var event = $gameTemp.targetEvent();
        event.turnTowardCharacter($gameTemp.activeEvent());
        $gameTemp.activeEvent().turnTowardCharacter(event);
        var a = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1]
        var b = $gameSystem.EventToUnit($gameTemp.targetEvent().eventId())[1]
        a.setRescuedBattler(b)
        $gameTemp.targetEvent().erase()
        $gameSystem.clearSrpgInteractionType();
        $gameSystem.clearSrpgInteractionName();
        $gameSystem.clearSrpgActorCommandStatusWindowNeedRefresh();
    }

    Scene_Map.prototype.startDrop = function(userEvent, targetEvent, x, y){
        var actor = $gameSystem.EventToUnit(userEvent.eventId())[1]
        targetEvent.setPosition(x, y);
        targetEvent.appear()
        actor.setRescuedBattler(false)
        targetEvent.turnTowardCharacter(userEvent);
        userEvent.turnTowardCharacter(targetEvent);
        $gameSystem.clearSrpgInteractionType();
        targetEvent.refreshImage();
        this._spriteset._characterSprites.forEach(function(sprite) {
            if (sprite._character instanceof Game_Event && sprite._character === targetEvent) {
                sprite.show()
            }
        });
    }

    var _Game_Event_canInteract = Game_Event.prototype.canInteract
    Game_Event.prototype.canInteract = function(type, name){
        if (type == 'rescue'){
            if (!this.isErased() && this.isType() == 'actor'){
                var battlerArray = $gameSystem.EventToUnit(this.eventId())
                if (battlerArray && battlerArray[1] && battlerArray[1].isAlive()){
                    return $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[1].canRescue(battlerArray[1])
                }
            }
        } else return _Game_Event_canInteract.call(this, type, name)
    }

    //deal with turn end and end srpg
    var shoukang_Scene_Map_isSrpgActorTurnEnd = Scene_Map.prototype.isSrpgActorTurnEnd;
    Scene_Map.prototype.isSrpgActorTurnEnd = function() {//the true/false here is confusing......true is not turn end, false is turn end
        if (!shoukang_Scene_Map_isSrpgActorTurnEnd.call(this)) return false;
        return $gameMap.events().some(function(event) {
            var battlerArray = $gameSystem.EventToUnit(event.eventId());
            if (battlerArray && battlerArray[0] === 'actor' && !event.isErased() && !battlerArray[1].isRestricted()) {
                return battlerArray[1].canInput();
            }
        });
    };

    var _Scene_Map_srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        _Scene_Map_srpgAfterAction.call(this)
        $gameMap.events().forEach(function (event) {
            if (event.isErased() && event.isType() == 'actor'){
                var battlerArray = $gameSystem.EventToUnit(event.eventId())
                if (battlerArray && battlerArray[1] && battlerArray[1].isDead() && battlerArray[1].rescuedBattler()){
                    this.startDrop(event, battlerArray[1].rescuedBattler().event(), event.posX(), event.posY())
                }
            }
        }, this);
    };

    var _Game_System_endSRPG = Game_System.prototype.endSRPG
    Game_System.prototype.endSRPG = function() {
        $gameMap.events().forEach(function(event) {
            var battlerArray = $gameSystem.EventToUnit(event.eventId());
            if (battlerArray && (battlerArray[0] === 'actor')) {
                battlerArray[1].setRescuedBattler(false)
            }
        });
        _Game_System_endSRPG.call(this);
    };

    //deal with sprites
    var _SRPG_Sprite_Character_setCharacterBitmap = Sprite_Character.prototype.setCharacterBitmap;
    Sprite_Character.prototype.setCharacterBitmap = function() {
        _SRPG_Sprite_Character_setCharacterBitmap.call(this);
        this._rescueBitmap = ImageManager.loadCharacter(_rescueSprite);
    };

    var _SRPG_Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        _SRPG_Sprite_Character_updateCharacterFrame.call(this);
        if ($gameSystem.isSRPGMode() == true && this._character.isEvent() == true && !this._character.isErased()) {
            var battlerArray = $gameSystem.EventToUnit(this._character.eventId());
            if (battlerArray && battlerArray[1] && battlerArray[1].rescuedBattler() && battlerArray[1].isAlive()) {
                if (this.previousPatternX === this.characterPatternX()) return 
                var pw = this._rescueBitmap.width/3;
                var ph = this._rescueBitmap.height;
                var sx = this.characterPatternX() * pw;
                var sy = 0;
                this.createRescueSprite();
                this._rescueSprite.bitmap = this._rescueBitmap;
                if (this.characterPatternX() === 0) {
                    this._rescueSprite.visible = !this._rescueSprite.visible;
                }
                this._rescueSprite.setFrame(sx, sy, pw, ph);
                this.previousPatternX = this.characterPatternX()
            } else if (this._rescueSprite) {
            this.removeChild(this._rescueSprite);
            this._rescueSprite = null;
            }
        } else if (this._rescueSprite) {
            this.removeChild(this._rescueSprite);
            this._rescueSprite = null;
        }
    };

    Sprite_Character.prototype.createRescueSprite = function() {
        if (!this._rescueSprite) {
            this._rescueSprite = new Sprite();
            this._rescueSprite.anchor.x = 0.5;
            this._rescueSprite.anchor.y = 1;
            this.addChild(this._rescueSprite);
        }
    };

    //Game BattlerBase
    Game_BattlerBase.prototype.canRescue = function(b){
        var a = this
        if (!a.rescuedBattler() && !b.rescuedBattler() && a.isActor() && b.isActor()){
            return eval(_rescueFormula)
        }
    }

    Game_BattlerBase.prototype.rescuedBattler = function(){
        return this._rescuedBattler
    }

    Game_BattlerBase.prototype.setRescuedBattler = function(b){
        this._rescuedBattler = b
    }

})();
