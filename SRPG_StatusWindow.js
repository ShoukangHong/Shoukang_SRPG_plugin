//====================================================================================================================
// SRPG_StatusWindow.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit    V1.00 First Release
//====================================================================================================================
/*:
 * @plugindesc This plugin allows you to show multiple status pages in SRPG battle and open status window from actor command window
 * @author Shoukang
 *
 * @param enable actor status command
 * @type boolean
 * @default false
 *
 * @param window width
 * @desc the width of status window
 * @type number
 * @default 408
 *
 * @param windowHeight
 * @desc Number of text lines the window can have.
 * @type number
 * @default 10
 *
 * @param number of pages
 * @desc Number of pages the status window have
 * @type number
 * @default 3
 *
 * @help
 *
 * This plugin allows you to show multiple status pages in SRPG battle.
 * You need to code yourself to show the contents.
 * I left the TODO notes and examples for you to DIY your status window. Just serch for 'TODO',
 * and play around with the code. Drawing text is easy to learn.(but hard to master).
 * If you scroll to the bottom I also copy and paste some functions used (such as 'drawBasicInfoActor')
 * so you know what they are doing.
 * ==========================================================================================================================
 * Compatibility:
 * Place it below SRPG_UX_Window and SRPG_BattleUI
 * =========================================================================================================================
 * v1.00 first release!
 */

(function(){
    var params = PluginManager.parameters('SRPG_StatusWindow');
    var _enableStatus = !!eval(params['enable actor status command']);
    var _width = Number(params['window width'] || 408);
    var _height = Number(params['windowHeight'] || 10);
    var _pages = Number(params['number of pages'] || 3);

    var _Window_SrpgStatus_initialize = Window_SrpgStatus.prototype.initialize
    Window_SrpgStatus.prototype.initialize = function(x, y) {
        _Window_SrpgStatus_initialize.call(this, x, y);
        this._page = 0;
        this.refresh();
    };

    var _SRPG_Game_Player_triggerAction = Game_Player.prototype.triggerAction;
    Game_Player.prototype.triggerAction = function() {
        if ($gameSystem.isSRPGMode() && $gameSystem.isSubBattlePhase() === 'status_window') {
            if (Input.isTriggered('ok') || TouchInput.isTriggered()) {
                $gameSystem.setSrpgStatusWindowNextPage();
                return true;
            }
        }
        return _SRPG_Game_Player_triggerAction.call(this);
    }

    Game_System.prototype.setSrpgStatusWindowNextPage = function(){
        this._SrpgStatusWindowPageNext = true;
    }

    Game_System.prototype.clearSrpgStatusWindowNextPage = function(){
        this._SrpgStatusWindowPageNext = false;
    }

    Game_System.prototype.srpgStatusWindowNextPage = function(){
        return this._SrpgStatusWindowPageNext;
    }

    Game_System.prototype.setActorCommandStatus = function(){
        this._isActorCommandStatus = true;
    }

    Game_System.prototype.clearActorCommandStatus = function(){
        this._isActorCommandStatus = false;
    }

    Game_System.prototype.isActorCommandStatus = function(){
        return this._isActorCommandStatus;
    }

    var _SRPG_SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SRPG_SceneMap_update.call(this);
        if ($gameSystem.isSRPGMode()) {
            if ($gameSystem.srpgStatusWindowNextPage()){
                SoundManager.playOk();
                this._mapSrpgStatusWindow.nextPage();
                $gameSystem.clearSrpgStatusWindowNextPage();
            }
        }
    }

    var _updateCallMenu = Scene_Map.prototype.updateCallMenu;
    Scene_Map.prototype.updateCallMenu = function() {
        if ($gameSystem.isSRPGMode() && !$gameSystem.srpgWaitMoving()) {
            if ($gameSystem.isSubBattlePhase() === 'status_window' && this.isMenuCalled()) {
                $gameSystem.clearSrpgStatusWindowNeedRefresh();
                SoundManager.playCancel();
                if ($gameSystem.isActorCommandStatus()){
                    $gameSystem.setSubBattlePhase('actor_command_window');
                    $gameSystem.clearSrpgStatusWindowNeedRefresh();
                    this._mapSrpgActorCommandWindow.activate();
                } else {
                    $gameTemp.clearActiveEvent();
                    $gameSystem.setSubBattlePhase('normal');
                    $gameTemp.clearMoveTable();
                }
                return;
            }
        }
        _updateCallMenu.call(this);
    };

    //change the window priority
    var _SRPG_SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _SRPG_SceneMap_createAllWindows.call(this);
        this._windowLayer.removeChild(this._mapSrpgStatusWindow);
        this.createSrpgStatusWindow();
    };

    var _Scene_Map_createSrpgActorCommandWindow = Scene_Map.prototype.createSrpgActorCommandWindow;
    Scene_Map.prototype.createSrpgActorCommandWindow = function(){
        _Scene_Map_createSrpgActorCommandWindow.call(this);
        this._mapSrpgActorCommandWindow.setHandler('status', this.commandStatus.bind(this));
    };

    Scene_Map.prototype.commandStatus = function() {
        var battlerArray = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId());
        SoundManager.playOk();
        $gameTemp.setResetMoveList(true);
        $gameSystem.setActorCommandStatus();
        $gameSystem.setSrpgStatusWindowNeedRefresh(battlerArray);
        $gameSystem.setSubBattlePhase('status_window');
    };

    var _Scene_Map_selectPreviousActorCommand = Scene_Map.prototype.selectPreviousActorCommand
    Scene_Map.prototype.selectPreviousActorCommand = function() {
        if ($gameSystem.isActorCommandStatus()) {
            $gameSystem.clearActorCommandStatus();
            this._mapSrpgActorCommandWindow.activate();
        } else _Scene_Map_selectPreviousActorCommand.call(this);
    }


    Window_ActorCommand.prototype.addSrpgStatusCommand = function() {
        if (_enableStatus) this.addCommand(TextManager.status, 'status');
    }

    //a bad idea to add the status command here... 
    var _Window_ActorCommand_addWaitCommand = Window_ActorCommand.prototype.addWaitCommand
    Window_ActorCommand.prototype.addWaitCommand = function() {
        this.addSrpgStatusCommand();
        _Window_ActorCommand_addWaitCommand.call(this);
    };

    var _Window_SrpgStatus_clearBattler = Window_SrpgStatus.prototype.clearBattler
    Window_SrpgStatus.prototype.clearBattler = function() {
        this._page = 0;
        _Window_SrpgStatus_clearBattler.call(this);
    };

    Window_SrpgStatus.prototype.windowWidth = function() {
        return _width;
    };

    Window_SrpgStatus.prototype.windowHeight = function() {
        return this.fittingHeight(_height);
    };

    Window_SrpgStatus.prototype.nextPage = function() {
        this._page = (this._page + 1) % _pages;
        this.refresh();
    };

    Window_SrpgStatus.prototype.drawContentsActor = function() {
        var lineHeight = this.lineHeight();
        if (this._page == 0){ 
            //TODO: this part is for page 0
            this.drawActorName(this._battler, 6, lineHeight * 0);
            this.drawActorClass(this._battler, 192, lineHeight * 0);
            this.drawActorFace(this._battler, 6, lineHeight * 1);
            this.drawBasicInfoActor(176, lineHeight * 1);
            this.drawActorSrpgEqiup(this._battler, 6, lineHeight * 5);
            this.drawParameters(6, lineHeight * 6);
            this.drawSrpgParameters(6, lineHeight * 9);
        } else if (this._page == 1){
            //TODO: this part is for page 1, the code here is just an example
            this.drawActorFace(this._battler, 6, lineHeight * 1);
            this.drawBasicInfoActor(176, lineHeight * 1);
            this.drawText('actor page 1', 6, lineHeight * 0);
            //an example to draw element rate
            this.changeTextColor(this.systemColor());
            this.drawText('fire', 6, lineHeight * 5, 120);
            this.drawText('ice', 6, lineHeight * 6, 120);
            this.resetTextColor();
            this.drawText(this._battler.elementRate(2) * 100 + '%', 6 + 120, lineHeight * 5, 48, 'right');
            this.drawText(this._battler.elementRate(3) * 100 + '%', 6 + 120, lineHeight * 6, 48, 'right');
        } else if (this._page == 2){
            //TODO: this part is for page 2, the code here is just an example
            this.drawText('actor page 2', 6, lineHeight * 0)

            //an example to draw equipments
            var equips = this._battler.equips();
            var count = equips.length;
            for (var i = 0; i < count; i++) {
                this.drawItemName(equips[i], 6, lineHeight * 1 + this.lineHeight() * i);
            }
        }
        //Feel free to add/remove pages.
    };

    Window_SrpgStatus.prototype.drawContentsEnemy = function() {
        var lineHeight = this.lineHeight();
        if (this._page == 0){
            //TODO: this part is for page 0
            this.drawActorName(this._battler, 6, lineHeight * 0);
            this.drawEnemyClass(this._battler, 192, lineHeight * 0);
            this.drawEnemyFace(this._battler, 6, lineHeight * 1);
            this.drawBasicInfoEnemy(176, lineHeight * 1);
            this.drawEnemySrpgEqiup(this._battler, 6, lineHeight * 5);
            this.drawParameters(6, lineHeight * 6);
            this.drawSrpgParameters(6, lineHeight * 9);
        } else if (this._page == 1){
            //TODO: this part is content for page 1, the code here is just an example
            this.drawEnemyFace(this._battler, 6, lineHeight * 1);
            this.drawBasicInfoEnemy(176, lineHeight * 1);
            this.drawText('enemy page 1', 6, lineHeight * 0);

            //an example to draw element rate
            this.changeTextColor(this.systemColor());
            this.drawText('fire', 6, lineHeight * 5, 120);
            this.drawText('ice', 6, lineHeight * 6, 120);
            this.resetTextColor();
            this.drawText(this._battler.elementRate(2) * 100 + '%', 6 + 120, lineHeight * 5, 48, 'right');
            this.drawText(this._battler.elementRate(3) * 100 + '%', 6 + 120, lineHeight * 6, 48, 'right');
        } else if (this._page == 2){
            //TODO: this part is content for page 2
            this.drawText('enemy page 2', 6, lineHeight * 0)
        }
        //Feel free to add/remove pages.
    };

/* copied from SRPG_Core for reference, you can uncomment it and edit here to change whatever.
    //parameters from core.
    var parameters = PluginManager.parameters('SRPG_core');
    var _enemyDefaultClass = parameters['enemyDefaultClass'] || 'エネミー';
    var _textSrpgEquip = parameters['textSrpgEquip'] || '装備';
    var _textSrpgMove = parameters['textSrpgMove'] || '移動力';
    var _textSrpgRange = parameters['textSrpgRange'] || '射程';
    var _textSrpgWait = parameters['textSrpgWait'] || '待機';
    var _textSrpgTurnEnd = parameters['textSrpgTurnEnd'] || 'ターン終了';
    var _textSrpgAutoBattle = parameters['textSrpgAutoBattle'] || 'オート戦闘';
    var _srpgBattleQuickLaunch = parameters['srpgBattleQuickLaunch'] || 'true';
    var _srpgActorCommandEquip = parameters['srpgActorCommandEquip'] || 'true';
    var _srpgBattleEndAllHeal = parameters['srpgBattleEndAllHeal'] || 'true';

    Window_SrpgStatus.prototype.refresh = function() {
        this.contents.clear();
        if (!this._battler) {
          return;
        }
        if (this._type === 'actor') {
            this.drawContentsActor();
        } else if (this._type === 'enemy') {
            this.drawContentsEnemy();
        }
    };

    Window_SrpgStatus.prototype.drawBasicInfoActor = function(x, y) {
        var lineHeight = this.lineHeight();
        this.drawSrpgExpRate(this._battler, x, y + lineHeight * 0);
        this.drawActorLevel(this._battler, x, y + lineHeight * 0);
        this.drawActorIcons(this._battler, x, y + lineHeight * 1);
        this.drawActorHp(this._battler, x, y + lineHeight * 2);
        if ($dataSystem.optDisplayTp) {
            this.drawActorMp(this._battler, x, y + lineHeight * 3, 90);
            this.drawActorTp(this._battler, x + 96, y + lineHeight * 3, 90);
        } else {
            this.drawActorMp(this._battler, x, y + lineHeight * 3);
        }
    };

    Window_SrpgStatus.prototype.drawBasicInfoEnemy = function(x, y) {
        var lineHeight = this.lineHeight();
        this.drawEnemyLevel(this._battler, x, y + lineHeight * 0);
        this.drawActorIcons(this._battler, x, y + lineHeight * 1);
        this.drawActorHp(this._battler, x, y + lineHeight * 2);
        if ($dataSystem.optDisplayTp) {
            this.drawActorMp(this._battler, x, y + lineHeight * 3, 90);
            this.drawActorTp(this._battler, x + 96, y + lineHeight * 3, 90);
        } else {
            this.drawActorMp(this._battler, x, y + lineHeight * 3);
        }
    };

    Window_SrpgStatus.prototype.drawParameters = function(x, y) {
        var lineHeight = this.lineHeight();
        for (var i = 0; i < 6; i++) {
            var paramId = i + 2;
            var x2 = x + 188 * (i % 2);
            var y2 = y + lineHeight * Math.floor(i / 2);
            this.changeTextColor(this.systemColor());
            this.drawText(TextManager.param(paramId), x2, y2, 120);
            this.resetTextColor();
            this.drawText(this._battler.param(paramId), x2 + 120, y2, 48, 'right');
        }
    };

    Window_SrpgStatus.prototype.drawSrpgParameters = function(x, y) {
        var lineHeight = this.lineHeight();
        this.changeTextColor(this.systemColor());
        this.drawText(_textSrpgMove, x, y, 120);
        this.resetTextColor();
        this.drawText(this._battler.srpgMove(), x + 120, y, 48, 'right');
        this.changeTextColor(this.systemColor());
        this.drawText(_textSrpgRange, x + 188, y, 120);
        this.resetTextColor();
        var text = '';
        if (this._battler.srpgWeaponMinRange() > 0) {
            text += this._battler.srpgWeaponMinRange() + '-';
        }
        text += this._battler.srpgWeaponRange();
        this.drawText(text, x + 188 + 72, y, 96, 'right');
    };
*/

})();