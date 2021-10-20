//=============================================================================
// MPP_ScrollBar.js
//=============================================================================
// Copyright (c) 2019 Mokusei Penguin
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc 【ver.2.2】ウィンドウにスクロールバーを追加します。
 * @author 木星ペンギン
 *
 * @help ※マウス/タッチ操作改善 [MPP_SimpleTouch3.js] と併用する場合、
 * 　こちらのプラグインが下になるように導入してください。
 * 
 * ● ドラッグ操作によるスクロール
 *  スクロールバーをドラッグ操作でスクロールさせることができます。
 *  操作の当たり判定は、ウィンドウの右端からの幅となります。
 *  スクロールバーの幅と当たり判定の幅は関係ありません。
 *  
 * ================================
 * 制作 : 木星ペンギン
 * URL : http://woodpenguin.blog.fc2.com/
 * 
 * @param Veiw Time
 * @type number
 * @desc 表示時間
 * (0で常に表示)
 * @default 60
 * 
 * @param Scroll Bar Color1
 * @desc スクロールバーの色
 * @default 160,160,160
 * 
 * @param Scroll Bar Color2
 * @desc スクロールバーの色
 * @default 192,192,192
 * 
 * @param Scroll Bar Width
 * @type number
 * @min 1
 * @desc スクロールバーの幅
 * @default 6
 * 
 * @param Right Padding
 * @type number
 * @desc スクロールバー右の余白
 * @default 5
 * 
 * @param Hitbox Width
 * @type number
 * @min 1
 * @desc スクロールバー操作の当たり判定の幅
 * @default 24
 * 
 * 
 * 
 */

(function () {

var MPPlugin = {};

(function () {
    
    MPPlugin.contains = {};
    MPPlugin.contains['SimpleTouch3'] = $plugins.some(function(plugin) {
        return (plugin.name === 'MPP_SimpleTouch3' && plugin.status);
    });
    
    var parameters = PluginManager.parameters('MPP_ScrollBar');
    
    MPPlugin.VeiwTime = Number(parameters['Veiw Time'] || 0);
    MPPlugin.ScrollBarColor1 = 'rgb(%1)'.format(parameters['Scroll Bar Color1'] || '128,128,128');
    MPPlugin.ScrollBarColor2 = 'rgb(%1)'.format(parameters['Scroll Bar Color2'] || '192,192,192');
    MPPlugin.ScrollBarWidth = Number(parameters['Scroll Bar Width'] || 6);
    MPPlugin.RightPadding = Number(parameters['Right Padding'] || 5);
    
    MPPlugin.HitboxWidth = Number(parameters['Hitbox Width'] || 18);
    
})();

var Alias = {};

//-----------------------------------------------------------------------------
// Window_Selectable

//
if (Window_Selectable.prototype.hasOwnProperty('updateTransform')) {
    Alias.WiSe_updateTransform = Window_Selectable.prototype.updateTransform;
}
Window_Selectable.prototype.updateTransform = function () {
    this._updateScrollBar();
    if (Alias.WiSe_updateTransform) {
        Alias.WiSe_updateTransform.call(this);
    } else {
        Window_Base.prototype.updateTransform.call(this);
    }
};

//
if (Window_Selectable.prototype.hasOwnProperty('_refreshAllParts')) {
    Alias.WiSe__refreshAllParts = Window_Selectable.prototype._refreshAllParts;
}
Window_Selectable.prototype._refreshAllParts = function () {
    this._refreshScrollBar();
    if (Alias.WiSe__refreshAllParts) {
        Alias.WiSe__refreshAllParts.call(this);
    } else {
        Window_Base.prototype._refreshAllParts.call(this);
    }
};

Window_Selectable.prototype._refreshScrollBar = function () {
    var maxRow = this.maxRows();
    var maxPageRows = this.maxPageRows();
    if (maxRow > maxPageRows) {
        if (!this._scrollBarSprite) {
            this._scrollBarSprite = new Sprite();
            this._scrollBarSprite.opacity = 0;
            this.addChild(this._scrollBarSprite);
        }
        var height = this.height - this.standardPadding() * 2;
        var barWidth = MPPlugin.ScrollBarWidth;
        var barHeight = Math.ceil(height * maxPageRows / maxRow);
        var bitmap = new Bitmap(barWidth, barHeight);
        var context = bitmap.context;
        var grad = context.createLinearGradient(0, 0, 0, barHeight);
        grad.addColorStop(0, MPPlugin.ScrollBarColor1);
        grad.addColorStop(0.5, MPPlugin.ScrollBarColor2);
        grad.addColorStop(1, MPPlugin.ScrollBarColor1);
        context.save();
        context.fillStyle = grad;
        context.fillRect(0, 0, barWidth, barHeight);
        context.restore();
        bitmap._setDirty();
        this._scrollBarSprite.bitmap = bitmap;
    }
};

Window_Selectable.prototype._updateScrollBar = function () {
    if (this._scrollBarSprite) {
        var barX = this.width - MPPlugin.RightPadding - MPPlugin.ScrollBarWidth;
        var topY = this._scrollY + this.origin.y;
        var maxHeight = this.maxRows() * this.itemHeight();
        var height = this.height - this.standardPadding() * 2;
        var barY = Math.floor(height * topY / maxHeight) + this.standardPadding();
        this._scrollBarSprite.x = barX;
        this._scrollBarSprite.y = barY;
        if (this._lastOy !== this.origin.y) {
            this._lastOy = this.origin.y;
            this._scrollBarCount = MPPlugin.VeiwTime;
        }
        if (this._scrollBarCount > 0) {
            this._scrollBarCount--;
        }
        if (this.isScrollBarActive()) {
            this._scrollBarSprite.opacity += 32;
        } else {
            this._scrollBarSprite.opacity -= 4;
        }
        if (this.isOpen() && this.maxRows() > this.maxPageRows()) {
            this._scrollBarSprite.visible = true;
        } else {
            this._scrollBarSprite.visible = false;
        }
    }
};

Window_Selectable.prototype.isScrollBarActive = function() {
    return (this.active && (MPPlugin.VeiwTime === 0 || this._scrollBarCount > 0));
};

//13
Alias.WiSe_initialize = Window_Selectable.prototype.initialize;
Window_Selectable.prototype.initialize = function(x, y, width, height) {
    Alias.WiSe_initialize.call(this, x, y, width, height);
    this._scrollBarType = -1;
    this._scrollBarDragY = 0;
    this._scrollBarCount = 0;
};

//
if (Window_Selectable.prototype.hasOwnProperty('createContents')) {
    Alias.WiSe_createContents = Window_Selectable.prototype.createContents;
}
Window_Selectable.prototype.createContents = function() {
    if (Alias.WiSe_createContents) {
        Alias.WiSe_createContents.call(this);
    } else {
        Window_Base.prototype.createContents.call(this);
    }
    this._refreshScrollBar();
};

//110
Alias.WiSe_setTopRow = Window_Selectable.prototype.setTopRow;
Window_Selectable.prototype.setTopRow = function(row) {
    Alias.WiSe_setTopRow.call(this, row);
    this._scrollBarCount = MPPlugin.VeiwTime;
};

//340
Alias.WiSe_processTouch = Window_Selectable.prototype.processTouch;
Window_Selectable.prototype.processTouch = function() {
    if (this.isOpenAndActive()) {
        if (TouchInput.isTriggered() && this.isTouchedInsideScrollBox()) {
            var y = this.canvasToLocalY(TouchInput.y);
            var by = this._scrollBarSprite.y;
            var bh = this._scrollBarSprite.height;
            if (y < by) {
                this._scrollBarType = 0;
            } else if (y < by + bh) {
                this._scrollBarType = 1;
                this._scrollBarDragY = TouchInput.y;
            } else {
                this._scrollBarType = 2;
            }
            this._scrollBarCount = MPPlugin.VeiwTime;
        }
        if (this._scrollBarType >= 0) {
            if (TouchInput.isPressed()) {
                switch (this._scrollBarType) {
                    case 0:
                        if (TouchInput.isRepeated()) {
                            this.scrollBarPageup();
                        }
                        break;
                    case 1:
                        this.onScrollBarDrag();
                        break;
                    case 2:
                        if (TouchInput.isRepeated()) {
                            this.scrollBarPagedown();
                        }
                        break;
                }
            } else {
                this._scrollBarType = -1;
            }
        }
    } else {
        this._scrollBarType = -1;
    }
    if (this._scrollBarType < 0) {
        Alias.WiSe_processTouch.call(this);
    }
};

Window_Selectable.prototype.isTouchedInsideScrollBox = function() {
    if (!this._scrollBarSprite || !this._scrollBarSprite.visible) {
        return false;
    }
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    var rx = this.width - MPPlugin.HitboxWidth;
    return x >= rx && y >= 0 && x < this.width && y < this.height;
};

Window_Selectable.prototype.scrollBarPagedown = function() {
    var y = this.canvasToLocalY(TouchInput.y);
    var by = this._scrollBarSprite.y;
    var bh = this._scrollBarSprite.height;
    if (y >= by + bh) {
        if (MPPlugin.contains['SimpleTouch3']) {
            this.gainOy(this.maxPageRows() * this.itemHeight());
        } else {
            this.setTopRow(this.topRow() + this.maxPageRows());
        }
    }
};

Window_Selectable.prototype.scrollBarPageup = function() {
    var y = this.canvasToLocalY(TouchInput.y);
    var by = this._scrollBarSprite.y;
    if (y < by) {
        if (MPPlugin.contains['SimpleTouch3']) {
            this.gainOy(-this.maxPageRows() * this.itemHeight());
        } else {
            this.setTopRow(this.topRow() - this.maxPageRows());
        }
    }
};

Window_Selectable.prototype.onScrollBarDrag = function() {
    var sy = TouchInput.y - this._scrollBarDragY;
    if (sy !== 0) {
        var oy = this._scrollY + this.origin.y;
        var height = this.height - this.standardPadding() * 2;
        var amount = sy * this.maxRows() / height;
        if (MPPlugin.contains['SimpleTouch3']) {
            this.gainOy(amount * this.itemHeight());
        } else {
            this.setTopRow(this.topRow() + Math.round(amount));
        }
        if (oy !== this._scrollY + this.origin.y) {
            this._scrollBarDragY = TouchInput.y;
        }
    }
};



})();
