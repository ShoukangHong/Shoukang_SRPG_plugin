//====================================================================================================================
// SRPG_StatusWindow.js
//--------------------------------------------------------------------------------------------------------------------
// free to use and edit    v1.01 Remove all magic numbers! Better compatibility and easier to change the format! Most farwing functions are overwritten here.
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

 * @param textSrpgSkills
 * @desc Name of skills show on SRPG status window.
 * @default Skills
 *
 * @param textSRPGRewards
 * @desc Name of skills show on SRPG status window.
 * @default Rewards
 *
 * @help
 *
 * This plugin allows you to show multiple status pages in SRPG battle.
 * Click Ok will go to next page, click cancel will close the window.
 * You need to code yourself to show the contents.
 * I left some notes, examples and built-in methods for you to DIY your status window. Just serch for 'TODO', and 'Important'
 * and play around with the code. Drawing text is easy to learn.(but hard to master).
 *
 * If this version looks too scary, you can try the old version in my github--shoukang_SRPG_Plugins--OldVersion folder.
 * ==========================================================================================================================
 * Compatibility:
 * Place it below SRPG_UX_Window and SRPG_BattleUI
 * =========================================================================================================================
 * v1.01 Remove all magic numbers! Better compatibility and easier to change the format! Most farwing functions are overwritten here.
 * v1.00 First release!
 */

(function(){
    var params = PluginManager.parameters('SRPG_StatusWindow');
    var _enableStatus = !!eval(params['enable actor status command']);
    var _width = Number(params['window width'] || 408);
    var _height = Number(params['windowHeight'] || 10);
    var _pages = Number(params['number of pages'] || 3);
    var _textSkills = params['textSrpgSkills'] || 'Skills';
    var _textRewards = params['textSRPGRewards'] || 'Rewards';
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

//========================================================================================================
//Realize multiple page interaction.
//========================================================================================================
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

//========================================================================================================
//Overwrite Window_SrpgStatus functions
//========================================================================================================
    var _Window_SrpgStatus_initialize = Window_SrpgStatus.prototype.initialize
    Window_SrpgStatus.prototype.initialize = function(x, y) {
        _Window_SrpgStatus_initialize.call(this, x, y);
        this._page = 0;
        this.refresh();
    };

    Window_SrpgStatus.prototype.refresh = function() {
        this.contents.clear();
        this.loadFormat();
        if (!this._battler) {
          return;
        }
        if (this._type === 'actor') {
            this.drawContentsActor();
        } else if (this._type === 'enemy') {
            this.drawContentsEnemy();
        }
    };

    //Important: Format information for most layout! You can change the values to change the layout.
    // Status window layout: (standard padding near left border apply automatically)
    // |..............Status Window width...................|
    // |....|..|........|....|..|..|..|........|....|..|....|
    // | sp |tp|   lw   | cw |tp|tp|tp|   lw   | cw |tp| sp |
    //      |      half  width     |     half width       |
    Window_SrpgStatus.prototype.loadFormat = function() {
        var fmt = {}
        fmt.lh = this.lineHeight();                                     //line height
        fmt.tp = this.textPadding();                                    //text padding
        fmt.sp = this.standardPadding();                                //standard padding
        fmt.hw = Math.floor((this.windowWidth() + fmt.tp)/2) - fmt.sp;  //half width, aka start position of column 2
        fmt.fw = Window_Base._faceWidth;                                //face width
        fmt.lw = Math.floor((fmt.hw - 3 * fmt.tp) *2/3);                //label width (for example: ATK, DEF, etc)
        fmt.cw = fmt.hw - fmt.lw - 3 * fmt.tp;                          //content width (for example: a.atk, a.def, etc)
        fmt.gaugeWidth = 186;                                           //hp, mp, tp gauge width
        fmt.halfGaugeWidth = Math.floor((fmt.gaugeWidth - fmt.tp)/2);   //hp, mp, tp gauge width, when put 2 in 1 row
        fmt.equipLabelWidth = fmt.lw + fmt.cw - Window_Base._iconWidth;
        fmt.equipContentWidth = this.windowWidth() - fmt.equipLabelWidth - 2 * fmt.tp - 2 * fmt.sp;
        fmt.itemLabelWidth = fmt.equipLabelWidth;
        fmt.itemValueWidth = fmt.cw;                                    //tp cost, mp cost, etc.
        fmt.itemNameWidth = fmt.equipContentWidth - fmt.itemValueWidth;

        this._format = fmt; //store the format
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
        //all the format parameters are determined in Window_SrpgStatus.prototype.loadFormat! Take a look to understand all the symbols.
        var lh = this._format.lh;
        var tp = this._format.tp;
        var sp = this._format.sp;
        var hw = this._format.hw;
        var fw = this._format.fw;
        var lw = this._format.lw;
        var cw = this._format.cw;
        var a = this._battler; //battler

        //TODO: basic information that shows on all pages, the code here is just an example
        this.drawActorName(a, tp, lh * 0);
        this.drawActorClass(a, hw + tp, lh * 0);
        this.drawActorFace(a, tp, lh * 1);
        this.drawBasicInfoActor(fw + 3 * tp, lh * 1);

        if (this._page == 0 || $gameSystem.isSubBattlePhase() == 'battle_window'){ //page 0 is always displayed on battle prediction window, you can also make prediction window a unique page
            //TODO: this part is for page 0, the code here is just an example
            this.drawEquipments([a.weapons()[0]], tp, lh * 5);
            this.drawParameters(tp, lh * 6);
            this.drawSrpgParameters(tp, lh * 9);
        } else if (this._page == 1){
            //TODO: this part is for page 1, the code here is just an example
            this.drawEquipments(a.equips(), tp, lh * 5);
        } else if (this._page == 2){
            //TODO: this part is for page 2, the code here is just an example
            this.drawElemets(tp, lh * 5);
        }
        //Feel free to add/remove pages.
    };

    Window_SrpgStatus.prototype.drawContentsEnemy = function() {
        //all the format parameters are determined in Window_SrpgStatus.prototype.loadFormat! Take a look to understand all the symbols.
        var lh = this._format.lh;
        var tp = this._format.tp;
        var sp = this._format.sp;
        var hw = this._format.hw;
        var fw = this._format.fw;
        var lw = this._format.lw;
        var cw = this._format.cw;
        var a = this._battler;

        //TODO: basic information that shows on all pages, the code here is just an example
        this.drawActorName(a, tp, lh * 0);
        this.drawEnemyClass(a, hw + tp, lh * 0);
        this.drawEnemyFace(a, tp, lh * 1);
        this.drawBasicInfoEnemy(fw + 3 * tp, lh * 1);

        if (this._page == 0 || $gameSystem.isSubBattlePhase() == 'battle_window'){//page 0 is always displayed on battle prediction window, you can also make prediction window a unique page
            //TODO: this part is for page 0, the code here is just an example
            this.drawEquipments([$dataWeapons[Number(a.enemy().meta.srpgWeapon)]], tp, lh * 5);
            this.drawParameters(tp, lh * 6);
            this.drawSrpgParameters(tp, lh * 9);
        } else if (this._page == 1){
            //TODO: this part is content for page 1, the code here is just an example
            this.drawRewards(tp, lh * 5);
        } else if (this._page == 2){
            //TODO: this part is content for page 1, the code here is just an example;
            this.drawElemets(tp, lh * 5);
        }
        //Feel free to add/remove pages.
    };


//========================================================================================================
//Important: Built-in methods (Replaced those in SRPG-Core)
//========================================================================================================
    Window_SrpgStatus.prototype.drawBasicInfoActor = function(x, y) {
        var tp = this._format.tp;
        var lh = this._format.lh;
        var gaugeWidth = this._format.gaugeWidth;
        var halfGaugeWidth = this._format.halfGaugeWidth;
        var a = this._battler;

        this.drawSrpgExpRate(a, x, y + lh * 0);
        this.drawActorLevel(a, x, y + lh * 0);
        this.drawActorIcons(a, x, y + lh * 1);
        this.drawActorHp(a, x, y + lh * 2, gaugeWidth);
        if ($dataSystem.optDisplayTp) {
            this.drawActorMp(a, x, y + lh * 3, halfGaugeWidth);
            this.drawActorTp(a, x + halfGaugeWidth + tp, y + lh * 3, halfGaugeWidth);
        } else {
            this.drawActorMp(a, x, y + lh * 3, gaugeWidth);
        }
    };

    Window_SrpgStatus.prototype.drawBasicInfoEnemy = function(x, y) {
        var tp = this._format.tp;
        var lh = this._format.lh;
        var gaugeWidth = this._format.gaugeWidth;
        var halfGaugeWidth = this._format.halfGaugeWidth;
        var a = this._battler;

        this.drawEnemyLevel(a, x, y + lh * 0);
        this.drawActorIcons(a, x, y + lh * 1);
        this.drawActorHp(a, x, y + lh * 2, gaugeWidth);
        if ($dataSystem.optDisplayTp) {
            this.drawActorMp(a, x, y + lh * 3, halfGaugeWidth);
            this.drawActorTp(a, x + halfGaugeWidth + tp, y + lh * 3, halfGaugeWidth);
        } else {
            this.drawActorMp(a, x, y + lh * 3, gaugeWidth);
        }
    };

    Window_SrpgStatus.prototype.drawParameters = function(x, y) {
        var tp = this._format.tp;
        var lh = this._format.lh;
        var hw = this._format.hw;
        var lw = this._format.lw;
        var cw = this._format.cw;
        var a = this._battler;

        for (var i = 0; i < 6; i++) {
            var paramId = i + 2;
            var x2 = x + hw * (i % 2);
            var y2 = y + lh * Math.floor(i / 2);
            this.changeTextColor(this.systemColor());
            this.drawText(TextManager.param(paramId), x2, y2, lw);
            this.resetTextColor();
            this.drawText(a.param(paramId), x2 + lw, y2, cw, 'right');
        }
    };

    Window_SrpgStatus.prototype.drawSrpgParameters = function(x, y) {
        var tp = this._format.tp;
        var lh = this._format.lh;
        var hw = this._format.hw;
        var lw = this._format.lw;
        var cw = this._format.cw;
        var a = this._battler;

        this.changeTextColor(this.systemColor());
        this.drawText(_textSrpgMove, x, y, lw);
        this.resetTextColor();
        this.drawText(a.srpgMove(), x + lw, y, cw, 'right');
        this.changeTextColor(this.systemColor());
        this.drawText(_textSrpgRange, x + hw, y, lw);
        this.resetTextColor();
        var text = '';
        if (a.srpgWeaponMinRange() > 0) {
            text += a.srpgWeaponMinRange() + '-';
        }
        text += a.srpgWeaponRange();
        this.drawText(text, x + hw + lw, y, cw, 'right');
    };

//========================================================================================================
//Important: Built-in methods (New functions made by myself)
//========================================================================================================
    Window_SrpgStatus.prototype.drawElemets = function(x, y) {
        var tp = this._format.tp;
        var lh = this._format.lh;
        var hw = this._format.hw;
        var lw = this._format.lw;
        var cw = this._format.cw;
        var a = this._battler;

        for (var i = 0; i < $dataSystem.elements.length - 1; i++) {
            var elementId = i + 1;
            var x2 = x + hw * (i % 2);
            var y2 = y + lh * Math.floor(i / 2);
            var rate = a.elementRate(elementId) * 100;
            var text = String(rate) + '%'
            this.changeTextColor(this.systemColor());
            this.drawText($dataSystem.elements[elementId], x2, y2, lw);
            if (rate > 100){
                this.changeTextColor(this.tpCostColor())
            } else if (rate < 100){
                this.changeTextColor(this.deathColor())
            } else {
                this.resetTextColor();
                text = ' -- ';
            }
            this.drawText(text, x2 + lw, y2, cw, 'right');
        }
        this.resetTextColor();
    };

    Window_SrpgStatus.prototype.drawEquipments = function(equips, x, y) {
        var lh = this._format.lh;
        var equipLabelWidth = this._format.equipLabelWidth;
        var equipContentWidth = this._format.equipContentWidth;
        var a = this._battler;
        var slots = a.equipSlots();
        for (var i = 0; i < equips.length; i++) {
            this.changeTextColor(this.systemColor());
            this.drawText($dataSystem.equipTypes[slots[i]], x, y + lh * i, equipLabelWidth);
            this.drawItemName(equips[i], x + equipLabelWidth, y + lh * i, equipContentWidth);
        }
    };

    Window_SrpgStatus.prototype.drawSkills = function(x, y) {
        var lh = this._format.lh;
        var itemLabelWidth = this._format.itemLabelWidth;
        var itemNameWidth = this._format.itemNameWidth;
        var itemValueWidth = this._format.itemValueWidth;
        var a = this._battler;
        var skills = a.skills();
        this._actor = a; //used to call Window_SkillList.prototype.drawSkillCost
        this.changeTextColor(this.systemColor());
        this.drawText(_textSkills, x, y, itemLabelWidth);
        this.resetTextColor();
        for (var i = 0; i < skills.length; i++) {
            this.changePaintOpacity(a.srpgCanShowRange(skills[i]));
            this.drawItemName(skills[i],  x + itemLabelWidth, y + lh * i, itemNameWidth);
            Window_SkillList.prototype.drawSkillCost.call(this, skills[i], x + itemLabelWidth + itemNameWidth, y + lh * i, itemValueWidth);
            this.changePaintOpacity(1);
        }
        this._actor = undefined;
    };

    Window_SrpgStatus.prototype.drawRewards = function(x, y) {
        var lh = this._format.lh;
        var sp = this._format.sp;
        var tp = this._format.tp;
        var itemLabelWidth = this._format.itemLabelWidth;
        var itemNameWidth = this._format.itemNameWidth;
        var itemValueWidth = this._format.itemValueWidth;
        var unitWidth = Math.max(this.textWidth(TextManager.expA), this.textWidth(TextManager.currencyUnit))

        var a = this._battler;
        var exp = String(a.exp() || 0);
        var gold = String(a.gold() || 0);
        var items = a.enemy().dropItems.reduce(function(r, di) { return r.concat(a.itemObject(di.kind, di.dataId))}, []);

        this.changeTextColor(this.systemColor());
        this.drawText(_textRewards, x, y, itemLabelWidth);
        this.resetTextColor();
        for (var i = 0; i < items.length; i++) {
            this.drawItemName(items[i],  x + itemLabelWidth, y + lh * i, itemNameWidth + itemValueWidth);
        }
        this.drawText(exp, x, y + lh, itemLabelWidth - sp - tp - unitWidth, 'right');
        this.drawText(gold, x, y + 2 * lh, itemLabelWidth - sp - tp - unitWidth, 'right');
        this.changeTextColor(this.systemColor());
        this.drawText(TextManager.expA, x, y + lh, itemLabelWidth - sp, 'right');
        this.drawText(TextManager.currencyUnit, x, y + 2 * lh, itemLabelWidth - sp, 'right');
        this.resetTextColor();
    };

//========================================================================================================
//Supporting Functions
//========================================================================================================

    Game_Enemy.prototype.equipSlots = function() {
        return Game_Actor.prototype.equipSlots.call(this);
    };

    if (!Game_Enemy.prototype.skills) {
        Game_Enemy.prototype.skills = function() {
            var skills = []
            for (var i = 0; i < this.enemy().actions.length; ++i) {
                var skill = $dataSkills[this.enemy().actions[i].skillId];
                if (skill) skills.push(skill);
            }
            return skills;
        }
    };

    //method from srpg_ShowAoERange
    if (!Game_Actor.prototype.srpgCanShowRange) {
        Game_Actor.prototype.srpgCanShowRange = function(skill){
            if (skill.id == this.attackSkillId() || (this.addedSkillTypes().includes(skill.stypeId) && skill.stypeId !== 0)){
                return Game_BattlerBase.prototype.srpgCanShowRange.call(this, skill);
            } else return false;
        };

        Game_BattlerBase.prototype.srpgCanShowRange = function(skill){
            return (this.isSkillWtypeOk(skill) && this.canPaySkillCost(skill) &&
                    !this.isSkillSealed(skill.id) && !this.isSkillTypeSealed(skill.stypeId));
        };
    }   

})();
