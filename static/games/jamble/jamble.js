"use strict";
var Jamble;
(function (Jamble) {
    class GameObject {
        constructor(id, x = 0, y = 0) {
            this.id = id;
            this.transform = { x, y };
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#ffffff',
                    shape: 'rectangle',
                    width: 20,
                    height: 20
                },
                animation: { scaleX: 1, scaleY: 1 },
                anchor: { x: 0.5, y: 0.5 }
            };
        }
        getBounds() {
            if (this.collisionBox) {
                return {
                    left: this.collisionBox.x,
                    right: this.collisionBox.x + this.collisionBox.width,
                    top: this.collisionBox.y,
                    bottom: this.collisionBox.y + this.collisionBox.height
                };
            }
            return {
                left: this.transform.x,
                right: this.transform.x,
                top: this.transform.y,
                bottom: this.transform.y
            };
        }
        setPosition(x, y) {
            this.transform.x = x;
            this.transform.y = y;
        }
    }
    Jamble.GameObject = GameObject;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class SlotManager {
        constructor(gameWidth, gameHeight) {
            this.slots = [];
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.generateSlots();
        }
        generateSlots() {
            const layers = [
                { type: 'ceiling', yPercent: 0, columns: 6 },
                { type: 'air_high', yPercent: 25, columns: 6 },
                { type: 'air_mid', yPercent: 50, columns: 6 },
                { type: 'air_low', yPercent: 75, columns: 6 },
                { type: 'ground', yPercent: 100, columns: 6 }
            ];
            layers.forEach(layer => {
                for (let col = 0; col < layer.columns; col++) {
                    const x = (col + 0.5) * (this.gameWidth / layer.columns);
                    const y = (layer.yPercent / 100) * this.gameHeight;
                    this.slots.push({
                        id: `${layer.type}-${col}`,
                        type: layer.type,
                        x: x,
                        y: y,
                        occupied: false
                    });
                }
            });
        }
        getAllSlots() {
            return [...this.slots];
        }
        getSlotsByType(type) {
            return this.slots.filter(slot => slot.type === type);
        }
        getAvailableSlots(type) {
            const filteredSlots = type ? this.getSlotsByType(type) : this.slots;
            return filteredSlots.filter(slot => !slot.occupied);
        }
        occupySlot(slotId, gameObjectId) {
            const slot = this.slots.find(s => s.id === slotId);
            if (!slot || slot.occupied)
                return false;
            slot.occupied = true;
            slot.gameObjectId = gameObjectId;
            return true;
        }
        freeSlot(slotId) {
            const slot = this.slots.find(s => s.id === slotId);
            if (!slot)
                return false;
            slot.occupied = false;
            slot.gameObjectId = undefined;
            return true;
        }
    }
    Jamble.SlotManager = SlotManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class ColorUtils {
        static labToRgb(l, a, b) {
            let y = (l + 16) / 116;
            let x = a / 500 + y;
            let z = y - b / 200;
            x = 0.95047 * this.labInverseFunction(x);
            y = 1.00000 * this.labInverseFunction(y);
            z = 1.08883 * this.labInverseFunction(z);
            let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
            let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
            let b_rgb = x * 0.0557 + y * -0.2040 + z * 1.0570;
            r = this.gammaCorrection(r);
            g = this.gammaCorrection(g);
            b_rgb = this.gammaCorrection(b_rgb);
            const red = Math.round(Math.max(0, Math.min(255, r * 255)));
            const green = Math.round(Math.max(0, Math.min(255, g * 255)));
            const blue = Math.round(Math.max(0, Math.min(255, b_rgb * 255)));
            return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
        }
        static labInverseFunction(t) {
            const delta = 6 / 29;
            if (t > delta) {
                return Math.pow(t, 3);
            }
            else {
                return 3 * delta * delta * (t - 4 / 29);
            }
        }
        static gammaCorrection(value) {
            if (value > 0.0031308) {
                return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
            }
            else {
                return 12.92 * value;
            }
        }
        static getBorderColor(l, a, b, lightnessReduction = 20) {
            return this.labToRgb(Math.max(0, l - lightnessReduction), a, b);
        }
    }
    Jamble.ColorUtils = ColorUtils;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Player extends Jamble.GameObject {
        constructor(x = 0, y = 0) {
            super('player', x, y);
            this.velocityX = 0;
            this.velocityY = 0;
            this.grounded = false;
            this.moveSpeed = 200;
            this.jumpHeight = 300;
            this.lastDirection = 'right';
            this.autoRunDirection = 'right';
            this.isAutoRunning = false;
            this.visualOffsetX = 0;
            this.visualOffsetY = 0;
            this.softness = 0.5;
            this.temperature = 0.5;
            this.baseLightness = 72;
            this.baseA = 60;
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#4db6ac',
                    shape: 'custom',
                    width: 20,
                    height: 20,
                    customDraw: this.drawPlayer.bind(this)
                },
                anchor: { x: 0.5, y: 1 },
                animation: {
                    scaleX: 1,
                    scaleY: 1
                }
            };
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 20,
                height: 20,
                anchor: { x: 0.5, y: 1 },
                category: 'player'
            };
            this.anim = new Jamble.PlayerAnim(this);
        }
        update(deltaTime) {
            if (!this.grounded) {
                this.velocityY += 800 * deltaTime;
            }
            this.transform.x += this.velocityX * deltaTime;
            this.transform.y += this.velocityY * deltaTime;
            this.anim.update(deltaTime);
        }
        moveLeft() {
            this.velocityX = -this.moveSpeed;
            this.lastDirection = 'left';
        }
        moveRight() {
            this.velocityX = this.moveSpeed;
            this.lastDirection = 'right';
        }
        stopMoving() {
            this.velocityX = 0;
        }
        startAutoRun() {
            if (!this.isAutoRunning) {
                this.isAutoRunning = true;
                this.autoRunDirection = 'right';
            }
            this.velocityX = this.autoRunDirection === 'left' ? -this.moveSpeed : this.moveSpeed;
        }
        stopAutoRun() {
            this.isAutoRunning = false;
            this.velocityX = 0;
        }
        onHorizontalCollision(side, collider) {
            if (this.isAutoRunning) {
                this.autoRunDirection = this.autoRunDirection === 'left' ? 'right' : 'left';
                this.velocityX = this.autoRunDirection === 'left' ? -this.moveSpeed : this.moveSpeed;
            }
        }
        jump() {
            if (this.grounded) {
                this.velocityY = -this.jumpHeight;
                this.grounded = false;
            }
        }
        onLanded(velocityYAtImpact = 0) {
            this.anim.onLanded(velocityYAtImpact);
        }
        setSoftness(value) {
            this.softness = Math.max(0, Math.min(1, value));
        }
        getSoftness() {
            return this.softness;
        }
        setTemperature(value) {
            this.temperature = Math.max(0, Math.min(1, value));
        }
        getTemperature() {
            return this.temperature;
        }
        getCornerRadius() {
            return this.softness * 16;
        }
        getPlayerColor() {
            const b = (this.temperature - 0.5) * 256;
            return Jamble.ColorUtils.labToRgb(this.baseLightness, this.baseA, b);
        }
        getBorderColor() {
            const b = (this.temperature - 0.5) * 256;
            return Jamble.ColorUtils.getBorderColor(this.baseLightness, this.baseA, b, 20);
        }
        drawPlayer(ctx, x, y) {
            const drawX = x + this.visualOffsetX;
            const drawY = y + this.visualOffsetY;
            const radius = this.getCornerRadius();
            const fillColor = this.getPlayerColor();
            const borderColor = this.getBorderColor();
            ctx.fillStyle = borderColor;
            this.drawRoundedRect(ctx, drawX - 1, drawY - 1, 22, 22, radius);
            ctx.fillStyle = fillColor;
            this.drawRoundedRect(ctx, drawX, drawY, 20, 20, radius);
        }
        drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }
    }
    Jamble.Player = Player;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class PlayerAnim {
        constructor(player) {
            this.player = player;
            this.targetScaleX = 1;
            this.targetScaleY = 1;
            this.animationSpeed = 8;
            this.airStretchFactor = 0.05;
            this.airSquashFactor = 0.02;
            this.airVelocityUnit = 40;
            this.landScaleX = 1.4;
            this.landScaleY = 0.6;
            this.landHoldS = 0.15;
            this.landFullSpeed = 500;
            this.landingActive = false;
            this.landingHoldTimerS = 0;
        }
        update(deltaTime) {
            const anim = this.player.render.animation;
            if (!anim)
                return;
            if (!this.player.grounded && this.landingActive) {
                this.landingActive = false;
                this.landingHoldTimerS = 0;
                this.targetScaleX = anim.scaleX;
                this.targetScaleY = anim.scaleY;
            }
            const lerpFactor = 1 - Math.pow(0.001, deltaTime * this.animationSpeed);
            anim.scaleX += (this.targetScaleX - anim.scaleX) * lerpFactor;
            anim.scaleY += (this.targetScaleY - anim.scaleY) * lerpFactor;
            if (!this.player.grounded && !this.landingActive) {
                const vUnits = Math.max(0, -this.player.velocityY / this.airVelocityUnit);
                const stretchY = 1 + vUnits * this.airStretchFactor;
                const squashX = 1 - vUnits * this.airSquashFactor;
                anim.scaleX = squashX;
                anim.scaleY = stretchY;
                this.targetScaleX = squashX;
                this.targetScaleY = stretchY;
            }
            if (this.landingActive) {
                this.landingHoldTimerS -= deltaTime;
                if (this.landingHoldTimerS <= 0) {
                    this.targetScaleX = 1;
                    this.targetScaleY = 1;
                    this.landingActive = false;
                }
            }
        }
        onLanded(velocityYAtImpact = 0) {
            const anim = this.player.render.animation;
            if (!anim)
                return;
            const ratio = Math.max(0, Math.min(1, Math.abs(velocityYAtImpact) / this.landFullSpeed));
            const sx = 1 + (this.landScaleX - 1) * ratio;
            const sy = 1 - (1 - this.landScaleY) * ratio;
            anim.scaleX = sx;
            anim.scaleY = sy;
            this.targetScaleX = sx;
            this.targetScaleY = sy;
            this.landingActive = true;
            this.landingHoldTimerS = this.landHoldS;
        }
    }
    Jamble.PlayerAnim = PlayerAnim;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Tree extends Jamble.GameObject {
        constructor(id, x = 0, y = 0, slotId = '') {
            super(id, x, y);
            this.visualOffsetX = 5;
            this.visualOffsetY = 0;
            this.slotId = slotId;
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#8d6e63',
                    shape: 'custom',
                    width: 20,
                    height: 30,
                    customDraw: this.drawTree.bind(this)
                },
                anchor: { x: 0.5, y: 1 }
            };
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 8,
                height: 25,
                anchor: { x: 0.5, y: 1 },
                category: 'environment'
            };
        }
        drawTree(ctx, x, y) {
            const drawX = x + this.visualOffsetX;
            const drawY = y + this.visualOffsetY;
            ctx.fillStyle = '#8d6e63';
            this.drawRoundedRect(ctx, drawX, drawY, 10, 30, 2);
            ctx.fillStyle = '#66bb6a';
            ctx.beginPath();
            ctx.arc(drawX + 5, drawY, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
        drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }
        update(deltaTime) {
        }
        getSlotId() {
            return this.slotId;
        }
        onClick() {
            window.dispatchEvent(new CustomEvent('jamble:tree-clicked', {
                detail: { treeId: this.id, slotId: this.slotId }
            }));
        }
        despawn() {
            this.render.visible = false;
            if (this.collisionBox) {
                this.collisionBox.enabled = false;
            }
        }
    }
    Jamble.Tree = Tree;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class EconomyManager {
        constructor() {
            this.currency = 0;
            this.onCurrencyChangeCallbacks = [];
        }
        static getInstance() {
            if (!EconomyManager.instance) {
                EconomyManager.instance = new EconomyManager();
            }
            return EconomyManager.instance;
        }
        getCurrency() {
            return this.currency;
        }
        addCurrency(amount) {
            this.currency += amount;
            this.notifyCurrencyChange();
        }
        spendCurrency(amount) {
            if (this.currency >= amount) {
                this.currency -= amount;
                this.notifyCurrencyChange();
                return true;
            }
            return false;
        }
        canAfford(amount) {
            return this.currency >= amount;
        }
        onCurrencyChange(callback) {
            this.onCurrencyChangeCallbacks.push(callback);
        }
        notifyCurrencyChange() {
            this.onCurrencyChangeCallbacks.forEach(callback => callback(this.currency));
        }
    }
    Jamble.EconomyManager = EconomyManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class BaseNPC {
        constructor(name, config) {
            this.crescendoThresholdReached = false;
            this.crescendoEnabled = true;
            this.inPainZone = false;
            this.painExpressionLocked = false;
            this.winExpressionLocked = false;
            this.arousalChangeListeners = [];
            this.arousalImpulseListeners = [];
            this.crescendoChangeListeners = [];
            this.crescendoThresholdListeners = [];
            this.painThresholdListeners = [];
            this.expressionChangeListeners = [];
            this.arousalMomentum = 0;
            this.momentumSpreadDuration = 0.3;
            this.name = name;
            this.arousalConfig = {
                baselineValue: 0.2,
                decayRate: 0.001,
                maxValue: 6.0,
                minValue: -1.0,
                sensitivity: 1.0,
                painThreshold: 5.0,
                ...config
            };
            this.crescendoConfig = {
                targetArousalValue: 4.0,
                arousalTolerance: 0.5,
                riseRate: 0.2,
                decayRate: 0.1,
                threshold: 1.0,
                maxValue: 1.0
            };
            this.arousalValue = this.arousalConfig.baselineValue;
            this.crescendoValue = 0.1;
            this.expressionDescriptor = this.resolveExpression();
        }
        getName() {
            return this.name;
        }
        getArousalValue() {
            return this.arousalValue;
        }
        applyArousalImpulse(intensity, player, collisionType) {
            const oldValue = this.arousalValue;
            let adjustedIntensity = intensity * this.arousalConfig.sensitivity;
            let momentumAmount = 0;
            if (player && collisionType === 'side') {
                const softness = player.getSoftness();
                if (softness < 0.5) {
                    const hardnessFactor = (0.5 - softness) / 0.5;
                    const baseImpulse = intensity * this.arousalConfig.sensitivity;
                    const topCollisionTarget = 0.5 * this.arousalConfig.sensitivity;
                    const targetImpulse = Math.max(baseImpulse, topCollisionTarget);
                    adjustedIntensity = baseImpulse + hardnessFactor * (targetImpulse - baseImpulse);
                }
                else {
                    const t = (softness - 0.5) / 0.5;
                    const totalScale = 1.0 - t * 0.7;
                    adjustedIntensity = intensity * this.arousalConfig.sensitivity * totalScale;
                    const instantRatio = 0.6;
                    momentumAmount = adjustedIntensity * (1 - instantRatio);
                    adjustedIntensity *= instantRatio;
                }
            }
            this.arousalValue = Math.max(this.arousalConfig.minValue, Math.min(this.arousalConfig.maxValue, this.arousalValue + adjustedIntensity));
            if (momentumAmount > 0) {
                this.arousalMomentum += momentumAmount;
            }
            this.checkPainThreshold();
            const actualIntensity = this.arousalValue - oldValue;
            if (actualIntensity !== 0) {
                this.notifyArousalImpulseListeners(actualIntensity);
                this.notifyArousalListeners();
            }
        }
        setArousalValue(value) {
            const oldValue = this.arousalValue;
            this.arousalValue = Math.max(this.arousalConfig.minValue, Math.min(this.arousalConfig.maxValue, value));
            if (oldValue !== this.arousalValue) {
                this.notifyArousalListeners();
            }
        }
        getArousalNormalized() {
            const range = this.arousalConfig.maxValue - this.arousalConfig.minValue;
            return Math.max(0, Math.min(1, (this.arousalValue - this.arousalConfig.minValue) / range));
        }
        getSensationNormalized() {
            return this.getArousalNormalized();
        }
        getPainThreshold() {
            return this.arousalConfig.painThreshold;
        }
        getArousalRange() {
            return {
                min: this.arousalConfig.minValue,
                max: this.arousalConfig.maxValue
            };
        }
        getArousalState() {
            if (this.arousalValue < 0.5)
                return 'default';
            if (this.arousalValue < 1.5)
                return 'minimum';
            if (this.arousalValue < 2.5)
                return 'medium';
            if (this.arousalValue < 3.5)
                return 'high';
            if (this.arousalValue < 4.5)
                return 'very-high';
            return 'pain';
        }
        updateArousal(deltaTime, player) {
            const oldValue = this.arousalValue;
            if (this.arousalMomentum > 0) {
                const momentumPerSecond = this.arousalMomentum / this.momentumSpreadDuration;
                const momentumThisFrame = Math.min(momentumPerSecond * deltaTime, this.arousalMomentum);
                this.arousalMomentum -= momentumThisFrame;
                this.arousalValue = Math.max(this.arousalConfig.minValue, Math.min(this.arousalConfig.maxValue, this.arousalValue + momentumThisFrame));
            }
            let decay = this.arousalConfig.decayRate;
            if (player && !this.inPainZone) {
                const temperature = player.getTemperature();
                decay *= (0.5 + temperature * 0.5);
            }
            if (this.inPainZone) {
                decay = 2.0;
            }
            if (this.arousalValue > this.arousalConfig.baselineValue) {
                this.arousalValue -= decay * deltaTime;
                this.arousalValue = Math.max(this.arousalConfig.baselineValue, this.arousalValue);
            }
            else if (this.arousalValue < this.arousalConfig.baselineValue) {
                this.arousalValue += decay * deltaTime;
                this.arousalValue = Math.min(this.arousalConfig.baselineValue, this.arousalValue);
            }
            if (oldValue !== this.arousalValue) {
                this.notifyArousalListeners();
            }
        }
        onArousalChange(callback) {
            this.arousalChangeListeners.push(callback);
        }
        removeArousalListener(callback) {
            const index = this.arousalChangeListeners.indexOf(callback);
            if (index !== -1) {
                this.arousalChangeListeners.splice(index, 1);
            }
        }
        onArousalImpulse(callback) {
            this.arousalImpulseListeners.push(callback);
        }
        removeArousalImpulseListener(callback) {
            const index = this.arousalImpulseListeners.indexOf(callback);
            if (index !== -1) {
                this.arousalImpulseListeners.splice(index, 1);
            }
        }
        notifyArousalListeners() {
            for (const listener of this.arousalChangeListeners) {
                try {
                    listener(this.arousalValue, this);
                }
                catch (error) {
                    console.error(`Error in arousal listener for ${this.name}:`, error);
                }
            }
            this.evaluateExpression();
        }
        notifyArousalImpulseListeners(impulse) {
            for (const listener of this.arousalImpulseListeners) {
                try {
                    listener(impulse, this);
                }
                catch (error) {
                    console.error(`Error in arousal impulse listener for ${this.name}:`, error);
                }
            }
        }
        checkPainThreshold() {
            const wasInPain = this.inPainZone;
            const isInPain = this.arousalValue > this.arousalConfig.painThreshold;
            if (isInPain && !wasInPain) {
                this.inPainZone = true;
                if (!this.winExpressionLocked) {
                    this.painExpressionLocked = true;
                    this.evaluateExpression(true);
                }
                this.notifyPainThresholdListeners();
            }
            else if (!isInPain && wasInPain) {
                this.inPainZone = false;
            }
        }
        isInPainZone() {
            return this.inPainZone;
        }
        onPainThreshold(callback) {
            this.painThresholdListeners.push(callback);
        }
        removePainThresholdListener(callback) {
            const index = this.painThresholdListeners.indexOf(callback);
            if (index !== -1) {
                this.painThresholdListeners.splice(index, 1);
            }
        }
        notifyPainThresholdListeners() {
            for (const listener of this.painThresholdListeners) {
                try {
                    listener(this);
                }
                catch (error) {
                    console.error(`Error in pain threshold listener for ${this.name}:`, error);
                }
            }
        }
        getExpressionDescriptor() {
            return this.expressionDescriptor;
        }
        onExpressionChange(callback) {
            this.expressionChangeListeners.push(callback);
        }
        removeExpressionChangeListener(callback) {
            const index = this.expressionChangeListeners.indexOf(callback);
            if (index !== -1) {
                this.expressionChangeListeners.splice(index, 1);
            }
        }
        resolveExpression() {
            if (this.winExpressionLocked) {
                return { id: 'win' };
            }
            if (this.painExpressionLocked) {
                return { id: 'pain' };
            }
            return { id: 'default' };
        }
        evaluateExpression(force = false) {
            const nextDescriptor = this.resolveExpression();
            if (!nextDescriptor) {
                return;
            }
            if (force || !this.areExpressionsEqual(this.expressionDescriptor, nextDescriptor)) {
                this.expressionDescriptor = nextDescriptor;
                this.notifyExpressionChangeListeners();
            }
        }
        areExpressionsEqual(a, b) {
            if (!a || !b) {
                return false;
            }
            if (a.id !== b.id) {
                return false;
            }
            if (a.emoji !== b.emoji) {
                return false;
            }
            if (!a.sprite && !b.sprite) {
                return true;
            }
            if (!a.sprite || !b.sprite) {
                return false;
            }
            return a.sprite.atlasId === b.sprite.atlasId && a.sprite.frame === b.sprite.frame;
        }
        notifyExpressionChangeListeners() {
            for (const listener of this.expressionChangeListeners) {
                try {
                    listener(this.expressionDescriptor, this);
                }
                catch (error) {
                    console.error(`Error in expression listener for ${this.name}:`, error);
                }
            }
        }
        resetPainExpression() {
            if (this.painExpressionLocked) {
                this.painExpressionLocked = false;
                this.evaluateExpression(true);
            }
        }
        resetWinExpression() {
            if (this.winExpressionLocked) {
                this.winExpressionLocked = false;
                this.evaluateExpression(true);
            }
        }
        isPainExpressionActive() {
            return this.painExpressionLocked;
        }
        isWinExpressionActive() {
            return this.winExpressionLocked;
        }
        getCrescendoValue() {
            return this.crescendoValue;
        }
        getCrescendoNormalized() {
            return Math.max(0, Math.min(1, this.crescendoValue / this.crescendoConfig.maxValue));
        }
        isInCrescendoZone() {
            const target = this.crescendoConfig.targetArousalValue;
            const tolerance = this.crescendoConfig.arousalTolerance;
            return this.arousalValue >= (target - tolerance) &&
                this.arousalValue <= (target + tolerance);
        }
        hasCrescendoThresholdReached() {
            return this.crescendoThresholdReached;
        }
        updateCrescendo(deltaTime) {
            if (this.crescendoThresholdReached) {
                return;
            }
            const oldValue = this.crescendoValue;
            const inZone = this.isInCrescendoZone();
            let rate;
            if (inZone && this.crescendoEnabled) {
                rate = this.crescendoConfig.riseRate;
            }
            else {
                rate = -this.crescendoConfig.decayRate;
            }
            const change = rate * deltaTime;
            this.crescendoValue = Math.max(0.1, Math.min(this.crescendoConfig.maxValue, this.crescendoValue + change));
            if (!this.crescendoThresholdReached && this.crescendoValue >= this.crescendoConfig.threshold) {
                this.crescendoThresholdReached = true;
                this.crescendoValue = this.crescendoConfig.threshold;
                this.winExpressionLocked = true;
                this.evaluateExpression(true);
                this.notifyCrescendoThresholdListeners();
            }
            if (oldValue !== this.crescendoValue) {
                this.notifyCrescendoChangeListeners();
            }
        }
        enableCrescendo() {
            this.crescendoEnabled = true;
        }
        disableCrescendo() {
            this.crescendoEnabled = false;
        }
        isCrescendoEnabled() {
            return this.crescendoEnabled;
        }
        onCrescendoChange(callback) {
            this.crescendoChangeListeners.push(callback);
        }
        removeCrescendoListener(callback) {
            const index = this.crescendoChangeListeners.indexOf(callback);
            if (index !== -1) {
                this.crescendoChangeListeners.splice(index, 1);
            }
        }
        onCrescendoThreshold(callback) {
            this.crescendoThresholdListeners.push(callback);
        }
        removeCrescendoThresholdListener(callback) {
            const index = this.crescendoThresholdListeners.indexOf(callback);
            if (index !== -1) {
                this.crescendoThresholdListeners.splice(index, 1);
            }
        }
        notifyCrescendoChangeListeners() {
            for (const listener of this.crescendoChangeListeners) {
                try {
                    listener(this.crescendoValue, this);
                }
                catch (error) {
                    console.error(`Error in crescendo listener for ${this.name}:`, error);
                }
            }
            this.evaluateExpression();
        }
        notifyCrescendoThresholdListeners() {
            for (const listener of this.crescendoThresholdListeners) {
                try {
                    listener(this);
                }
                catch (error) {
                    console.error(`Error in crescendo threshold listener for ${this.name}:`, error);
                }
            }
        }
        getDebugSection() {
            return {
                title: `${this.name} Configuration`,
                controls: [
                    {
                        type: 'display',
                        label: 'Arousal',
                        getValue: () => this.arousalValue.toFixed(2)
                    },
                    {
                        type: 'slider',
                        label: 'Baseline',
                        min: 0,
                        max: 5,
                        step: 0.1,
                        getValue: () => this.arousalConfig.baselineValue,
                        setValue: (value) => { this.arousalConfig.baselineValue = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Decay Rate',
                        min: 0.1,
                        max: 2.0,
                        step: 0.1,
                        getValue: () => this.arousalConfig.decayRate,
                        setValue: (value) => { this.arousalConfig.decayRate = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Sensitivity',
                        min: 0.5,
                        max: 5.0,
                        step: 0.1,
                        getValue: () => this.arousalConfig.sensitivity,
                        setValue: (value) => { this.arousalConfig.sensitivity = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Pain Threshold',
                        min: 3.0,
                        max: 8.0,
                        step: 0.1,
                        getValue: () => this.arousalConfig.painThreshold,
                        setValue: (value) => { this.arousalConfig.painThreshold = value; }
                    },
                    {
                        type: 'display',
                        label: 'Momentum',
                        getValue: () => this.arousalMomentum.toFixed(3)
                    },
                    {
                        type: 'slider',
                        label: 'Momentum Spread Sec',
                        min: 0.1,
                        max: 1.0,
                        step: 0.05,
                        getValue: () => this.momentumSpreadDuration,
                        setValue: (value) => { this.momentumSpreadDuration = value; }
                    },
                    {
                        type: 'display',
                        label: 'Crescendo',
                        getValue: () => this.crescendoValue.toFixed(2)
                    },
                    {
                        type: 'slider',
                        label: 'Target Arousal',
                        min: 2.0,
                        max: 6.0,
                        step: 0.1,
                        getValue: () => this.crescendoConfig.targetArousalValue,
                        setValue: (value) => { this.crescendoConfig.targetArousalValue = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Tolerance',
                        min: 0.1,
                        max: 2.0,
                        step: 0.1,
                        getValue: () => this.crescendoConfig.arousalTolerance,
                        setValue: (value) => { this.crescendoConfig.arousalTolerance = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Rise Rate',
                        min: 0.05,
                        max: 0.5,
                        step: 0.05,
                        getValue: () => this.crescendoConfig.riseRate,
                        setValue: (value) => { this.crescendoConfig.riseRate = value; }
                    },
                    {
                        type: 'slider',
                        label: 'Decay Rate',
                        min: 0.05,
                        max: 0.5,
                        step: 0.05,
                        getValue: () => this.crescendoConfig.decayRate,
                        setValue: (value) => { this.crescendoConfig.decayRate = value; }
                    }
                ]
            };
        }
    }
    Jamble.BaseNPC = BaseNPC;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    let KnobState;
    (function (KnobState) {
        KnobState[KnobState["ACTIVE"] = 0] = "ACTIVE";
        KnobState[KnobState["RETRACTING"] = 1] = "RETRACTING";
        KnobState[KnobState["RETRACTED"] = 2] = "RETRACTED";
        KnobState[KnobState["SPAWNING"] = 3] = "SPAWNING";
    })(KnobState = Jamble.KnobState || (Jamble.KnobState = {}));
    class Knob extends Jamble.GameObject {
        constructor(id, x = 0, y = 0, slotManager, slotId, activeNPC) {
            super(id, x, y);
            this.currencyValue = 1;
            this.topHitValue = 5;
            this.config = {
                length: 10,
                segments: 6,
                omega: 18.0,
                zeta: 0.25,
                maxAngleDeg: 85,
                bowFactor: 0.35,
                lineWidth: 12,
                knobColor: '#ff968f',
                baseRadius: 3,
                showPoints: false,
                visualOffsetY: 4
            };
            this.theta = 0;
            this.thetaDot = 0;
            this.thetaTarget = 0;
            this.basePos = { x: 0, y: 0 };
            this.springPoints = [];
            this.state = KnobState.SPAWNING;
            this.currentSlotId = '';
            this.economyManager = Jamble.EconomyManager.getInstance();
            this.activeNPC = activeNPC;
            this.anim = new Jamble.KnobAnim(this);
            this.slotManager = slotManager;
            this.currentSlotId = slotId;
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#ff6b35',
                    shape: 'custom',
                    width: 80,
                    height: 80,
                    customDraw: this.drawKnob.bind(this)
                },
                anchor: { x: 0.5, y: 1 }
            };
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 30,
                height: 30,
                anchor: { x: 0.5, y: 0.5 },
                category: 'kinematic',
                enabled: false
            };
            this.anim.triggerInitialSpawn(() => {
                this.state = KnobState.ACTIVE;
                if (this.collisionBox) {
                    this.collisionBox.enabled = true;
                }
            });
        }
        update(deltaTime) {
            this.anim.update(deltaTime);
            if (this.state === KnobState.ACTIVE || this.state === KnobState.SPAWNING ||
                this.state === KnobState.RETRACTING) {
                this.updateSpringPoints();
            }
        }
        updateSpringPoints() {
            var _a, _b, _c, _d;
            const width = this.render.canvas.width || 80;
            const height = this.render.canvas.height || 80;
            const anchorX = ((_b = (_a = this.render.anchor) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0.5) * width;
            const anchorY = ((_d = (_c = this.render.anchor) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 1.0) * height;
            this.basePos.x = anchorX;
            this.basePos.y = anchorY;
            const tipX = this.basePos.x + this.config.length * Math.sin(this.theta);
            const tipY = this.basePos.y - this.config.length * Math.cos(this.theta);
            const normal = { x: Math.cos(this.theta), y: Math.sin(this.theta) };
            const midX = (this.basePos.x + tipX) / 2;
            const midY = (this.basePos.y + tipY) / 2;
            const bowOffset = -this.config.bowFactor * this.config.length * this.theta;
            const controlX = midX + normal.x * bowOffset;
            const controlY = midY + normal.y * bowOffset;
            const segments = Math.max(2, Math.round(this.config.segments));
            this.springPoints = [];
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const omt = 1 - t;
                const x = omt * omt * this.basePos.x + 2 * omt * t * controlX + t * t * tipX;
                const y = omt * omt * this.basePos.y + 2 * omt * t * controlY + t * t * tipY;
                this.springPoints.push({ x, y });
            }
        }
        drawKnob(ctx, x, y) {
            if (this.state === KnobState.RETRACTED)
                return;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = this.config.knobColor;
            ctx.lineWidth = this.config.lineWidth;
            ctx.beginPath();
            if (this.springPoints.length > 0) {
                const adjustedPoints = this.springPoints.map(p => ({
                    x: x + p.x,
                    y: y + p.y
                }));
                ctx.moveTo(adjustedPoints[0].x, adjustedPoints[0].y);
                for (let i = 1; i < adjustedPoints.length - 1; i++) {
                    const midX = 0.5 * (adjustedPoints[i].x + adjustedPoints[i + 1].x);
                    const midY = 0.5 * (adjustedPoints[i].y + adjustedPoints[i + 1].y);
                    ctx.quadraticCurveTo(adjustedPoints[i].x, adjustedPoints[i].y, midX, midY);
                }
                if (adjustedPoints.length > 1) {
                    const last = adjustedPoints[adjustedPoints.length - 1];
                    ctx.lineTo(last.x, last.y);
                }
            }
            ctx.stroke();
            ctx.fillStyle = this.config.knobColor;
            ctx.beginPath();
            ctx.arc(x + this.basePos.x, y + this.basePos.y, this.config.baseRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        deflect(direction) {
            this.anim.triggerDeflect(direction);
        }
        onPlayerContact(player) {
            if (this.state !== KnobState.ACTIVE)
                return 0;
            const collisionType = this.detectCollisionType(player);
            let currencyAmount = this.currencyValue;
            let arousalImpact;
            if (collisionType === 'top') {
                currencyAmount = this.topHitValue;
                arousalImpact = 0.5;
                this.anim.triggerSquash();
            }
            else {
                arousalImpact = 0.3;
                this.anim.triggerDeflect(Math.random() > 0.5 ? 1 : -1);
            }
            this.economyManager.addCurrency(currencyAmount);
            this.activeNPC.applyArousalImpulse(arousalImpact, player, collisionType);
            return currencyAmount;
        }
        detectCollisionType(player) {
            const playerY = player.transform.y;
            const knobY = this.transform.y;
            const isMovingDown = player.velocityY > 0;
            const isAboveKnob = playerY < knobY - 10;
            if (isMovingDown && isAboveKnob) {
                return 'top';
            }
            return 'side';
        }
        onTriggerEnter(other) {
            if (this.state !== KnobState.ACTIVE)
                return;
            if (other instanceof Jamble.Player) {
                this.onPlayerContact(other);
            }
        }
        retract() {
            if (this.state !== KnobState.ACTIVE)
                return;
            this.state = KnobState.RETRACTING;
            if (this.collisionBox) {
                this.collisionBox.enabled = false;
            }
            if (this.anim.isAnimating()) {
                this.waitForAnimationThenDespawn();
            }
            else {
                this.startDespawn();
            }
        }
        waitForAnimationThenDespawn() {
            const checkInterval = setInterval(() => {
                if (!this.anim.isAnimating()) {
                    clearInterval(checkInterval);
                    this.startDespawn();
                }
            }, 16);
        }
        startDespawn() {
            this.anim.triggerDespawn(() => {
                this.state = KnobState.RETRACTED;
                this.render.visible = false;
                this.anim.reset();
            });
        }
        manualRespawn() {
            if (this.state !== KnobState.RETRACTED)
                return;
            this.state = KnobState.SPAWNING;
            this.render.visible = true;
            this.anim.triggerSpawn(() => {
                this.state = KnobState.ACTIVE;
                if (this.collisionBox) {
                    this.collisionBox.enabled = true;
                }
            });
        }
        getState() {
            return this.state;
        }
        isActive() {
            return this.state === KnobState.ACTIVE;
        }
    }
    Jamble.Knob = Knob;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class KnobAnim {
        constructor(knob) {
            this.knob = knob;
            this.deflectDuration = 0.2;
            this.squashHoldTimeS = 0.15;
            this.squashOmega = 24.6;
            this.squashZeta = 0.15;
            this.maxAnimationTime = 1.5;
            this.squashPercent = 4;
            this.widthMultiplier = 1.3;
            this.settlementThreshold = 0.01;
            this.isDeflecting = false;
            this.deflectionDirection = 1;
            this.deflectTimer = 0;
            this.isSquashing = false;
            this.squashPhase = 'compress';
            this.originalLength = 0;
            this.originalLineWidth = 0;
            this.squashVelocity = 0;
            this.squashPhaseTimer = 0;
            this.squashSpringElapsed = 0;
            this.isDespawning = false;
            this.despawnPhaseTimer = 0;
            this.isSpawning = false;
            this.spawnSpringElapsed = 0;
            this.spawnVelocity = 0;
            this.isInitialSpawnDelaying = false;
            this.initialSpawnDelayTimer = 0;
            this.initialSpawnDelay = 0.75;
            this.originalLength = knob.config.length;
            this.originalLineWidth = knob.config.lineWidth;
        }
        update(deltaTime) {
            if (this.isInitialSpawnDelaying) {
                this.updateInitialSpawnDelay(deltaTime);
                return;
            }
            if (this.isDespawning) {
                this.updateDespawn(deltaTime);
                return;
            }
            if (this.isSpawning) {
                this.updateSpawn(deltaTime);
                return;
            }
            if (this.isDeflecting) {
                this.deflectTimer -= deltaTime;
                if (this.deflectTimer <= 0) {
                    this.isDeflecting = false;
                    this.knob.thetaTarget = 0;
                }
                else {
                    const maxAngle = (this.knob.config.maxAngleDeg * Math.PI) / 180;
                    this.knob.thetaTarget = this.deflectionDirection * maxAngle;
                }
            }
            const angZeta = this.knob.config.zeta;
            const angOmega = this.knob.config.omega;
            const angAcc = -2 * angZeta * angOmega * this.knob.thetaDot -
                (angOmega * angOmega) * (this.knob.theta - this.knob.thetaTarget);
            this.knob.thetaDot += angAcc * deltaTime;
            this.knob.theta += this.knob.thetaDot * deltaTime;
            if (!this.isSquashing)
                return;
            if (this.squashPhase === 'compress') {
                this.squashPhaseTimer -= deltaTime;
                if (this.squashPhaseTimer <= 0) {
                    this.squashPhase = 'hold';
                    this.squashPhaseTimer = this.squashHoldTimeS;
                }
                return;
            }
            if (this.squashPhase === 'hold') {
                this.squashPhaseTimer -= deltaTime;
                if (this.squashPhaseTimer <= 0) {
                    this.squashPhase = 'spring';
                    this.squashSpringElapsed = 0;
                }
                return;
            }
            if (this.squashPhase === 'spring') {
                this.updateSpringPhysics(this.originalLength, (newLength) => { this.knob.config.length = newLength; }, this.squashVelocity, (newVelocity) => { this.squashVelocity = newVelocity; }, deltaTime);
                this.squashSpringElapsed += deltaTime;
                this.updateWidthAnimation(this.knob.config.length, this.originalLength);
                const isSettled = Math.abs(this.knob.config.length - this.originalLength) < this.settlementThreshold &&
                    Math.abs(this.squashVelocity) < this.settlementThreshold;
                if (isSettled || this.squashSpringElapsed > this.maxAnimationTime) {
                    this.knob.config.length = this.originalLength;
                    this.knob.config.lineWidth = this.originalLineWidth;
                    this.isSquashing = false;
                    this.squashVelocity = 0;
                }
            }
        }
        updateSpringPhysics(targetLength, setLength, velocity, setVelocity, deltaTime) {
            const currentLength = this.knob.config.length;
            const displacement = currentLength - targetLength;
            const acc = -2 * this.squashZeta * this.squashOmega * velocity -
                (this.squashOmega * this.squashOmega) * displacement;
            const newVelocity = velocity + acc * deltaTime;
            const newLength = currentLength + newVelocity * deltaTime;
            setVelocity(newVelocity);
            setLength(newLength);
        }
        updateWidthAnimation(currentLength, targetLength) {
            const displacement = Math.abs(currentLength - targetLength);
            const lengthProgress = 1 - displacement / Math.abs(targetLength * 0.9);
            const clampedProgress = Math.max(0, Math.min(1, lengthProgress));
            this.knob.config.lineWidth = this.originalLineWidth * this.widthMultiplier -
                (this.originalLineWidth * (this.widthMultiplier - 1.0) * clampedProgress);
        }
        triggerDeflect(direction) {
            this.isDeflecting = true;
            this.deflectionDirection = direction >= 0 ? 1 : -1;
            const maxAngle = (this.knob.config.maxAngleDeg * Math.PI) / 180;
            this.knob.thetaTarget = this.deflectionDirection * maxAngle;
            this.deflectTimer = this.deflectDuration;
        }
        triggerSquash() {
            this.isSquashing = true;
            this.squashPhase = 'compress';
            this.originalLength = this.knob.config.length;
            this.originalLineWidth = this.knob.config.lineWidth;
            this.squashVelocity = 0;
            this.squashSpringElapsed = 0;
            this.applyCompression();
            this.squashPhaseTimer = this.squashHoldTimeS;
        }
        applyCompression() {
            this.knob.config.length = this.originalLength * (this.squashPercent / 100);
            this.knob.config.lineWidth = this.originalLineWidth * this.widthMultiplier;
        }
        triggerDespawn(onComplete) {
            this.stopAllAnimations();
            this.isDespawning = true;
            this.onDespawnComplete = onComplete;
            this.originalLength = this.knob.config.length;
            this.originalLineWidth = this.knob.config.lineWidth;
            this.applyCompression();
            this.despawnPhaseTimer = this.squashHoldTimeS;
        }
        triggerSpawn(onComplete) {
            this.isSpawning = true;
            this.onSpawnComplete = onComplete;
            this.spawnSpringElapsed = 0;
            this.spawnVelocity = 0;
            this.applyCompression();
        }
        triggerInitialSpawn(onComplete) {
            this.isInitialSpawnDelaying = true;
            this.initialSpawnDelayTimer = this.initialSpawnDelay;
            this.onSpawnComplete = onComplete;
            this.applyCompression();
        }
        updateInitialSpawnDelay(deltaTime) {
            this.initialSpawnDelayTimer -= deltaTime;
            if (this.initialSpawnDelayTimer <= 0) {
                this.isInitialSpawnDelaying = false;
                this.isSpawning = true;
                this.spawnSpringElapsed = 0;
                this.spawnVelocity = 0;
            }
        }
        stopAllAnimations() {
            this.isDeflecting = false;
            this.isSquashing = false;
            this.isSpawning = false;
        }
        updateDespawn(deltaTime) {
            this.despawnPhaseTimer -= deltaTime;
            if (this.despawnPhaseTimer <= 0) {
                this.isDespawning = false;
                if (this.onDespawnComplete) {
                    this.onDespawnComplete();
                    this.onDespawnComplete = undefined;
                }
            }
        }
        updateSpawn(deltaTime) {
            this.updateSpringPhysics(this.originalLength, (newLength) => { this.knob.config.length = newLength; }, this.spawnVelocity, (newVelocity) => { this.spawnVelocity = newVelocity; }, deltaTime);
            this.spawnSpringElapsed += deltaTime;
            this.updateWidthAnimation(this.knob.config.length, this.originalLength);
            const isSettled = Math.abs(this.knob.config.length - this.originalLength) < this.settlementThreshold &&
                Math.abs(this.spawnVelocity) < this.settlementThreshold;
            if (isSettled || this.spawnSpringElapsed > this.maxAnimationTime) {
                this.knob.config.length = this.originalLength;
                this.knob.config.lineWidth = this.originalLineWidth;
                this.isSpawning = false;
                this.spawnVelocity = 0;
                if (this.onSpawnComplete) {
                    this.onSpawnComplete();
                    this.onSpawnComplete = undefined;
                }
            }
        }
        isAnimating() {
            return this.isDeflecting || this.isSquashing || this.isDespawning || this.isSpawning || this.isInitialSpawnDelaying;
        }
        reset() {
            this.stopAllAnimations();
            this.isDespawning = false;
            this.isInitialSpawnDelaying = false;
            this.squashVelocity = 0;
            this.spawnVelocity = 0;
            this.knob.config.length = this.originalLength;
            this.knob.config.lineWidth = this.originalLineWidth;
        }
    }
    Jamble.KnobAnim = KnobAnim;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Platform extends Jamble.GameObject {
        constructor(id, x = 0, y = 0) {
            super(id, x, y);
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#9e9e9e',
                    shape: 'rectangle',
                    width: 20,
                    height: 20
                },
                anchor: { x: 0.5, y: 1 }
            };
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 20,
                height: 20,
                anchor: { x: 0.5, y: 1 },
                category: 'environment'
            };
        }
        update(deltaTime) {
        }
    }
    Jamble.Platform = Platform;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class MoveSkill {
        constructor() {
            this.id = 'move';
            this.name = 'Move';
            this.enabled = true;
        }
        execute(player) {
        }
    }
    Jamble.MoveSkill = MoveSkill;
    class JumpSkill {
        constructor() {
            this.id = 'jump';
            this.name = 'Jump';
            this.enabled = true;
        }
        execute(player) {
            if (this.enabled) {
                player.jump();
            }
        }
    }
    Jamble.JumpSkill = JumpSkill;
    class SkillManager {
        constructor() {
            this.equippedSkills = new Map();
            this.equipSkill(new MoveSkill());
            this.equipSkill(new JumpSkill());
        }
        equipSkill(skill) {
            this.equippedSkills.set(skill.id, skill);
        }
        hasSkill(id) {
            return this.equippedSkills.has(id);
        }
        useSkill(id, player) {
            const skill = this.equippedSkills.get(id);
            if (skill && skill.enabled !== false) {
                skill.execute(player);
            }
        }
        setSkillEnabled(id, enabled) {
            const skill = this.equippedSkills.get(id);
            if (skill) {
                skill.enabled = enabled;
            }
        }
        getEquippedSkills() {
            return Array.from(this.equippedSkills.values());
        }
    }
    Jamble.SkillManager = SkillManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class CanvasRenderer {
        constructor(gameElement, gameWidth, gameHeight) {
            this.backgroundColor = '#e8f5e9';
            this.backgroundAlpha = 1.0;
            this.scaleX = 1;
            this.scaleY = 1;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.canvas = document.createElement('canvas');
            this.ctx = this.setupContext();
            this.setupCanvas(gameElement);
            this.setupHighDPIRendering(gameElement);
        }
        setupCanvas(gameElement) {
            this.canvas.id = 'gameCanvas';
            this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
        z-index: 3;
      `;
            gameElement.appendChild(this.canvas);
        }
        setupContext() {
            const ctx = this.canvas.getContext('2d', { alpha: true });
            if (!ctx) {
                throw new Error('Could not get 2D canvas context');
            }
            ctx.imageSmoothingEnabled = false;
            return ctx;
        }
        setupHighDPIRendering(_gameElement) {
            const pixelRatio = window.devicePixelRatio || 1;
            this.canvas.width = this.gameWidth * pixelRatio;
            this.canvas.height = this.gameHeight * pixelRatio;
            this.scaleX = pixelRatio;
            this.scaleY = pixelRatio;
            this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
            this.ctx.imageSmoothingEnabled = false;
        }
        setBackgroundAlpha(alpha) {
            this.backgroundAlpha = Math.max(0, Math.min(1, alpha));
        }
        render(gameObjects) {
            this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.save();
            this.ctx.globalAlpha = this.backgroundAlpha;
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.restore();
            gameObjects.forEach(obj => {
                if (!obj.render.visible)
                    return;
                this.ctx.save();
                if (obj.render.opacity !== undefined) {
                    this.ctx.globalAlpha = obj.render.opacity;
                }
                this.applyTransform(obj);
                this.renderCanvasObject(obj);
                this.ctx.restore();
            });
        }
        applyTransform(obj) {
            var _a, _b, _c, _d;
            const x = obj.transform.x;
            const y = obj.transform.y;
            const width = obj.render.canvas.width || 20;
            const height = obj.render.canvas.height || 20;
            const anchorX = ((_b = (_a = obj.render.anchor) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0.5) * width;
            const anchorY = ((_d = (_c = obj.render.anchor) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0.5) * height;
            this.ctx.translate(x, y);
            const animation = obj.render.animation;
            if (animation && (animation.scaleX !== 1 || animation.scaleY !== 1)) {
                this.ctx.translate(0, 0);
                this.ctx.scale(animation.scaleX, animation.scaleY);
            }
            this.ctx.translate(-anchorX, -anchorY);
        }
        renderCanvasObject(obj) {
            const canvas = obj.render.canvas;
            const width = canvas.width || 20;
            const height = canvas.height || 20;
            if (canvas.shape === 'custom' && canvas.customDraw) {
                canvas.customDraw(this.ctx, 0, 0);
            }
            else {
                this.ctx.fillStyle = canvas.color;
                if (canvas.shape === 'rectangle') {
                    if (canvas.borderRadius && canvas.borderRadius > 0) {
                        this.drawRoundedRect(0, 0, width, height, canvas.borderRadius);
                    }
                    else {
                        this.ctx.fillRect(0, 0, width, height);
                    }
                }
                else if (canvas.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            }
        }
        drawRoundedRect(x, y, width, height, radius) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + width - radius, y);
            this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.ctx.lineTo(x + width, y + height - radius);
            this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.ctx.lineTo(x + radius, y + height);
            this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
            this.ctx.closePath();
            this.ctx.fill();
        }
        clear() {
            this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        }
    }
    Jamble.CanvasRenderer = CanvasRenderer;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class DebugRenderer {
        constructor(gameElement) {
            this.CATEGORY_COLORS = {
                player: '#7F00FF',
                deadly: '#ef4444',
                kinematic: '#ffcc02',
                environment: '#60a5fa'
            };
            this.gameElement = gameElement;
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      `;
            const ctx = this.canvas.getContext('2d');
            if (!ctx)
                throw new Error('DebugRenderer: 2D context unavailable');
            this.ctx = ctx;
            gameElement.appendChild(this.canvas);
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
        resize() {
            const rect = this.gameElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const width = Math.max(1, rect.width || this.gameElement.offsetWidth || 500);
            const height = Math.max(1, rect.height || this.gameElement.offsetHeight || 100);
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }
        render(gameObjects, showColliders, showOrigins = false, showSlots = false, slots) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (!showColliders && !showOrigins && !showSlots)
                return;
            if (showColliders) {
                gameObjects.forEach(obj => {
                    if (obj.collisionBox) {
                        this.drawCollisionForObject(obj);
                    }
                });
                this.drawPlayAreaBoundary();
            }
            if (showOrigins) {
                gameObjects.forEach(obj => {
                    if (obj.render.visible) {
                        this.drawOrigin(obj);
                    }
                });
            }
            if (showSlots && slots) {
                this.drawSlots(slots);
            }
        }
        drawCollisionForObject(obj) {
            var _a, _b, _c, _d;
            const box = obj.collisionBox;
            const color = this.CATEGORY_COLORS[box.category];
            const ax = (_b = (_a = box.anchor) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
            const ay = (_d = (_c = box.anchor) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
            const x = obj.transform.x - ax * box.width;
            const y = obj.transform.y - ay * box.height;
            this.ctx.fillStyle = color + '30';
            this.ctx.fillRect(x, y, box.width, box.height);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, box.width, box.height);
        }
        drawPlayAreaBoundary() {
            const rect = this.gameElement.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(0, 0, width, height);
            this.ctx.setLineDash([]);
        }
        drawOrigin(obj) {
            const x = obj.transform.x;
            const y = obj.transform.y;
            const size = 8;
            this.ctx.strokeStyle = '#ff6b35';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size, y);
            this.ctx.lineTo(x + size, y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x, y + size);
            this.ctx.stroke();
            this.ctx.fillStyle = '#ff6b35';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = '#ff6b35';
            this.ctx.font = '8px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(obj.id, x + 6, y - 6);
        }
        drawSlots(slots) {
            const slotSize = 4;
            const slotColors = {
                'ground': '#8b4513',
                'air_low': '#87ceeb',
                'air_mid': '#4682b4',
                'air_high': '#1e90ff',
                'ceiling': '#696969'
            };
            slots.forEach(slot => {
                const color = slotColors[slot.type];
                const x = slot.x;
                const y = slot.y;
                this.ctx.fillStyle = slot.occupied ? color + '80' : color + '40';
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(x, y, slotSize, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
                if (slot.occupied) {
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            });
        }
        setVisible(visible) {
            this.canvas.style.display = visible ? 'block' : 'none';
        }
    }
    Jamble.DebugRenderer = DebugRenderer;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class CollisionManager {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.prevTriggerPairs = new Set();
        }
        update(gameObjects) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const dynamics = [];
            const solids = [];
            const triggers = [];
            const byId = new Map();
            for (const obj of gameObjects)
                byId.set(obj.id, obj);
            for (const obj of gameObjects) {
                if (!obj.collisionBox || obj.collisionBox.enabled === false)
                    continue;
                const cat = obj.collisionBox.category;
                if (cat === 'player')
                    dynamics.push(obj);
                if (cat === 'environment')
                    solids.push(obj);
                if (cat === 'kinematic' || cat === 'deadly')
                    triggers.push(obj);
            }
            for (const dyn of dynamics) {
                if (!dyn.collisionBox || dyn.collisionBox.enabled === false)
                    continue;
                const wasGrounded = dyn.grounded === true;
                const vyBefore = (_a = dyn.velocityY) !== null && _a !== void 0 ? _a : 0;
                for (const solid of solids) {
                    if (dyn === solid || !solid.collisionBox || solid.collisionBox.enabled === false)
                        continue;
                    this.resolveAABB(dyn, solid);
                }
                this.clampToWorld(dyn);
                const pb = this.getAABB(dyn);
                const eps = CollisionManager.EPS;
                let grounded = false;
                if (pb.y + pb.height >= this.gameHeight - eps) {
                    grounded = true;
                }
                else {
                    for (const solid of solids) {
                        if (!solid.collisionBox || solid.collisionBox.enabled === false)
                            continue;
                        const ob = this.getAABB(solid);
                        const horizontalOverlap = pb.x < ob.x + ob.width && pb.x + pb.width > ob.x;
                        const touchingTop = Math.abs((pb.y + pb.height) - ob.y) <= eps;
                        if (horizontalOverlap && touchingTop && vyBefore >= 0) {
                            grounded = true;
                            break;
                        }
                    }
                }
                if (dyn.grounded !== undefined) {
                    dyn.grounded = grounded;
                    if (!wasGrounded && grounded) {
                        (_c = (_b = dyn).onLanded) === null || _c === void 0 ? void 0 : _c.call(_b, vyBefore);
                    }
                }
            }
            const currentPairs = new Set();
            for (const dyn of dynamics) {
                if (!dyn.collisionBox || dyn.collisionBox.enabled === false)
                    continue;
                for (const other of triggers) {
                    if (!other.collisionBox || other.collisionBox.enabled === false)
                        continue;
                    if (other.id.includes('sensor') && other.isEnabled && !other.isEnabled())
                        continue;
                    if (dyn === other)
                        continue;
                    if (this.aabbIntersects(dyn, other)) {
                        const key = `${dyn.id}|${other.id}`;
                        currentPairs.add(key);
                        if (!this.prevTriggerPairs.has(key)) {
                            (_d = other.onTriggerEnter) === null || _d === void 0 ? void 0 : _d.call(other, dyn);
                            (_e = dyn.onTriggerEnter) === null || _e === void 0 ? void 0 : _e.call(dyn, other);
                        }
                        else {
                            (_f = other.onTriggerStay) === null || _f === void 0 ? void 0 : _f.call(other, dyn);
                            (_g = dyn.onTriggerStay) === null || _g === void 0 ? void 0 : _g.call(dyn, other);
                        }
                    }
                }
            }
            for (const key of this.prevTriggerPairs) {
                if (!currentPairs.has(key)) {
                    const [dynId, otherId] = key.split('|');
                    const dyn = byId.get(dynId);
                    const other = byId.get(otherId);
                    if (dyn && other) {
                        (_h = other.onTriggerExit) === null || _h === void 0 ? void 0 : _h.call(other, dyn);
                        (_j = dyn.onTriggerExit) === null || _j === void 0 ? void 0 : _j.call(dyn, other);
                    }
                }
            }
            this.prevTriggerPairs = currentPairs;
        }
        aabbIntersects(a, b) {
            const A = this.getAABB(a);
            const B = this.getAABB(b);
            return (A.x < B.x + B.width &&
                A.x + A.width > B.x &&
                A.y < B.y + B.height &&
                A.y + A.height > B.y);
        }
        getAABB(obj) {
            var _a, _b, _c, _d;
            const cb = obj.collisionBox;
            const ax = (_b = (_a = cb.anchor) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
            const ay = (_d = (_c = cb.anchor) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
            const x = obj.transform.x - ax * cb.width;
            const y = obj.transform.y - ay * cb.height;
            return { x, y, width: cb.width, height: cb.height };
        }
        setColliderTopLeft(obj, x, y) {
            if (!obj.collisionBox || obj.collisionBox.enabled === false)
                return;
            obj.collisionBox.x = x;
            obj.collisionBox.y = y;
        }
        resolveAABB(dyn, solid) {
            const pb = this.getAABB(dyn);
            const ob = this.getAABB(solid);
            const intersects = (pb.x < ob.x + ob.width &&
                pb.x + pb.width > ob.x &&
                pb.y < ob.y + ob.height &&
                pb.y + pb.height > ob.y);
            if (!intersects)
                return;
            const pushLeft = (pb.x + pb.width) - ob.x;
            const pushRight = (ob.x + ob.width) - pb.x;
            const pushUp = (pb.y + pb.height) - ob.y;
            const pushDown = (ob.y + ob.height) - pb.y;
            const minPushX = Math.min(pushLeft, pushRight);
            const minPushY = Math.min(pushUp, pushDown);
            if (minPushX < minPushY) {
                const isLeftSide = pushLeft < pushRight;
                const dx = isLeftSide ? -pushLeft : pushRight;
                dyn.transform.x += dx;
                this.setColliderTopLeft(dyn, pb.x + dx, pb.y);
                if (dyn.velocityX !== undefined) {
                    dyn.velocityX = 0;
                }
                if (dyn.onHorizontalCollision) {
                    dyn.onHorizontalCollision(isLeftSide ? 'left' : 'right', solid);
                }
            }
            else {
                const isTopSide = pushUp < pushDown;
                const dy = isTopSide ? -pushUp : pushDown;
                dyn.transform.y += dy;
                this.setColliderTopLeft(dyn, pb.x, pb.y + dy);
                if (dyn.velocityY !== undefined) {
                    dyn.velocityY = 0;
                }
                if (dyn.onVerticalCollision) {
                    dyn.onVerticalCollision(isTopSide ? 'top' : 'bottom', solid);
                }
            }
        }
        clampToWorld(obj) {
            if (!obj.collisionBox || obj.collisionBox.enabled === false)
                return;
            const pb = this.getAABB(obj);
            let dx = 0;
            let wallSide = null;
            if (pb.x < 0) {
                dx = -pb.x;
                wallSide = 'left';
            }
            else if (pb.x + pb.width > this.gameWidth) {
                dx = this.gameWidth - (pb.x + pb.width);
                wallSide = 'right';
            }
            if (dx !== 0) {
                obj.transform.x += dx;
                this.setColliderTopLeft(obj, pb.x + dx, pb.y);
                if (obj.velocityX !== undefined) {
                    obj.velocityX = 0;
                }
                if (wallSide && obj.onHorizontalCollision) {
                    obj.onHorizontalCollision(wallSide, null);
                }
            }
            const pb2 = this.getAABB(obj);
            if (pb2.y + pb2.height > this.gameHeight) {
                const dy = this.gameHeight - (pb2.y + pb2.height);
                obj.transform.y += dy;
                this.setColliderTopLeft(obj, pb2.x, pb2.y + dy);
                if (obj.velocityY !== undefined) {
                    obj.velocityY = 0;
                }
            }
        }
    }
    CollisionManager.EPS = 0.001;
    Jamble.CollisionManager = CollisionManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class InputManager {
        constructor() {
            this.keys = new Set();
            this.keyDownHandlers = new Map();
            this.keyUpHandlers = new Map();
            this.setupEventListeners();
        }
        setupEventListeners() {
            document.addEventListener('keydown', (e) => {
                this.keys.add(e.code);
                const handler = this.keyDownHandlers.get(e.code);
                if (handler) {
                    handler();
                    e.preventDefault();
                }
            });
            document.addEventListener('keyup', (e) => {
                this.keys.delete(e.code);
                const handler = this.keyUpHandlers.get(e.code);
                if (handler) {
                    handler();
                }
            });
        }
        isKeyPressed(keyCode) {
            return this.keys.has(keyCode);
        }
        onKeyDown(keyCode, handler) {
            this.keyDownHandlers.set(keyCode, handler);
        }
        onKeyUp(keyCode, handler) {
            this.keyUpHandlers.set(keyCode, handler);
        }
        removeKeyHandler(keyCode) {
            this.keyDownHandlers.delete(keyCode);
            this.keyUpHandlers.delete(keyCode);
        }
        isMovingLeft() {
            return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA');
        }
        isMovingRight() {
            return this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD');
        }
        isJumping() {
            return this.isKeyPressed('Space');
        }
        destroy() {
            this.keyDownHandlers.clear();
            this.keyUpHandlers.clear();
            this.keys.clear();
        }
    }
    Jamble.InputManager = InputManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class StateManager {
        constructor() {
            this.currentState = 'transition';
            this.editorMode = 'none';
            this.stateStartTime = 0;
            this.currentState = 'transition';
            this.stateStartTime = Date.now();
        }
        getCurrentState() {
            return this.currentState;
        }
        getStateTime() {
            return Date.now() - this.stateStartTime;
        }
        isTransition() {
            return this.currentState === 'transition';
        }
        isIdle() {
            return this.currentState === 'idle';
        }
        isRunning() {
            return this.currentState === 'run';
        }
        enterTransition() {
            this.setState('transition');
        }
        enterIdle() {
            this.setState('idle');
        }
        startRun() {
            if (this.currentState === 'idle') {
                this.setState('run');
                return true;
            }
            return false;
        }
        returnToIdle() {
            this.enterTransition();
        }
        forceRunState() {
            this.setState('run');
        }
        getEditorMode() {
            return this.editorMode;
        }
        isInEditorMode() {
            return this.editorMode !== 'none';
        }
        enterTreePlacementMode() {
            if (this.editorMode !== 'tree-placement') {
                this.editorMode = 'tree-placement';
                window.dispatchEvent(new CustomEvent('jamble:editor-mode-change', {
                    detail: { mode: 'tree-placement' }
                }));
            }
        }
        exitEditorMode() {
            if (this.editorMode !== 'none') {
                this.editorMode = 'none';
                window.dispatchEvent(new CustomEvent('jamble:editor-mode-change', {
                    detail: { mode: 'none' }
                }));
            }
        }
        setState(newState) {
            if (this.currentState === newState)
                return;
            const oldState = this.currentState;
            this.currentState = newState;
            this.stateStartTime = Date.now();
        }
    }
    Jamble.StateManager = StateManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class UIComponent {
        constructor(gameElement, options = {}) {
            var _a, _b;
            this.isVisible = false;
            this.gameElement = gameElement;
            this.container = this.createContainer();
            this.mountNode = (_a = options.mountNode) !== null && _a !== void 0 ? _a : document.body;
            this.autoReposition = (_b = options.autoReposition) !== null && _b !== void 0 ? _b : true;
            this.setupInitialStyles();
            if (this.autoReposition) {
                this.setupResizeListener();
            }
        }
        setupInitialStyles() {
            if (!this.container.style.position) {
                this.container.style.position = 'fixed';
            }
            if (!this.container.style.zIndex) {
                this.container.style.zIndex = '10';
            }
        }
        reposition() {
            if (!this.isVisible)
                return;
            const gameRect = this.gameElement.getBoundingClientRect();
            const position = this.calculatePosition(gameRect);
            this.container.style.left = `${position.left}px`;
            this.container.style.top = `${position.top}px`;
        }
        setupResizeListener() {
            window.addEventListener('resize', () => {
                if (this.isVisible) {
                    this.reposition();
                }
            });
        }
        show() {
            if (!this.isVisible) {
                this.isVisible = true;
                this.container.style.display = 'block';
                this.mountNode.appendChild(this.container);
                if (this.autoReposition) {
                    setTimeout(() => this.reposition(), 0);
                }
            }
        }
        hide() {
            if (this.isVisible) {
                this.isVisible = false;
                this.container.style.display = 'none';
                if (this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }
        }
        update(_deltaTime) {
        }
        destroy() {
            this.hide();
        }
        getContainer() {
            return this.container;
        }
        getIsVisible() {
            return this.isVisible;
        }
    }
    Jamble.UIComponent = UIComponent;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class PortraitPanel {
        constructor(parent, size) {
            this.currentExpression = null;
            this.npc = null;
            this.size = size;
            this.canvas = document.createElement('canvas');
            this.canvas.width = size;
            this.canvas.height = size;
            this.canvas.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border: 1px solid #999;
        box-sizing: border-box;
      `;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);
            parent.appendChild(this.canvas);
        }
        setExpression(expression) {
            this.currentExpression = expression;
        }
        setNPC(npc) {
            this.npc = npc;
        }
        showPainFeedback() {
        }
        update(deltaTime) {
        }
        render() {
            const size = this.canvas.width / (window.devicePixelRatio || 1);
            this.ctx.clearRect(0, 0, size, size);
            if (!this.currentExpression) {
                return;
            }
            const emoji = this.currentExpression.emoji;
            if (!emoji) {
                return;
            }
            this.ctx.font = `${size * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, size / 2, size / 2);
            if (this.npc) {
                const fontSize = 8;
                const padding = 8;
                this.ctx.font = `${fontSize}px monospace`;
                this.ctx.fillStyle = '#666';
                this.ctx.textBaseline = 'top';
                const clientName = this.npc.getName();
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Client ID: ${clientName}`, size / 2, size - padding);
            }
        }
        setDimmed(dimmed) {
            this.canvas.style.opacity = dimmed ? '0.5' : '1';
            this.canvas.style.pointerEvents = dimmed ? 'none' : 'auto';
        }
    }
    Jamble.PortraitPanel = PortraitPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class LineGraphPanel {
        constructor(parent, width, height, options = {}) {
            var _a, _b, _c, _d, _e, _f;
            this.dataBuffer = [];
            this.pixelAccumulator = 0;
            this.sampleSpacing = (_a = options.sampleSpacing) !== null && _a !== void 0 ? _a : 1;
            this.scrollSpeed = (_b = options.scrollSpeed) !== null && _b !== void 0 ? _b : 50;
            this.smoothing = (_c = options.smoothing) !== null && _c !== void 0 ? _c : 0.3;
            this.strokeStyle = (_d = options.strokeStyle) !== null && _d !== void 0 ? _d : '#757575';
            this.verticalPaddingRatio = (_e = options.verticalPaddingRatio) !== null && _e !== void 0 ? _e : 0.1;
            this.initialValue = (_f = options.initialValue) !== null && _f !== void 0 ? _f : 0.5;
            this.smoothedValue = this.initialValue;
            this.logicalWidth = width;
            this.logicalHeight = height;
            this.devicePixelRatio = window.devicePixelRatio || 1;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.installCanvasSizing(width, height);
            parent.appendChild(this.canvas);
            this.maxBufferSize = Math.ceil(this.logicalWidth / this.sampleSpacing) + 10;
            this.resetBuffer();
        }
        onBeforeUpdate(_deltaTime) {
        }
        update(deltaTime) {
            this.onBeforeUpdate(deltaTime);
            this.pixelAccumulator += this.scrollSpeed * deltaTime;
            const secondsPerPixel = 1 / Math.max(1, this.scrollSpeed);
            const sampleIntervalSeconds = this.sampleSpacing * secondsPerPixel;
            while (this.pixelAccumulator >= this.sampleSpacing) {
                this.pixelAccumulator -= this.sampleSpacing;
                const sample = this.generateSample(sampleIntervalSeconds);
                if (sample !== null && sample !== undefined) {
                    this.pushData(sample);
                }
            }
        }
        render() {
            const width = this.logicalWidth;
            const height = this.logicalHeight;
            this.ctx.clearRect(0, 0, width, height);
            const totalSegments = this.dataBuffer.length - 1;
            if (totalSegments <= 0)
                return;
            const totalWidth = totalSegments * this.sampleSpacing;
            const startX = width - totalWidth;
            for (let i = 0; i < totalSegments; i++) {
                const x1 = startX + i * this.sampleSpacing;
                const x2 = startX + (i + 1) * this.sampleSpacing;
                const y1 = this.valueToY(this.dataBuffer[i], height);
                const y2 = this.valueToY(this.dataBuffer[i + 1], height);
                const age = (i + 1) / totalSegments;
                const opacity = Math.pow(age, 1.5);
                const segmentValue = this.dataBuffer[i + 1];
                const strokeColor = this.getStrokeColor(segmentValue);
                this.ctx.save();
                this.ctx.globalAlpha = opacity;
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
        pushData(value) {
            const clampedValue = Math.max(0, Math.min(1, value));
            this.smoothedValue = this.smoothing * clampedValue + (1 - this.smoothing) * this.smoothedValue;
            this.dataBuffer.push(this.smoothedValue);
            if (this.dataBuffer.length > this.maxBufferSize) {
                this.dataBuffer.shift();
            }
        }
        pushImmediate(value) {
            const clampedValue = Math.max(0, Math.min(1, value));
            this.smoothedValue = clampedValue;
            this.dataBuffer.push(clampedValue);
            if (this.dataBuffer.length > this.maxBufferSize) {
                this.dataBuffer.shift();
            }
        }
        setSampleSpacing(value) {
            this.sampleSpacing = Math.max(1, Math.min(10, value));
            this.recalculateBufferSize();
        }
        setScrollSpeed(value) {
            this.scrollSpeed = Math.max(5, Math.min(200, value));
        }
        setSmoothing(value) {
            this.smoothing = Math.max(0.1, Math.min(1.0, value));
        }
        getSampleSpacing() { return this.sampleSpacing; }
        getScrollSpeed() { return this.scrollSpeed; }
        getSmoothing() { return this.smoothing; }
        resize(width, height) {
            this.logicalWidth = width;
            this.logicalHeight = height;
            this.installCanvasSizing(width, height);
            this.recalculateBufferSize();
        }
        resetBuffer() {
            this.smoothedValue = this.initialValue;
            this.dataBuffer.length = 0;
        }
        valueToY(value, height) {
            const padding = height * this.verticalPaddingRatio;
            const usableHeight = height - padding * 2;
            return height - (value * usableHeight + padding);
        }
        installCanvasSizing(width, height) {
            const dpr = this.devicePixelRatio;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        display: block;
        flex: 1;
        border: 1px solid #999;
        box-sizing: border-box;
      `;
            if (typeof this.ctx.resetTransform === 'function') {
                this.ctx.resetTransform();
            }
            else {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            this.ctx.scale(dpr, dpr);
        }
        recalculateBufferSize() {
            this.maxBufferSize = Math.ceil(this.logicalWidth / this.sampleSpacing) + 10;
            while (this.dataBuffer.length > this.maxBufferSize) {
                this.dataBuffer.shift();
            }
        }
        getStrokeColor(_value) {
            return this.strokeStyle;
        }
    }
    Jamble.LineGraphPanel = LineGraphPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class HeartRatePanel extends Jamble.LineGraphPanel {
        constructor(parent, width, height, options = {}) {
            var _a, _b;
            super(parent, width, height, options);
            this.time = 0;
            this.frequency = (_a = options.frequency) !== null && _a !== void 0 ? _a : 0.5;
            this.amplitude = (_b = options.amplitude) !== null && _b !== void 0 ? _b : 0.3;
        }
        generateSample(sampleIntervalSeconds) {
            this.time += this.frequency * sampleIntervalSeconds;
            const normalized = Math.sin(this.time * Math.PI * 2) * this.amplitude + 0.5;
            return Math.max(0, Math.min(1, normalized));
        }
        getFrequency() { return this.frequency; }
        getAmplitude() { return this.amplitude; }
        setFrequency(value) {
            this.frequency = Math.max(0.05, Math.min(5, value));
        }
        setAmplitude(value) {
            this.amplitude = Math.max(0.05, Math.min(0.45, value));
        }
    }
    Jamble.HeartRatePanel = HeartRatePanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class SensationPanel extends Jamble.LineGraphPanel {
        constructor(parent, width, height, options = {}) {
            var _a, _b, _c;
            super(parent, width, height, {
                ...options,
                initialValue: (_a = options.initialValue) !== null && _a !== void 0 ? _a : 0.2,
                strokeStyle: (_b = options.strokeStyle) !== null && _b !== void 0 ? _b : '#59a869'
            });
            this.zoneCount = 6;
            this.intensityMin = -1;
            this.intensityMax = 6;
            this.baseHue = 335;
            this.baseSaturation = 95.2;
            this.baselineLightness = 96.0;
            this.peakLightness = 52.1;
            this.highLightness = 12.0;
            this.npc = null;
            this.debugMode = true;
            this.currentValue = (_c = options.initialValue) !== null && _c !== void 0 ? _c : 0.2;
            this.zoneColors = this.buildZoneColors();
        }
        setValue(value) {
            this.currentValue = Math.max(0, Math.min(1, value));
        }
        getValue() {
            return this.currentValue;
        }
        setNPC(npc) {
            this.npc = npc;
        }
        setDebugMode(enabled) {
            this.debugMode = enabled;
        }
        getDebugMode() {
            return this.debugMode;
        }
        generateSample(_sampleIntervalSeconds) {
            return this.currentValue;
        }
        getStrokeColor(value) {
            const index = Math.min(this.zoneCount - 1, Math.max(0, Math.floor(value * this.zoneCount)));
            return this.zoneColors[index];
        }
        render() {
            super.render();
            if (this.debugMode && this.npc) {
                this.renderDebugOverlay();
            }
        }
        renderDebugOverlay() {
            if (!this.npc)
                return;
            const painThreshold = this.npc.getPainThreshold();
            const arousalRange = this.npc.getArousalRange();
            const normalizedPainThreshold = this.mapArousalToNormalized(painThreshold, arousalRange);
            const y = this.computeYFromNormalized(normalizedPainThreshold);
            const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
            this.ctx.save();
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(canvasWidth, y);
            this.ctx.stroke();
            this.ctx.restore();
            this.drawPainThresholdLabel(y);
        }
        mapArousalToNormalized(arousalValue, range) {
            const clamped = Math.max(range.min, Math.min(range.max, arousalValue));
            return (clamped - range.min) / (range.max - range.min);
        }
        computeYFromNormalized(value) {
            const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
            const padding = canvasHeight * 0.1;
            const usableHeight = canvasHeight - padding * 2;
            return canvasHeight - (value * usableHeight + padding);
        }
        drawPainThresholdLabel(y) {
            const labelColor = '#ff6b35';
            const label = 'Pain Threshold';
            const offsetX = 6;
            const offsetY = 6;
            this.ctx.save();
            this.ctx.fillStyle = labelColor;
            this.ctx.font = '8px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
            this.ctx.fillText(label, offsetX, y - offsetY);
            this.ctx.restore();
        }
        buildZoneColors() {
            const colors = [];
            for (let i = 0; i < this.zoneCount; i++) {
                const centerNormalized = (i + 0.5) / this.zoneCount;
                const intensity = this.mapNormalizedToIntensity(centerNormalized);
                colors.push(this.colorForIntensity(intensity));
            }
            return colors;
        }
        mapNormalizedToIntensity(normalized) {
            const clamped = Math.max(0, Math.min(1, normalized));
            return this.intensityMin + (this.intensityMax - this.intensityMin) * clamped;
        }
        colorForIntensity(intensity) {
            const lightness = this.lightnessForIntensity(intensity);
            return `hsl(${this.baseHue}, ${this.baseSaturation}%, ${lightness.toFixed(2)}%)`;
        }
        lightnessForIntensity(intensity) {
            if (intensity <= 3) {
                const t = this.clamp01(this.normalizeRange(intensity, this.intensityMin, 3));
                return this.lerp(this.baselineLightness, this.peakLightness, this.smoothstep(t));
            }
            const t = this.clamp01(this.normalizeRange(intensity, 3, this.intensityMax));
            return this.lerp(this.peakLightness, this.highLightness, this.smoothstep(t));
        }
        normalizeRange(value, min, max) {
            if (max === min)
                return 0;
            return (value - min) / (max - min);
        }
        smoothstep(t) {
            return t * t * (3 - 2 * t);
        }
        lerp(a, b, t) {
            return a + (b - a) * t;
        }
        clamp01(value) {
            return Math.max(0, Math.min(1, value));
        }
    }
    Jamble.SensationPanel = SensationPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class MonitorPanel {
        constructor(parent, width, height) {
            this.width = width;
            this.height = height;
            this.container = document.createElement('div');
            this.container.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        flex: 1;
        display: flex;
        flex-direction: row;
        justify-content: stretch;
        align-items: stretch;
        gap: 2px;
        pointer-events: none;
      `;
            parent.appendChild(this.container);
            const halfWidth = Math.floor(width / 2);
            const secondWidth = width - halfWidth;
            this.heartRatePanel = new Jamble.HeartRatePanel(this.container, halfWidth, height, {
                strokeStyle: '#757575'
            });
            this.sensationPanel = new Jamble.SensationPanel(this.container, secondWidth, height, {
                strokeStyle: '#59a869',
                initialValue: 0.2
            });
        }
        update(deltaTime) {
            this.heartRatePanel.update(deltaTime);
            this.sensationPanel.update(deltaTime);
        }
        render() {
            this.heartRatePanel.render();
            this.sensationPanel.render();
        }
        pushData(value) {
            this.heartRatePanel.pushData(value);
        }
        setSensationValue(value) {
            this.sensationPanel.setValue(value);
        }
        getSensationValue() {
            return this.sensationPanel.getValue();
        }
        setSensationNPC(npc) {
            this.sensationPanel.setNPC(npc);
        }
        setSensationDebugMode(enabled) {
            this.sensationPanel.setDebugMode(enabled);
        }
        getSensationDebugMode() {
            return this.sensationPanel.getDebugMode();
        }
        getSampleSpacing() {
            return this.heartRatePanel.getSampleSpacing();
        }
        getScrollSpeed() {
            return this.heartRatePanel.getScrollSpeed();
        }
        getFrequency() {
            return this.heartRatePanel.getFrequency();
        }
        getAmplitude() {
            return this.heartRatePanel.getAmplitude();
        }
        getSmoothing() {
            return this.heartRatePanel.getSmoothing();
        }
        setSampleSpacing(value) {
            this.heartRatePanel.setSampleSpacing(value);
            this.sensationPanel.setSampleSpacing(value);
        }
        setScrollSpeed(value) {
            this.heartRatePanel.setScrollSpeed(value);
            this.sensationPanel.setScrollSpeed(value);
        }
        setFrequency(value) {
            this.heartRatePanel.setFrequency(value);
        }
        setAmplitude(value) {
            this.heartRatePanel.setAmplitude(value);
        }
        setSmoothing(value) {
            this.heartRatePanel.setSmoothing(value);
            this.sensationPanel.setSmoothing(value);
        }
        setDimmed(dimmed) {
            this.container.style.opacity = dimmed ? '0.5' : '1';
            this.container.style.pointerEvents = dimmed ? 'none' : 'auto';
        }
    }
    Jamble.MonitorPanel = MonitorPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class CrescendoPanel {
        constructor(parent, width, height) {
            this.currentValue = 0.1;
            this.pulsePhase = 0;
            this.wavePhase = 0;
            this.waveSpeed = 15;
            this.waveFrequency = 0.9;
            this.waveAmplitude = 0.5;
            this.width = width;
            this.height = height;
            this.container = document.createElement('div');
            this.container.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: #fff;
        border: 1px solid #999;
        border-right: none;
        box-sizing: border-box;
        position: relative;
        overflow: visible;
      `;
            const heartSize = Math.round(width * 1.5);
            this.heartCanvas = document.createElement('canvas');
            this.heartCanvas.width = heartSize;
            this.heartCanvas.height = heartSize;
            this.heartCanvas.style.cssText = `
        position: absolute;
        top: -${heartSize * 1.1}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${heartSize}px;
        height: ${heartSize}px;
        pointer-events: none;
      `;
            const dpr = window.devicePixelRatio || 1;
            this.heartCanvas.width = heartSize * dpr;
            this.heartCanvas.height = heartSize * dpr;
            this.heartCtx = this.heartCanvas.getContext('2d');
            this.heartCtx.scale(dpr, dpr);
            this.fillCanvas = document.createElement('canvas');
            this.fillCanvas.width = width;
            this.fillCanvas.height = height;
            this.fillCanvas.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: ${width}px;
        height: ${height}px;
        pointer-events: none;
      `;
            const fillDpr = window.devicePixelRatio || 1;
            this.fillCanvas.width = width * fillDpr;
            this.fillCanvas.height = height * fillDpr;
            this.fillCtx = this.fillCanvas.getContext('2d');
            this.fillCtx.scale(fillDpr, fillDpr);
            this.container.appendChild(this.fillCanvas);
            this.container.appendChild(this.heartCanvas);
            parent.appendChild(this.container);
        }
        setValue(value) {
            this.currentValue = Math.max(0, Math.min(1, value));
            this.updateDisplay();
        }
        getValue() {
            return this.currentValue;
        }
        update(deltaTime) {
            this.wavePhase += deltaTime * this.waveSpeed;
            const wavelength = this.width / this.waveFrequency;
            if (this.wavePhase > wavelength) {
                this.wavePhase -= wavelength;
            }
        }
        render() {
            const fillWidth = this.fillCanvas.width / (window.devicePixelRatio || 1);
            const fillHeight = this.fillCanvas.height / (window.devicePixelRatio || 1);
            this.fillCtx.clearRect(0, 0, fillWidth, fillHeight);
            if (this.currentValue <= 0)
                return;
            const displayValue = Math.max(0.1, this.currentValue);
            const targetHeight = fillHeight * displayValue;
            const gradient = this.fillCtx.createLinearGradient(0, fillHeight, 0, fillHeight - targetHeight);
            if (this.currentValue >= 1.0) {
                gradient.addColorStop(0, 'hsl(350, 90%, 55%)');
                gradient.addColorStop(0.5, 'hsl(350, 90%, 65%)');
                gradient.addColorStop(1, 'hsl(350, 90%, 75%)');
            }
            else {
                gradient.addColorStop(0, 'hsl(350, 80%, 50%)');
                gradient.addColorStop(0.5, 'hsl(350, 80%, 60%)');
                gradient.addColorStop(1, 'hsl(350, 80%, 70%)');
            }
            this.fillCtx.save();
            this.fillCtx.beginPath();
            this.fillCtx.moveTo(0, fillHeight);
            this.fillCtx.lineTo(0, fillHeight - targetHeight + this.waveAmplitude);
            const wavePoints = Math.ceil(fillWidth) + 1;
            for (let x = 0; x <= wavePoints; x++) {
                const xPos = x;
                const phase = ((x + this.wavePhase) / fillWidth) * Math.PI * 2 * this.waveFrequency;
                const yOffset = Math.sin(phase) * this.waveAmplitude;
                const yPos = fillHeight - targetHeight + yOffset;
                this.fillCtx.lineTo(xPos, yPos);
            }
            this.fillCtx.lineTo(fillWidth, fillHeight);
            this.fillCtx.closePath();
            this.fillCtx.clip();
            this.fillCtx.fillStyle = gradient;
            this.fillCtx.fillRect(0, 0, fillWidth, fillHeight);
            this.fillCtx.restore();
        }
        updateDisplay() {
        }
        resize(width, height) {
            this.width = width;
            this.height = height;
            this.container.style.width = `${width}px`;
            this.container.style.height = `${height}px`;
            const heartSize = Math.round(width * 1.0);
            const dpr = window.devicePixelRatio || 1;
            this.heartCanvas.width = heartSize * dpr;
            this.heartCanvas.height = heartSize * dpr;
            this.heartCanvas.style.width = `${heartSize}px`;
            this.heartCanvas.style.height = `${heartSize}px`;
            this.heartCanvas.style.top = `-${heartSize * 1.1}px`;
            this.heartCtx.scale(dpr, dpr);
            this.fillCanvas.width = width * dpr;
            this.fillCanvas.height = height * dpr;
            this.fillCanvas.style.width = `${width}px`;
            this.fillCanvas.style.height = `${height}px`;
            this.fillCtx.scale(dpr, dpr);
        }
        getWaveSpeed() { return this.waveSpeed; }
        setWaveSpeed(value) { this.waveSpeed = value; }
        getWaveFrequency() { return this.waveFrequency; }
        setWaveFrequency(value) { this.waveFrequency = value; }
        getWaveAmplitude() { return this.waveAmplitude; }
        setWaveAmplitude(value) { this.waveAmplitude = value; }
        destroy() {
            if (this.container.parentElement) {
                this.container.parentElement.removeChild(this.container);
            }
        }
        setDimmed(dimmed) {
            this.container.style.opacity = dimmed ? '0.5' : '1';
            this.container.style.pointerEvents = dimmed ? 'none' : 'auto';
        }
    }
    Jamble.CrescendoPanel = CrescendoPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class ControlModule {
        constructor(config) {
            this.config = config;
            this.element = this.createElement();
            this.setupResetListener();
            this.setupEditorModeListener();
        }
        update(_deltaTime) {
        }
        render() {
        }
        setupResetListener() {
            window.addEventListener('jamble:reset', () => {
                this.resetState();
            });
        }
        setupEditorModeListener() {
            window.addEventListener('jamble:editor-mode-change', ((e) => {
                const mode = e.detail.mode;
                const isActiveEditor = this.shouldStayActiveInEditorMode(mode);
                if (mode === 'none') {
                    this.element.style.opacity = '1';
                    this.element.style.pointerEvents = 'auto';
                }
                else {
                    this.element.style.opacity = isActiveEditor ? '1' : '0.5';
                    this.element.style.pointerEvents = isActiveEditor ? 'auto' : 'none';
                }
            }));
        }
        shouldStayActiveInEditorMode(mode) {
            return false;
        }
        getElement() {
            return this.element;
        }
        getGridSize() {
            return this.config.gridSize;
        }
        getId() {
            return this.config.id;
        }
        applyGridSizeClass(element) {
            const { width, height } = this.config.gridSize;
            element.classList.add(`module-${width}x${height}`);
        }
        createBaseElement() {
            const element = document.createElement('div');
            element.className = 'control-module';
            element.dataset.moduleId = this.config.id;
            this.applyGridSizeClass(element);
            return element;
        }
    }
    Jamble.ControlModule = ControlModule;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class HeartModule extends Jamble.ControlModule {
        constructor(config) {
            super(config);
            this.isDisabled = false;
        }
        createElement() {
            this.usesRemaining = HeartModule.MAX_USES;
            const element = this.createBaseElement();
            this.button = document.createElement('button');
            this.button.className = 'module-button';
            this.button.textContent = '❤️';
            this.usesDisplay = document.createElement('div');
            this.usesDisplay.className = 'module-uses';
            this.updateUsesDisplay();
            this.button.appendChild(this.usesDisplay);
            element.appendChild(this.button);
            this.setupInteraction();
            return element;
        }
        setupInteraction() {
            this.button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.handlePress();
                this.handleClick();
            });
            this.button.addEventListener('pointerup', () => this.handleRelease());
            this.button.addEventListener('pointerleave', () => this.handleRelease());
        }
        handlePress() {
            if (this.usesRemaining > 0) {
                this.button.classList.add('pressed');
            }
        }
        handleRelease() {
            this.button.classList.remove('pressed');
        }
        handleClick() {
            if (this.isDisabled || this.usesRemaining <= 0) {
                return;
            }
            this.usesRemaining--;
            this.updateUsesDisplay();
            if (this.usesRemaining === 0) {
                this.button.classList.add('depleted');
            }
            window.dispatchEvent(new CustomEvent('jamble:heart-used'));
        }
        updateUsesDisplay() {
            this.usesDisplay.textContent = `${this.usesRemaining}`;
        }
        enable() {
            this.isDisabled = false;
            this.button.classList.remove('depleted');
            this.updateButtonState();
        }
        disable() {
            this.isDisabled = true;
            this.button.classList.add('depleted');
        }
        updateButtonState() {
            if (this.usesRemaining === 0) {
                this.button.classList.add('depleted');
            }
        }
        resetState() {
            this.usesRemaining = HeartModule.MAX_USES;
            this.updateUsesDisplay();
            this.isDisabled = false;
            this.button.classList.remove('depleted');
        }
    }
    HeartModule.MAX_USES = 3;
    Jamble.HeartModule = HeartModule;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class TreeModule extends Jamble.ControlModule {
        constructor(config) {
            super(config);
        }
        createElement() {
            this.usesRemaining = TreeModule.MAX_USES;
            const element = this.createBaseElement();
            this.button = document.createElement('button');
            this.button.className = 'module-button';
            this.button.textContent = '🌲';
            this.usesDisplay = document.createElement('div');
            this.usesDisplay.className = 'module-uses';
            this.updateUsesDisplay();
            this.button.appendChild(this.usesDisplay);
            element.appendChild(this.button);
            this.setupInteraction();
            return element;
        }
        setupInteraction() {
            this.button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.handlePress();
                this.handleClick();
            });
            this.button.addEventListener('pointerup', () => this.handleRelease());
            this.button.addEventListener('pointerleave', () => this.handleRelease());
        }
        handlePress() {
            if (this.usesRemaining > 0) {
                this.button.classList.add('pressed');
            }
        }
        handleRelease() {
            this.button.classList.remove('pressed');
        }
        handleClick() {
            window.dispatchEvent(new CustomEvent('jamble:tree-module-clicked'));
        }
        useTree() {
            if (this.usesRemaining > 0) {
                this.usesRemaining--;
                this.updateUsesDisplay();
                return true;
            }
            return false;
        }
        returnTree() {
            if (this.usesRemaining < TreeModule.MAX_USES) {
                this.usesRemaining++;
                this.updateUsesDisplay();
            }
        }
        getUsesRemaining() {
            return this.usesRemaining;
        }
        updateUsesDisplay() {
            this.usesDisplay.textContent = `${this.usesRemaining}`;
        }
        resetState() {
            this.usesRemaining = TreeModule.MAX_USES;
            this.updateUsesDisplay();
        }
        shouldStayActiveInEditorMode(mode) {
            return mode === 'tree-placement';
        }
        setEditMode(active) {
        }
    }
    TreeModule.MAX_USES = 2;
    Jamble.TreeModule = TreeModule;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class SoftnessModule extends Jamble.ControlModule {
        constructor(config) {
            super(config);
            this.player = null;
        }
        setPlayer(player) {
            this.player = player;
            if (this.player) {
                this.player.setSoftness(this.value);
            }
        }
        createElement() {
            this.value = SoftnessModule.DEFAULT_VALUE;
            const element = this.createBaseElement();
            element.classList.add('module-slider');
            this.label = document.createElement('div');
            this.label.className = 'module-label';
            this.label.textContent = 'SOFT';
            this.slider = document.createElement('input');
            this.slider.type = 'range';
            this.slider.className = 'module-slider-input';
            this.slider.min = '0';
            this.slider.max = '100';
            this.slider.value = String(this.value * 100);
            this.valueDisplay = document.createElement('div');
            this.valueDisplay.className = 'module-value';
            this.updateValueDisplay();
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';
            sliderContainer.appendChild(this.slider);
            sliderContainer.appendChild(this.valueDisplay);
            element.appendChild(this.label);
            element.appendChild(sliderContainer);
            this.setupInteraction();
            return element;
        }
        setupInteraction() {
            this.slider.addEventListener('input', () => this.handleInput());
        }
        handleInput() {
            this.value = parseInt(this.slider.value) / 100;
            this.updateValueDisplay();
            if (this.player) {
                this.player.setSoftness(this.value);
            }
        }
        updateValueDisplay() {
            this.valueDisplay.textContent = this.value.toFixed(2);
        }
        resetState() {
            this.value = SoftnessModule.DEFAULT_VALUE;
            this.slider.value = String(this.value * 100);
            this.updateValueDisplay();
            if (this.player) {
                this.player.setSoftness(this.value);
            }
        }
        getValue() {
            return this.value;
        }
    }
    SoftnessModule.DEFAULT_VALUE = 0.5;
    Jamble.SoftnessModule = SoftnessModule;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class TemperatureModule extends Jamble.ControlModule {
        constructor(config) {
            super(config);
            this.player = null;
        }
        setPlayer(player) {
            this.player = player;
            if (this.player) {
                this.player.setTemperature(this.value);
            }
        }
        createElement() {
            this.value = TemperatureModule.DEFAULT_VALUE;
            const element = this.createBaseElement();
            element.classList.add('module-slider');
            this.label = document.createElement('div');
            this.label.className = 'module-label';
            this.label.textContent = 'TEMP';
            this.slider = document.createElement('input');
            this.slider.type = 'range';
            this.slider.className = 'module-slider-input';
            this.slider.min = '0';
            this.slider.max = '100';
            this.slider.value = String(this.value * 100);
            this.valueDisplay = document.createElement('div');
            this.valueDisplay.className = 'module-value';
            this.updateValueDisplay();
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';
            sliderContainer.appendChild(this.slider);
            sliderContainer.appendChild(this.valueDisplay);
            element.appendChild(this.label);
            element.appendChild(sliderContainer);
            this.setupInteraction();
            return element;
        }
        setupInteraction() {
            this.slider.addEventListener('input', () => this.handleInput());
        }
        handleInput() {
            this.value = parseInt(this.slider.value) / 100;
            this.updateValueDisplay();
            if (this.player) {
                this.player.setTemperature(this.value);
            }
        }
        updateValueDisplay() {
            this.valueDisplay.textContent = this.value.toFixed(2);
        }
        resetState() {
            this.value = TemperatureModule.DEFAULT_VALUE;
            this.slider.value = String(this.value * 100);
            this.updateValueDisplay();
            if (this.player) {
                this.player.setTemperature(this.value);
            }
        }
        getValue() {
            return this.value;
        }
    }
    TemperatureModule.DEFAULT_VALUE = 0.5;
    Jamble.TemperatureModule = TemperatureModule;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class ControlPanel extends Jamble.UIComponent {
        constructor(parentContainer) {
            super(parentContainer, { mountNode: parentContainer, autoReposition: false });
            this.modules = new Map();
            this.setupStyles();
            this.createModules();
            this.show();
        }
        createContainer() {
            const container = document.createElement('div');
            container.id = 'control-panel';
            container.className = 'control-panel';
            container.style.position = 'relative';
            return container;
        }
        calculatePosition(_gameRect) {
            return { left: 0, top: 0 };
        }
        show() {
            if (this.isVisible)
                return;
            this.isVisible = true;
            if (!this.container.parentNode) {
                this.mountNode.appendChild(this.container);
            }
        }
        setupStyles() {
            const style = document.createElement('style');
            style.textContent = `
        .control-panel {
          position: relative;
          display: none;
          grid-template-columns: repeat(4, 50px);
          grid-template-rows: repeat(2, 50px);
          gap: 12px;
          width: max-content;
          margin: 16px auto 0;
          padding: 8px;
          background: #fff;
          box-sizing: border-box;
          justify-self: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .control-panel.visible {
          display: grid;
          opacity: 1;
        }

        /* Base module styles */
        .control-module {
          background: #fff;
          border: 2px dashed #2196f3;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          user-select: none;
        }

        /* Grid size classes */
        .module-1x1 { 
          grid-column: span 1; 
          grid-row: span 1; 
        }
        
        .module-3x1 { 
          grid-column: span 3; 
          grid-row: span 1; 
        }
        
        .module-2x2 { 
          grid-column: span 2; 
          grid-row: span 2; 
        }

        /* Button module styles */
        .module-button {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          transition: transform 0.1s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .module-button:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .module-button.pressed {
          transform: scale(0.95);
          background: rgba(0, 0, 0, 0.12);
        }

        .module-button.depleted {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .module-button.depleted:hover {
          background: transparent;
          transform: none;
        }

        /* Fade module border when button is depleted */
        .control-module:has(.module-button.depleted) {
          opacity: 0.3;
        }

        .module-uses {
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 10px;
          font-weight: bold;
          color: #333;
          background: rgba(255, 255, 255, 0.9);
          border: 1px dashed #2196f3;
          padding: 2px 4px;
          min-width: 12px;
          text-align: center;
        }

        /* Slider module styles */
        .module-slider {
          padding: 8px;
          gap: 4px;
          border: 1px solid #ccc; /* Override blue dotted border with old border */
        }

        .module-label {
          font-size: 10px;
          font-weight: bold;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slider-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }

        .module-slider-input {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #2196f3;
          outline: none;
          border-radius: 2px;
        }

        .module-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #2196f3;
          cursor: pointer;
          border-radius: 50%;
        }

        .module-slider-input::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #2196f3;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }

        .module-value {
          font-size: 9px;
          color: #333;
          font-family: monospace;
        }
      `;
            document.head.appendChild(style);
        }
        createModules() {
            const softness = new Jamble.SoftnessModule({
                id: 'softness',
                gridSize: { width: 3, height: 1 }
            });
            const heart = new Jamble.HeartModule({
                id: 'heart',
                gridSize: { width: 1, height: 1 }
            });
            const temperature = new Jamble.TemperatureModule({
                id: 'temperature',
                gridSize: { width: 3, height: 1 }
            });
            const tree = new Jamble.TreeModule({
                id: 'tree',
                gridSize: { width: 1, height: 1 }
            });
            [softness, heart, temperature, tree].forEach(module => {
                this.modules.set(module.getId(), module);
                this.container.appendChild(module.getElement());
            });
        }
        render() {
            this.modules.forEach(module => module.render());
        }
        update(deltaTime) {
            super.update(deltaTime);
            this.modules.forEach(module => module.update(deltaTime));
        }
        showPanel() {
            requestAnimationFrame(() => {
                this.container.classList.add('visible');
            });
        }
        hidePanel() {
            this.container.classList.remove('visible');
        }
        setStateManager(stateManager) {
            this.stateManager = stateManager;
        }
        setPlayer(player) {
            const softnessModule = this.modules.get('softness');
            const temperatureModule = this.modules.get('temperature');
            if (softnessModule) {
                softnessModule.setPlayer(player);
            }
            if (temperatureModule) {
                temperatureModule.setPlayer(player);
            }
        }
        onHeartUsed(callback) {
            window.addEventListener('jamble:heart-used', () => callback());
        }
        updateVisibility() {
            if (!this.stateManager)
                return;
            const state = this.stateManager.getCurrentState();
            if (state === 'idle') {
                this.showPanel();
            }
            else {
                this.hidePanel();
            }
        }
        getModule(id) {
            return this.modules.get(id);
        }
        resetAllModules() {
            window.dispatchEvent(new CustomEvent('jamble:reset'));
        }
        enableHeart() {
            const heartModule = this.modules.get('heart');
            if (heartModule) {
                heartModule.enable();
            }
        }
        disableHeart() {
            const heartModule = this.modules.get('heart');
            if (heartModule) {
                heartModule.disable();
            }
        }
    }
    Jamble.ControlPanel = ControlPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class JumpInstructionPanel extends Jamble.UIComponent {
        constructor(parentContainer) {
            super(parentContainer, { mountNode: parentContainer, autoReposition: false });
            this.onJumpCallback = null;
            this.setupStyles();
            this.setupClickHandler();
            this.mountNode.appendChild(this.container);
        }
        setupClickHandler() {
            this.container.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.onJumpCallback && this.isVisible) {
                    this.onJumpCallback();
                }
            });
        }
        setOnJump(callback) {
            this.onJumpCallback = callback;
        }
        createContainer() {
            const container = document.createElement('div');
            container.id = 'jump-instruction-panel';
            container.className = 'jump-instruction-panel';
            container.style.position = 'relative';
            container.textContent = 'TAP OR SPACE TO JUMP';
            return container;
        }
        calculatePosition(_gameRect) {
            return { left: 0, top: 0 };
        }
        show() {
            if (this.isVisible)
                return;
            this.isVisible = true;
            requestAnimationFrame(() => {
                this.container.classList.add('visible');
            });
        }
        hide() {
            if (!this.isVisible)
                return;
            this.isVisible = false;
            this.container.classList.remove('visible');
        }
        setupStyles() {
            const style = document.createElement('style');
            style.textContent = `
        .jump-instruction-panel {
          position: relative;
          display: none;
          align-items: center;
          justify-content: center;
          width: 252px;
          height: 128px;
          margin: 16px auto 0;
          padding: 8px;
          background: #fff;
          border: 2px dashed #2196f3;
          box-sizing: border-box;
          font-size: 16px;
          font-weight: bold;
          color: #2196f3;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0;
          transition: opacity 0.2s ease;
          cursor: pointer;
          user-select: none;
        }

        .jump-instruction-panel.visible {
          display: flex;
          opacity: 1;
        }
      `;
            document.head.appendChild(style);
        }
        setStateManager(stateManager) {
            this.stateManager = stateManager;
        }
        updateVisibility() {
            if (!this.stateManager)
                return;
            const shouldBeVisible = this.stateManager.isRunning();
            if (shouldBeVisible && !this.isVisible) {
                this.show();
            }
            else if (!shouldBeVisible && this.isVisible) {
                this.hide();
            }
        }
        render() {
        }
    }
    Jamble.JumpInstructionPanel = JumpInstructionPanel;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class HUDManager extends Jamble.UIComponent {
        constructor(gameElement, gameWidth, gameHeight) {
            const shell = gameElement.classList.contains('game-shell')
                ? gameElement
                : gameElement.querySelector('.game-shell') || gameElement;
            super(shell, { mountNode: shell, autoReposition: false });
            this.portraitSize = 80;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.createHUDComponents();
            this.createPanelWrapper();
            this.createControlPanel();
            this.createJumpInstructionPanel();
            this.setupEditorModeListener();
            this.show();
        }
        createContainer() {
            const container = document.createElement('div');
            container.id = 'hud-overlay';
            container.style.cssText = `
        position: relative;
        width: 100%;
        height: ${this.portraitSize}px;
        display: flex;
        align-items: stretch;
        gap: 0;
        pointer-events: none;
      `;
            return container;
        }
        calculatePosition(_gameRect) {
            return { left: 0, top: 0 };
        }
        show() {
            if (this.isVisible)
                return;
            this.isVisible = true;
            this.container.style.display = 'flex';
            const mount = this.mountNode;
            if (mount.firstChild) {
                mount.insertBefore(this.container, mount.firstChild);
            }
            else {
                mount.appendChild(this.container);
            }
        }
        createHUDComponents() {
            const crescendoPanelWidth = Math.floor(this.portraitSize / 5);
            const portraitTotalWidth = this.portraitSize + 2;
            const portraitGroupWidth = portraitTotalWidth + crescendoPanelWidth;
            const monitorWidth = this.gameWidth - portraitGroupWidth;
            this.monitorPanel = new Jamble.MonitorPanel(this.container, monitorWidth, this.portraitSize);
            const portraitGroup = document.createElement('div');
            portraitGroup.className = 'portrait-group';
            portraitGroup.style.cssText = `
        width: ${portraitGroupWidth}px;
        height: ${this.portraitSize}px;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0;
        flex-shrink: 0;
        pointer-events: none;
      `;
            this.container.appendChild(portraitGroup);
            this.crescendoPanel = new Jamble.CrescendoPanel(portraitGroup, crescendoPanelWidth, this.portraitSize);
            this.portraitPanel = new Jamble.PortraitPanel(portraitGroup, this.portraitSize);
        }
        createPanelWrapper() {
            const root = this.gameElement.parentElement || this.gameElement;
            this.panelWrapper = document.createElement('div');
            this.panelWrapper.style.cssText = `
        position: relative;
        width: 100%;
        height: 144px;
        margin-top: 35px;
        padding: 0;
      `;
            root.appendChild(this.panelWrapper);
        }
        createControlPanel() {
            this.controlPanel = new Jamble.ControlPanel(this.panelWrapper);
        }
        createJumpInstructionPanel() {
            this.jumpInstructionPanel = new Jamble.JumpInstructionPanel(this.panelWrapper);
        }
        setupEditorModeListener() {
            window.addEventListener('jamble:editor-mode-change', ((e) => {
                const dimmed = e.detail.mode !== 'none';
                this.portraitPanel.setDimmed(dimmed);
                this.monitorPanel.setDimmed(dimmed);
                this.crescendoPanel.setDimmed(dimmed);
            }));
        }
        setScale(scale) {
            this.container.style.transform = `scale(${scale})`;
            this.container.style.transformOrigin = 'top left';
            const scaledHeight = this.portraitSize * scale;
            this.container.style.marginBottom = `${scaledHeight - this.portraitSize}px`;
        }
        update(deltaTime) {
            super.update(deltaTime);
            if (this.isVisible) {
                this.portraitPanel.update(deltaTime);
                this.monitorPanel.update(deltaTime);
                this.crescendoPanel.update(deltaTime);
            }
            this.controlPanel.update(deltaTime);
        }
        render() {
            if (this.isVisible) {
                this.portraitPanel.render();
                this.monitorPanel.render();
                this.crescendoPanel.render();
            }
            this.controlPanel.render();
        }
        pushActivityData(value) {
            this.monitorPanel.pushData(value);
        }
        setPortraitExpression(expression) {
            this.portraitPanel.setExpression(expression);
        }
        setNPC(npc) {
            this.portraitPanel.setNPC(npc);
        }
        getPortraitSize() {
            return this.portraitSize;
        }
        setPortraitSize(size) {
            if (size !== this.portraitSize) {
                this.portraitSize = Math.max(40, Math.min(120, size));
                this.recreateHUD();
            }
        }
        getActivityParameters() {
            return {
                sampleSpacing: this.monitorPanel.getSampleSpacing(),
                scrollSpeed: this.monitorPanel.getScrollSpeed(),
                frequency: this.monitorPanel.getFrequency(),
                amplitude: this.monitorPanel.getAmplitude(),
                smoothing: this.monitorPanel.getSmoothing()
            };
        }
        setActivitySampleSpacing(value) {
            this.monitorPanel.setSampleSpacing(value);
        }
        setActivityScrollSpeed(value) {
            this.monitorPanel.setScrollSpeed(value);
        }
        setActivityFrequency(value) {
            this.monitorPanel.setFrequency(value);
        }
        setActivityAmplitude(value) {
            this.monitorPanel.setAmplitude(value);
        }
        setActivitySmoothing(value) {
            this.monitorPanel.setSmoothing(value);
        }
        setSensationValue(value) {
            this.monitorPanel.setSensationValue(value);
        }
        getSensationValue() {
            return this.monitorPanel.getSensationValue();
        }
        setCrescendoValue(value) {
            this.crescendoPanel.setValue(value);
        }
        getCrescendoValue() {
            return this.crescendoPanel.getValue();
        }
        setSensationNPC(npc) {
            this.monitorPanel.setSensationNPC(npc);
        }
        setSensationDebugMode(enabled) {
            this.monitorPanel.setSensationDebugMode(enabled);
        }
        getSensationDebugMode() {
            return this.monitorPanel.getSensationDebugMode();
        }
        showPortraitPain() {
            this.portraitPanel.showPainFeedback();
        }
        setStateManager(stateManager) {
            this.controlPanel.setStateManager(stateManager);
        }
        updateControlPanel() {
            this.controlPanel.updateVisibility();
        }
        getControlPanel() {
            return this.controlPanel;
        }
        getJumpInstructionPanel() {
            return this.jumpInstructionPanel;
        }
        recreateHUD() {
            if (this.container) {
                while (this.container.firstChild) {
                    this.container.removeChild(this.container.firstChild);
                }
            }
            this.container.style.height = `${this.portraitSize}px`;
            this.createHUDComponents();
        }
        getDebugSection() {
            return {
                title: 'HUD Controls',
                controls: [
                    {
                        type: 'checkbox',
                        label: 'Sensation Thresholds',
                        getValue: () => this.getSensationDebugMode(),
                        setValue: (value) => this.setSensationDebugMode(value)
                    },
                    {
                        type: 'slider',
                        label: 'Portrait Size',
                        min: 40,
                        max: 120,
                        step: 1,
                        getValue: () => this.portraitSize,
                        setValue: (value) => this.setPortraitSize(value)
                    },
                    {
                        type: 'slider',
                        label: 'Sample Spacing',
                        min: 1,
                        max: 10,
                        step: 1,
                        getValue: () => this.monitorPanel.getSampleSpacing(),
                        setValue: (value) => this.setActivitySampleSpacing(value)
                    },
                    {
                        type: 'slider',
                        label: 'Scroll Speed',
                        min: 5,
                        max: 200,
                        step: 5,
                        getValue: () => this.monitorPanel.getScrollSpeed(),
                        setValue: (value) => this.setActivityScrollSpeed(value)
                    },
                    {
                        type: 'slider',
                        label: 'Wave Freq',
                        min: 0.05,
                        max: 5,
                        step: 0.05,
                        getValue: () => this.monitorPanel.getFrequency(),
                        setValue: (value) => this.setActivityFrequency(value)
                    },
                    {
                        type: 'slider',
                        label: 'Wave Amp',
                        min: 0.05,
                        max: 0.45,
                        step: 0.05,
                        getValue: () => this.monitorPanel.getAmplitude(),
                        setValue: (value) => this.setActivityAmplitude(value)
                    },
                    {
                        type: 'slider',
                        label: 'Smoothing',
                        min: 0.1,
                        max: 1.0,
                        step: 0.05,
                        getValue: () => this.monitorPanel.getSmoothing(),
                        setValue: (value) => this.setActivitySmoothing(value)
                    },
                    {
                        type: 'slider',
                        label: 'Crescendo Speed',
                        min: 0,
                        max: 100,
                        step: 5,
                        getValue: () => this.crescendoPanel.getWaveSpeed(),
                        setValue: (value) => this.crescendoPanel.setWaveSpeed(value)
                    },
                    {
                        type: 'slider',
                        label: 'Crescendo Freq',
                        min: 0.1,
                        max: 2.0,
                        step: 0.1,
                        getValue: () => this.crescendoPanel.getWaveFrequency(),
                        setValue: (value) => this.crescendoPanel.setWaveFrequency(value)
                    },
                    {
                        type: 'slider',
                        label: 'Crescendo Amp',
                        min: 0,
                        max: 10,
                        step: 0.5,
                        getValue: () => this.crescendoPanel.getWaveAmplitude(),
                        setValue: (value) => this.crescendoPanel.setWaveAmplitude(value)
                    }
                ]
            };
        }
        destroy() {
            super.destroy();
            if (this.controlPanel) {
                this.controlPanel.destroy();
            }
        }
    }
    Jamble.HUDManager = HUDManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Home extends Jamble.GameObject {
        constructor(id, x = 0, y = 0) {
            super(id, x, y);
            this.render = {
                type: 'canvas',
                visible: true,
                canvas: {
                    color: '#ffd54f',
                    shape: 'rectangle',
                    width: 60,
                    height: 20
                },
                anchor: { x: 0.5, y: 1 }
            };
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 60,
                height: 20,
                anchor: { x: 0.5, y: 1 },
                category: 'environment'
            };
        }
        update(deltaTime) {
        }
    }
    Jamble.Home = Home;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Sensor extends Jamble.GameObject {
        constructor(id, target, offsetX = 0, offsetY = 0) {
            const initX = target ? target.transform.x + offsetX : offsetX;
            const initY = target ? target.transform.y + offsetY : offsetY;
            super(id, initX, initY);
            this.enabled = true;
            this.target = target;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.render.visible = false;
            this.collisionBox = {
                x: 0,
                y: 0,
                width: 20,
                height: 5,
                anchor: { x: 0.5, y: 1 },
                category: 'kinematic'
            };
        }
        update(deltaTime) {
            if (this.target) {
                this.transform.x = this.target.transform.x + this.offsetX;
                this.transform.y = this.target.transform.y + this.offsetY;
            }
        }
        setTriggerSize(width, height) {
            if (this.collisionBox) {
                this.collisionBox.width = width;
                this.collisionBox.height = height;
            }
        }
        setEnabled(enabled) {
            this.enabled = enabled;
        }
        isEnabled() {
            return this.enabled;
        }
    }
    Jamble.Sensor = Sensor;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class LevelManager {
        constructor() {
            this.currentNPC = null;
            this.levelCompleteListeners = [];
            this.crescendoThresholdListener = null;
        }
        setActiveNPC(npc) {
            if (this.currentNPC && this.crescendoThresholdListener) {
                this.currentNPC.removeCrescendoThresholdListener(this.crescendoThresholdListener);
            }
            this.currentNPC = npc;
            this.crescendoThresholdListener = (npc) => {
                this.onCrescendoThresholdReached(npc);
            };
            this.currentNPC.onCrescendoThreshold(this.crescendoThresholdListener);
        }
        getCurrentNPC() {
            return this.currentNPC;
        }
        onLevelComplete(callback) {
            this.levelCompleteListeners.push(callback);
        }
        removeLevelCompleteListener(callback) {
            const index = this.levelCompleteListeners.indexOf(callback);
            if (index !== -1) {
                this.levelCompleteListeners.splice(index, 1);
            }
        }
        onCrescendoThresholdReached(npc) {
            console.log(`LevelManager: ${npc.getName()} completed level!`);
            this.notifyLevelComplete(npc);
        }
        notifyLevelComplete(npc) {
            for (const listener of this.levelCompleteListeners) {
                try {
                    listener(npc);
                }
                catch (error) {
                    console.error('Error in level complete listener:', error);
                }
            }
        }
        reset() {
            if (this.currentNPC && this.crescendoThresholdListener) {
                this.currentNPC.removeCrescendoThresholdListener(this.crescendoThresholdListener);
            }
            this.currentNPC = null;
            this.crescendoThresholdListener = null;
        }
        destroy() {
            this.reset();
            this.levelCompleteListeners = [];
        }
    }
    Jamble.LevelManager = LevelManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class TreePlacementOverlay {
        constructor(parent, slotManager, gameWidth, gameHeight) {
            this.overlayPadding = 40;
            this.isVisible = false;
            this.circleRadius = 33;
            this.availableColor = '#4CAF50';
            this.occupiedColor = '#FF9800';
            this.strokeColor = '#ff0000';
            this.strokeWidth = 3;
            this.occupiedSlotIds = new Set();
            this.slotManager = slotManager;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.backgroundCanvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            this.backgroundCanvas.width = gameWidth * dpr;
            this.backgroundCanvas.height = (gameHeight + this.overlayPadding) * dpr;
            this.backgroundCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(100% + ${this.overlayPadding}px);
        pointer-events: none;
        display: none;
        z-index: 2;
      `;
            this.backgroundCtx = this.backgroundCanvas.getContext('2d');
            this.backgroundCtx.scale(dpr, dpr);
            parent.appendChild(this.backgroundCanvas);
            this.canvas = document.createElement('canvas');
            this.canvas.width = gameWidth * dpr;
            this.canvas.height = (gameHeight + this.overlayPadding) * dpr;
            this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(100% + ${this.overlayPadding}px);
        pointer-events: auto;
        cursor: pointer;
        display: none;
        z-index: 5;
      `;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);
            parent.appendChild(this.canvas);
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
        }
        show() {
            this.isVisible = true;
            this.canvas.style.display = 'block';
            this.backgroundCanvas.style.display = 'block';
            this.render();
        }
        hide() {
            this.isVisible = false;
            this.canvas.style.display = 'none';
            this.backgroundCanvas.style.display = 'none';
        }
        setSlotOccupied(slotId, occupied) {
            if (occupied) {
                this.occupiedSlotIds.add(slotId);
            }
            else {
                this.occupiedSlotIds.delete(slotId);
            }
            if (this.isVisible) {
                this.render();
            }
        }
        drawAllSlotIndicators() {
            const allSlotTypes = ['ceiling', 'air_high', 'air_mid', 'air_low', 'ground'];
            const smallCircleRadius = 3;
            const blueColor = '#2196f3';
            const grayColor = '#cccccc';
            this.backgroundCtx.clearRect(0, 0, this.gameWidth, this.gameHeight + this.overlayPadding);
            allSlotTypes.forEach(slotType => {
                const slots = this.slotManager.getSlotsByType(slotType);
                slots.forEach(slot => {
                    const isOccupiedByTree = this.occupiedSlotIds.has(slot.id);
                    const isAvailableForTree = slotType === 'ground' && (!slot.occupied || isOccupiedByTree);
                    if (isAvailableForTree) {
                        this.ctx.save();
                        this.ctx.fillStyle = blueColor;
                        this.ctx.beginPath();
                        this.ctx.arc(slot.x, slot.y, smallCircleRadius, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    }
                    else {
                        this.backgroundCtx.save();
                        this.backgroundCtx.fillStyle = grayColor;
                        this.backgroundCtx.beginPath();
                        this.backgroundCtx.arc(slot.x, slot.y, smallCircleRadius, 0, Math.PI * 2);
                        this.backgroundCtx.fill();
                        this.backgroundCtx.restore();
                    }
                });
            });
        }
        render() {
            this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight + this.overlayPadding);
            this.drawAllSlotIndicators();
            const groundSlots = this.slotManager.getSlotsByType('ground');
            groundSlots.forEach(slot => {
                const isOccupiedByTree = this.occupiedSlotIds.has(slot.id);
                if (!slot.occupied || isOccupiedByTree) {
                    const color = isOccupiedByTree ? this.occupiedColor : this.availableColor;
                    const offsetY = slot.y - 0;
                    this.drawFullCircle(slot.x, offsetY, color);
                }
            });
        }
        drawFullCircle(x, y, color) {
            this.ctx.save();
            const strokeColor = color === this.occupiedColor ? '#FF9800' : '#2196f3';
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.circleRadius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
        handleClick(event) {
            const rect = this.canvas.getBoundingClientRect();
            const clickXScaled = event.clientX - rect.left;
            const clickYScaled = event.clientY - rect.top;
            const scaleX = this.gameWidth / rect.width;
            const scaleY = (this.gameHeight + this.overlayPadding) / rect.height;
            const clickX = clickXScaled * scaleX;
            const clickY = clickYScaled * scaleY;
            const groundSlots = this.slotManager.getSlotsByType('ground');
            for (const slot of groundSlots) {
                const dx = clickX - slot.x;
                const dy = clickY - slot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.circleRadius) {
                    const isOccupiedByTree = this.occupiedSlotIds.has(slot.id);
                    if (slot.occupied && !isOccupiedByTree) {
                        return;
                    }
                    const eventName = isOccupiedByTree ? 'jamble:tree-removed' : 'jamble:tree-placed';
                    window.dispatchEvent(new CustomEvent(eventName, {
                        detail: { slotId: slot.id, x: slot.x, y: slot.y }
                    }));
                    return;
                }
            }
        }
        destroy() {
            if (this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
            }
            if (this.backgroundCanvas.parentElement) {
                this.backgroundCanvas.parentElement.removeChild(this.backgroundCanvas);
            }
        }
    }
    Jamble.TreePlacementOverlay = TreePlacementOverlay;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class TapIndicator {
        constructor(canvasHost, gameWidth, gameHeight) {
            this.overlayPadding = 40;
            this.circleRadius = 33;
            this.visible = false;
            this.playerX = 0;
            this.playerY = 0;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = gameWidth * dpr;
            this.canvas.height = (gameHeight + this.overlayPadding) * dpr;
            this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(100% + ${this.overlayPadding}px);
        pointer-events: auto;
        z-index: 5;
      `;
            const ctx = this.canvas.getContext('2d');
            if (!ctx)
                throw new Error('Could not get 2D context for tap indicator');
            this.ctx = ctx;
            this.ctx.scale(dpr, dpr);
            canvasHost.appendChild(this.canvas);
            this.canvas.addEventListener('click', this.handleClick.bind(this));
        }
        show(playerX, playerY) {
            this.visible = true;
            this.playerX = playerX;
            this.playerY = playerY;
            this.canvas.style.display = 'block';
            this.render();
        }
        hide() {
            this.visible = false;
            this.canvas.style.display = 'none';
            this.clear();
        }
        updatePosition(playerX, playerY) {
            if (!this.visible)
                return;
            this.playerX = playerX;
            this.playerY = playerY;
        }
        setOnTap(callback) {
            this.onTapCallback = callback;
        }
        render() {
            if (!this.visible)
                return;
            this.clear();
            this.ctx.strokeStyle = '#2196f3';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(this.playerX, this.playerY, this.circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        clear() {
            this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight + this.overlayPadding);
        }
        handleClick(event) {
            if (!this.visible || !this.onTapCallback)
                return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.gameWidth / rect.width;
            const scaleY = (this.gameHeight + this.overlayPadding) / rect.height;
            const clickX = (event.clientX - rect.left) * scaleX;
            const clickY = (event.clientY - rect.top) * scaleY;
            const dx = clickX - this.playerX;
            const dy = clickY - this.playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.circleRadius) {
                this.onTapCallback();
            }
        }
        isVisible() {
            return this.visible;
        }
        destroy() {
            this.canvas.removeEventListener('click', this.handleClick.bind(this));
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }
    Jamble.TapIndicator = TapIndicator;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Soma extends Jamble.BaseNPC {
        constructor() {
            super('Soma', {
                baselineValue: 0.2,
                decayRate: 0.8,
                maxValue: 6.0,
                minValue: -1.0,
                sensitivity: 3.0,
                painThreshold: 5.0
            });
            this.expressionEmojis = {
                default: '😒',
                enjoy: '😌',
                aroused: '😳',
                pain: '😖',
                win: '🫠'
            };
            this.crescendoConfig = {
                targetArousalValue: 4.3,
                arousalTolerance: 0.7,
                riseRate: 0.15,
                decayRate: 0.1,
                threshold: 1.0,
                maxValue: 1.0
            };
            this.evaluateExpression(true);
        }
        initialize() {
            console.log(`${this.name} initialized - baseline arousal: ${this.arousalValue}`);
        }
        update(deltaTime, player) {
            super.updateArousal(deltaTime, player);
            super.updateCrescendo(deltaTime);
        }
        onGameEvent(event, data) {
            switch (event) {
                case 'knob-hit-side':
                    this.applyArousalImpulse(0.15);
                    break;
                case 'knob-hit-top':
                    this.applyArousalImpulse(0.4);
                    break;
                case 'game-start':
                    this.setArousalValue(this.arousalConfig.baselineValue);
                    break;
                default:
                    break;
            }
        }
        wantsKnobHidden() {
            const state = this.getArousalState();
            return state === 'pain';
        }
        wantsMoreStimulation() {
            const state = this.getArousalState();
            return state === 'default' || state === 'minimum';
        }
        resolveExpression() {
            var _a, _b, _c, _d, _e;
            if (this.isPainExpressionActive()) {
                return {
                    id: 'pain',
                    emoji: (_a = this.expressionEmojis) === null || _a === void 0 ? void 0 : _a.pain
                };
            }
            if (this.isWinExpressionActive()) {
                return {
                    id: 'win',
                    emoji: (_b = this.expressionEmojis) === null || _b === void 0 ? void 0 : _b.win
                };
            }
            if (this.isInCrescendoZone()) {
                return {
                    id: 'aroused',
                    emoji: (_c = this.expressionEmojis) === null || _c === void 0 ? void 0 : _c.aroused
                };
            }
            if (this.arousalValue <= 0.2) {
                return {
                    id: 'default',
                    emoji: (_d = this.expressionEmojis) === null || _d === void 0 ? void 0 : _d.default
                };
            }
            return {
                id: 'enjoy',
                emoji: (_e = this.expressionEmojis) === null || _e === void 0 ? void 0 : _e.enjoy
            };
        }
    }
    Jamble.Soma = Soma;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Game {
        constructor(gameElement, optionsOrContainer) {
            var _a;
            this.gameObjects = [];
            this.knobs = [];
            this.trees = new Map();
            this.treeIdCounter = 0;
            this.lastTime = 0;
            this.gameWidth = 500;
            this.gameHeight = 100;
            try {
                console.log('🎮 Jamble Game Initializing - Build: v2.0.461');
                let options = {};
                if (optionsOrContainer instanceof HTMLElement) {
                    options = { debug: true, container: optionsOrContainer };
                }
                else if (optionsOrContainer) {
                    options = optionsOrContainer;
                }
                this.rootElement = gameElement;
                this.rootElement.innerHTML = '';
                this.gameShell = document.createElement('div');
                this.gameShell.className = 'game-shell';
                this.rootElement.appendChild(this.gameShell);
                const canvasWrapper = document.createElement('div');
                canvasWrapper.className = 'canvas-wrapper';
                canvasWrapper.style.cssText = `
          position: relative;
          width: 100%;
          overflow: visible;
        `;
                this.gameShell.appendChild(canvasWrapper);
                this.canvasHost = document.createElement('div');
                this.canvasHost.className = 'game-canvas';
                canvasWrapper.appendChild(this.canvasHost);
                this.renderer = new Jamble.CanvasRenderer(this.canvasHost, this.gameWidth, this.gameHeight);
                this.debugRenderer = new Jamble.DebugRenderer(this.canvasHost);
                this.stateManager = new Jamble.StateManager();
                this.inputManager = new Jamble.InputManager();
                this.levelManager = new Jamble.LevelManager();
                this.slotManager = new Jamble.SlotManager(this.gameWidth, this.gameHeight);
                this.skillManager = new Jamble.SkillManager();
                this.activeNPC = new Jamble.Soma();
                this.collisionManager = new Jamble.CollisionManager(this.gameWidth, this.gameHeight);
                this.hudManager = new Jamble.HUDManager(this.gameShell, this.gameWidth, this.gameHeight);
                this.hudManager.setStateManager(this.stateManager);
                this.hudManager.setNPC(this.activeNPC);
                this.treePlacementOverlay = new Jamble.TreePlacementOverlay(this.canvasHost, this.slotManager, this.gameWidth, this.gameHeight);
                this.tapIndicator = new Jamble.TapIndicator(this.canvasHost, this.gameWidth, this.gameHeight);
                this.tapIndicator.setOnTap(() => {
                    if (this.stateManager.isIdle()) {
                        this.stateManager.startRun();
                        this.tapIndicator.hide();
                        this.skillManager.setSkillEnabled('jump', true);
                    }
                });
                this.jumpInstructionPanel = this.hudManager.getJumpInstructionPanel();
                this.jumpInstructionPanel.setStateManager(this.stateManager);
                this.jumpInstructionPanel.setOnJump(() => {
                    if (this.stateManager.isRunning() && this.skillManager.hasSkill('jump')) {
                        this.skillManager.useSkill('jump', this.player);
                    }
                });
                const debugContainer = options.container;
                const debugRequested = (_a = options.debug) !== null && _a !== void 0 ? _a : Boolean(debugContainer);
                if (debugRequested) {
                    if (debugContainer) {
                        this.debugSystem = new Jamble.DebugSystem(debugContainer);
                    }
                    else {
                        console.warn('Debug requested but no container provided. Debug UI disabled.');
                        this.debugSystem = null;
                    }
                }
                else {
                    this.debugSystem = null;
                }
                this.setupGameElement();
                this.createPlayer();
                this.hudManager.getControlPanel().setPlayer(this.player);
                this.hudManager.getControlPanel().onHeartUsed(() => {
                    this.respawnAllKnobs();
                });
                this.hudManager.getControlPanel().disableHeart();
                this.setupTreePlacement();
                this.TempEntitiesLayout();
                this.setupInput();
                this.activeNPC.initialize();
                this.hudManager.setSensationNPC(this.activeNPC);
                this.levelManager.setActiveNPC(this.activeNPC);
                this.levelManager.onLevelComplete((npc) => {
                    console.log(`Level complete! ${npc.getName()} reached crescendo!`);
                });
                this.activeNPC.onArousalChange((value, npc) => {
                    this.hudManager.setSensationValue(npc.getSensationNormalized());
                });
                this.activeNPC.onCrescendoChange((value, npc) => {
                    this.hudManager.setCrescendoValue(npc.getCrescendoNormalized());
                });
                this.activeNPC.onExpressionChange((expression) => {
                    this.hudManager.setPortraitExpression(expression);
                });
                this.activeNPC.onPainThreshold(() => {
                    console.log('Pain threshold hit - retracting all knobs');
                    this.knobs.forEach(knob => knob.retract());
                    this.activeNPC.disableCrescendo();
                    this.hudManager.showPortraitPain();
                    this.hudManager.getControlPanel().enableHeart();
                });
                this.hudManager.setSensationValue(this.activeNPC.getSensationNormalized());
                this.hudManager.setCrescendoValue(this.activeNPC.getCrescendoNormalized());
                this.hudManager.setPortraitExpression(this.activeNPC.getExpressionDescriptor());
                if (this.debugSystem) {
                    this.debugSystem.setPlayer(this.player);
                    this.debugSystem.setStateManager(this.stateManager);
                    this.debugSystem.setHUDManager(this.hudManager);
                    this.debugSystem.setGame(this);
                    this.debugSystem.registerSection('hud', this.hudManager.getDebugSection());
                    this.debugSystem.registerSection('game', this.getDebugSection());
                    this.debugSystem.registerSection('npc', this.activeNPC.getDebugSection());
                }
            }
            catch (error) {
                console.error('Error during game initialization:', error);
                throw error;
            }
        }
        respawnAllKnobs() {
            let respawnedCount = 0;
            this.knobs.forEach(knob => {
                if (knob.getState() === Jamble.KnobState.RETRACTED) {
                    knob.manualRespawn();
                    respawnedCount++;
                }
            });
            if (respawnedCount > 0) {
                this.activeNPC.enableCrescendo();
                this.activeNPC.resetPainExpression();
                this.hudManager.getControlPanel().disableHeart();
            }
            console.log(`Respawned ${respawnedCount} knob(s)`);
        }
        getDebugSection() {
            return {
                title: 'Game Controls',
                controls: [
                    {
                        type: 'button',
                        label: 'Respawn All Knobs',
                        onClick: () => this.respawnAllKnobs()
                    }
                ]
            };
        }
        setupTreePlacement() {
            const treeModule = this.hudManager.getControlPanel().getModule('tree');
            window.addEventListener('jamble:tree-module-clicked', () => {
                if (this.stateManager.isInEditorMode()) {
                    this.exitTreeEditMode();
                }
                else {
                    this.enterTreeEditMode();
                }
            });
            window.addEventListener('jamble:tree-placed', ((e) => {
                const { slotId, x, y } = e.detail;
                this.placeTree(slotId, x, y);
            }));
            window.addEventListener('jamble:tree-removed', ((e) => {
                const { slotId } = e.detail;
                this.removeTree(slotId);
            }));
        }
        enterTreeEditMode() {
            this.stateManager.enterTreePlacementMode();
            this.treePlacementOverlay.show();
            const treeModule = this.hudManager.getControlPanel().getModule('tree');
            treeModule.setEditMode(true);
        }
        exitTreeEditMode() {
            this.stateManager.exitEditorMode();
            this.treePlacementOverlay.hide();
            const treeModule = this.hudManager.getControlPanel().getModule('tree');
            treeModule.setEditMode(false);
        }
        placeTree(slotId, x, y) {
            const treeModule = this.hudManager.getControlPanel().getModule('tree');
            if (treeModule.getUsesRemaining() === 0 || !treeModule.useTree()) {
                return;
            }
            const treeId = `tree_${this.treeIdCounter++}`;
            const tree = new Jamble.Tree(treeId, x, y, slotId);
            this.gameObjects.push(tree);
            this.trees.set(slotId, tree);
            this.slotManager.occupySlot(slotId, treeId);
            this.treePlacementOverlay.setSlotOccupied(slotId, true);
        }
        removeTree(slotId) {
            const tree = this.trees.get(slotId);
            if (!tree)
                return;
            tree.despawn();
            const index = this.gameObjects.indexOf(tree);
            if (index > -1) {
                this.gameObjects.splice(index, 1);
            }
            this.trees.delete(slotId);
            this.slotManager.freeSlot(slotId);
            const treeModule = this.hudManager.getControlPanel().getModule('tree');
            treeModule.returnTree();
            this.treePlacementOverlay.setSlotOccupied(slotId, false);
        }
        setupGameElement() {
            this.gameShell.style.cssText = `
        width: 100%;
        max-width: ${this.gameWidth}px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0 auto;
        overflow: visible;
      `;
            this.canvasHost.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: ${this.gameWidth} / ${this.gameHeight};
        overflow: hidden;
      `;
            this.setupResizeListener();
            this.updateHUDScale();
            window.addEventListener('jamble:editor-mode-change', ((e) => {
                const dimmed = e.detail.mode !== 'none';
                const alpha = dimmed ? 0.2 : 1.0;
                console.log('Editor mode changed:', e.detail.mode, 'Setting alpha to:', alpha);
                this.player.render.opacity = alpha;
                this.renderer.setBackgroundAlpha(alpha);
            }));
        }
        calculateCanvasScale() {
            const canvasRect = this.canvasHost.getBoundingClientRect();
            const actualWidth = canvasRect.width;
            const scaleX = actualWidth / this.gameWidth;
            return scaleX;
        }
        updateHUDScale() {
            const scale = this.calculateCanvasScale();
            this.hudManager.setScale(scale);
        }
        setupResizeListener() {
            window.addEventListener('resize', () => {
                this.updateHUDScale();
            });
        }
        createPlayer() {
            this.player = new Jamble.Player(50, 0);
            this.gameObjects.push(this.player);
        }
        TempEntitiesLayout() {
            const groundSlots = this.slotManager.getSlotsByType('ground');
            const lowAirSlots = this.slotManager.getAvailableSlots('air_low');
            if (groundSlots.length > 0) {
                const homeSlot = groundSlots[0];
                this.home = new Jamble.Home('home', homeSlot.x, homeSlot.y);
                this.gameObjects.push(this.home);
                this.slotManager.occupySlot(homeSlot.id, this.home.id);
                this.homeSensor = new Jamble.Sensor('home-sensor', this.home, 0, -20);
                this.homeSensor.setTriggerSize(30, 10);
                this.homeSensor.onTriggerEnter = (other) => {
                    if (other.id === 'player') {
                        if (this.stateManager.isTransition() && this.player.velocityX === 0) {
                            this.stateManager.enterIdle();
                            this.homeSensor.setEnabled(false);
                            this.skillManager.setSkillEnabled('jump', false);
                        }
                        else if (!this.stateManager.isTransition() && !this.stateManager.isIdle()) {
                            this.stateManager.enterTransition();
                            this.homeSensor.setEnabled(false);
                            this.skillManager.setSkillEnabled('jump', false);
                        }
                    }
                };
                this.gameObjects.push(this.homeSensor);
            }
            const availableGroundSlots = this.slotManager.getAvailableSlots('ground');
            if (availableGroundSlots.length > 3) {
                const knobSlot = availableGroundSlots[3];
                const knob = new Jamble.Knob('knob1', knobSlot.x, knobSlot.y, this.slotManager, knobSlot.id, this.activeNPC);
                this.gameObjects.push(knob);
                this.knobs.push(knob);
                this.slotManager.occupySlot(knobSlot.id, knob.id);
            }
            if (lowAirSlots.length > 2) {
                const platformSlot = lowAirSlots[2];
                const platform = new Jamble.Platform('platform1', platformSlot.x, platformSlot.y);
                this.gameObjects.push(platform);
                this.slotManager.occupySlot(platformSlot.id, platform.id);
            }
            this.groundSensor = new Jamble.Sensor('ground-sensor', undefined, this.gameWidth / 2, this.gameHeight - 5);
            this.groundSensor.setTriggerSize(this.gameWidth, 5);
            this.groundSensor.onTriggerEnter = (other) => {
                if (other.id === 'player' && this.stateManager.isRunning()) {
                    this.homeSensor.setEnabled(true);
                }
            };
            this.gameObjects.push(this.groundSensor);
        }
        setupInput() {
            this.inputManager.onKeyDown('Space', () => {
                if (this.skillManager.hasSkill('jump')) {
                    this.skillManager.useSkill('jump', this.player);
                }
            });
            this.canvasHost.addEventListener('pointerdown', (e) => {
                if (this.stateManager.isRunning() && this.skillManager.hasSkill('jump')) {
                    e.preventDefault();
                    this.skillManager.useSkill('jump', this.player);
                }
            });
        }
        handleInput() {
            if (!this.skillManager.hasSkill('move'))
                return;
            if (this.stateManager.isTransition()) {
                this.handleTransitionState();
            }
            else if (this.stateManager.isRunning()) {
                this.player.startAutoRun();
            }
            else if (this.stateManager.isIdle()) {
                this.player.stopAutoRun();
                this.player.stopMoving();
            }
        }
        handleTransitionState() {
            if (!this.home || !this.player)
                return;
            const homeX = this.home.transform.x;
            const playerX = this.player.transform.x;
            const threshold = 2;
            if (Math.abs(playerX - homeX) < threshold) {
                this.player.stopMoving();
                this.stateManager.enterIdle();
                return;
            }
        }
        update(deltaTime) {
            this.handleInput();
            this.activeNPC.update(deltaTime, this.player);
            this.gameObjects.forEach(obj => obj.update(deltaTime));
            this.collisionManager.update(this.gameObjects);
            if (this.debugSystem) {
                this.debugSystem.update();
            }
            this.hudManager.updateControlPanel();
            this.jumpInstructionPanel.updateVisibility();
            this.hudManager.update(deltaTime);
            if (this.stateManager.isIdle() && !this.stateManager.isInEditorMode()) {
                const playerCenterY = this.player.transform.y - 10;
                if (!this.tapIndicator.isVisible()) {
                    this.tapIndicator.show(this.player.transform.x, playerCenterY);
                }
                else {
                    this.tapIndicator.updatePosition(this.player.transform.x, playerCenterY);
                }
            }
            else {
                if (this.tapIndicator.isVisible()) {
                    this.tapIndicator.hide();
                }
            }
        }
        render() {
            this.renderer.render(this.gameObjects);
            this.debugRenderer.render(this.gameObjects, this.debugSystem ? this.debugSystem.getShowColliders() : false, this.debugSystem ? this.debugSystem.getShowOrigins() : false, this.debugSystem ? this.debugSystem.getShowSlots() : false, this.slotManager.getAllSlots());
            this.hudManager.render();
            if (this.tapIndicator.isVisible()) {
                this.tapIndicator.render();
            }
        }
        start() {
            const gameLoop = (currentTime) => {
                const deltaTime = this.lastTime ? Math.min((currentTime - this.lastTime) / 1000, 0.1) : 0;
                this.lastTime = currentTime;
                this.update(deltaTime);
                this.render();
                requestAnimationFrame(gameLoop);
            };
            requestAnimationFrame(gameLoop);
        }
    }
    Jamble.Game = Game;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class DebugSystem {
        constructor(container) {
            this.debugContainer = null;
            this.showColliders = false;
            this.showOrigins = false;
            this.showSlots = false;
            this.player = null;
            this.stateManager = null;
            this.hudManager = null;
            this.game = null;
            this.sections = new Map();
            this.economyManager = Jamble.EconomyManager.getInstance();
            if (container) {
                this.debugContainer = container;
                this.setupSidePanelDebug();
            }
            else {
                this.setupOverlayDebug();
            }
        }
        setupSidePanelDebug() {
            if (!this.debugContainer) {
                console.error('Debug container not found');
                return;
            }
            try {
                this.debugContainer.innerHTML = `
          <div class="debug-container">
            <div class="debug-header">
              <h2>Debug Panel</h2>
              <p class="debug-info">Registry-Based Architecture</p>
              <p class="build-info">Build: ${DebugSystem.BUILD_VERSION}</p>
            </div>
            
            <!-- All sections are now registered dynamically -->
            <div id="registered-sections"></div>
          </div>
        `;
            }
            catch (error) {
                console.error('Error setting up debug panel HTML:', error);
                return;
            }
            try {
                const style = document.createElement('style');
                style.textContent = `
          .debug-container {
            padding: 0;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            background-color: #f8f9fa;
            height: 100%;
            overflow-y: auto;
          }
          
          .debug-header {
            background: #fff;
            padding: 12px 16px;
            border-radius: 0;
            border: none;
            border-bottom: 1px solid #dee2e6;
            margin-bottom: 0;
          }
          
    
          .debug-header h2 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #212529;
          }
          
          .debug-info {
            margin: 0;
            font-size: 12px;
            color: #6c757d;
          }
          
          .build-info {
            margin: 4px 0 0 0;
            font-size: 10px;
            font-family: monospace;
            color: #28a745;
          }
          
          .debug-section {
            background: #fff;
            border: none;
            border-bottom: 1px solid #dee2e6;
            border-radius: 0;
            overflow: hidden;
            margin-bottom: 0;
          }
          
          .section-header {
            background: #f8f9fa;
            padding: 10px 16px;
            font-weight: 600;
            border-bottom: 1px solid #dee2e6;
            color: #212529;
            cursor: pointer;
            user-select: none;
            position: relative;
            transition: background 0.2s;
            font-size: 13px;
          }
          
          .section-header:hover {
            background: #e9ecef;
          }
          
          .section-header::before {
            content: '▼';
            display: inline-block;
            margin-right: 8px;
            transition: transform 0.2s;
            font-size: 10px;
          }
          
          .section-header.collapsed::before {
            transform: rotate(-90deg);
          }
          
          .section-content {
            padding: 12px 16px;
            transition: max-height 0.3s ease-out, padding 0.3s ease-out;
            max-height: 1000px;
            overflow: hidden;
          }
          
          .section-content.collapsed {
            max-height: 0;
            padding: 0 16px;
          }
          
          .form-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          
          .control-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
          }
          
          .stat-label {
            color: #495057;
            font-weight: 500;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .stat-value {
            font-family: monospace;
            color: #212529;
            background: #f8f9fa;
            padding: 2px 8px;
            border-radius: 3px;
            border: 1px solid #dee2e6;
            min-width: 45px;
            text-align: right;
            display: inline-block;
            font-size: 12px;
          }
          
          .debug-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 13px;
            color: #212529;
          }
          
          .debug-checkbox {
            margin-right: 8px;
            cursor: pointer;
          }
          
          .debug-checkbox:checked + .checkmark {
            color: #007bff;
          }
          
          .debug-slider {
            width: 120px;
            margin-right: 8px;
          }

          .debug-button-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .debug-button {
            padding: 6px 10px;
            border: 1px solid #ced4da;
            background: #e9ecef;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
          }

          .debug-button:hover {
            background: #dde2e6;
          }
        `;
                document.head.appendChild(style);
            }
            catch (error) {
                console.error('Error setting up debug panel styles:', error);
            }
        }
        setupOverlayDebug() {
            const debugElement = document.createElement('div');
            debugElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        border-radius: 4px;
        z-index: 1000;
      `;
            debugElement.innerHTML = `
        <div id="overlay-info"></div>
        <button id="overlay-toggle" style="margin-top: 5px; padding: 4px 8px; background: #333; color: white; border: 1px solid #666; border-radius: 2px; cursor: pointer;">
          Toggle Colliders
        </button>
      `;
            document.body.appendChild(debugElement);
            const toggleButton = debugElement.querySelector('#overlay-toggle');
            if (toggleButton) {
                toggleButton.onclick = () => {
                    this.showColliders = !this.showColliders;
                };
            }
        }
        getEconomySection() {
            return {
                title: 'Economy',
                controls: [
                    {
                        type: 'display',
                        label: 'Currency',
                        getValue: () => `$${this.economyManager.getCurrency()}`
                    }
                ]
            };
        }
        getPlayerStatsSection() {
            if (!this.player) {
                return { title: 'Player Stats', controls: [] };
            }
            return {
                title: 'Player Stats',
                controls: [
                    {
                        type: 'display',
                        label: 'Move Speed',
                        getValue: () => this.player.moveSpeed
                    },
                    {
                        type: 'display',
                        label: 'Jump Height',
                        getValue: () => this.player.jumpHeight
                    },
                    {
                        type: 'display',
                        label: 'Position X',
                        getValue: () => this.player.transform.x.toFixed(1)
                    },
                    {
                        type: 'display',
                        label: 'Position Y',
                        getValue: () => this.player.transform.y.toFixed(1)
                    },
                    {
                        type: 'display',
                        label: 'Velocity X',
                        getValue: () => this.player.velocityX.toFixed(1)
                    },
                    {
                        type: 'display',
                        label: 'Velocity Y',
                        getValue: () => this.player.velocityY.toFixed(1)
                    },
                    {
                        type: 'display',
                        label: 'Grounded',
                        getValue: () => this.player.grounded ? 'YES' : 'NO'
                    }
                ]
            };
        }
        getDebugControlsSection() {
            return {
                title: 'Debug Controls',
                controls: [
                    {
                        type: 'checkbox',
                        label: 'Show Colliders',
                        getValue: () => this.showColliders,
                        setValue: (value) => { this.showColliders = value; }
                    },
                    {
                        type: 'checkbox',
                        label: 'Show Origins',
                        getValue: () => this.showOrigins,
                        setValue: (value) => { this.showOrigins = value; }
                    },
                    {
                        type: 'checkbox',
                        label: 'Show Slots',
                        getValue: () => this.showSlots,
                        setValue: (value) => { this.showSlots = value; }
                    }
                ]
            };
        }
        setPlayer(player) {
            this.player = player;
            this.registerSection('economy', this.getEconomySection());
            this.registerSection('player-stats', this.getPlayerStatsSection());
            this.registerSection('debug-controls', this.getDebugControlsSection());
        }
        setStateManager(stateManager) {
            this.stateManager = stateManager;
        }
        setHUDManager(hudManager) {
            this.hudManager = hudManager;
        }
        setGame(game) {
            this.game = game;
        }
        registerSection(id, section) {
            this.sections.set(id, section);
            if (this.debugContainer) {
                this.rebuildRegisteredSections();
            }
        }
        unregisterSection(id) {
            this.sections.delete(id);
        }
        buildRegisteredSectionsHTML() {
            let html = '';
            this.sections.forEach((section, id) => {
                html += `
          <div class="debug-section" id="section-${id}">
            <div class="section-header">${section.title}</div>
            <div class="section-content">
              <div class="form-grid" id="content-${id}">
                ${section.controls.map(control => this.renderControl(control, `content-${id}`)).join('')}
              </div>
            </div>
          </div>
        `;
            });
            return html;
        }
        attachRegisteredSectionListeners() {
            this.sections.forEach((section, id) => {
                var _a;
                section.controls.forEach(control => {
                    this.attachControlListeners(control, `content-${id}`);
                });
                const sectionElement = (_a = this.debugContainer) === null || _a === void 0 ? void 0 : _a.querySelector(`#section-${id}`);
                const headerElement = sectionElement === null || sectionElement === void 0 ? void 0 : sectionElement.querySelector('.section-header');
                const contentElement = sectionElement === null || sectionElement === void 0 ? void 0 : sectionElement.querySelector('.section-content');
                if (headerElement && contentElement) {
                    headerElement.addEventListener('click', () => {
                        const isCollapsed = contentElement.classList.contains('collapsed');
                        contentElement.classList.toggle('collapsed');
                        headerElement.classList.toggle('collapsed');
                    });
                }
            });
        }
        rebuildRegisteredSections() {
            if (!this.debugContainer)
                return;
            const container = this.debugContainer.querySelector('#registered-sections');
            if (container) {
                container.innerHTML = this.buildRegisteredSectionsHTML();
                this.attachRegisteredSectionListeners();
            }
        }
        update() {
            if (!this.player)
                return;
            if (this.debugContainer) {
                this.updateSidePanelDebug();
                this.updateRegisteredDisplays();
            }
            else {
                this.updateOverlayDebug();
            }
        }
        updateSidePanelDebug() {
        }
        updateOverlayDebug() {
            if (!this.player)
                return;
            const infoElement = document.querySelector('#overlay-info');
            if (infoElement) {
                const info = [
                    `Move Speed: ${this.player.moveSpeed}`,
                    `Jump Height: ${this.player.jumpHeight}`,
                    `Position: ${this.player.transform.x.toFixed(1)}, ${this.player.transform.y.toFixed(1)}`,
                    `Velocity: ${this.player.velocityX.toFixed(1)}, ${this.player.velocityY.toFixed(1)}`,
                    `Grounded: ${this.player.grounded}`,
                    `Colliders: ${this.showColliders ? 'ON' : 'OFF'}`
                ];
                if (this.stateManager) {
                    info.push(`State: ${this.stateManager.getCurrentState().toUpperCase()}`);
                }
                infoElement.innerHTML = info.join('<br>');
            }
        }
        renderControl(control, containerId) {
            var _a;
            const controlId = `${containerId}-${control.label.replace(/\s+/g, '-').toLowerCase()}`;
            switch (control.type) {
                case 'display':
                    return `
            <div class="control-row">
              <span class="stat-label">${control.label}:</span>
              <span class="stat-value" id="${controlId}">${control.getValue()}</span>
            </div>
          `;
                case 'slider':
                    const sliderValue = control.getValue();
                    const step = (_a = control.step) !== null && _a !== void 0 ? _a : 1;
                    return `
            <div class="control-row">
              <span class="stat-label">${control.label}:</span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="range" id="${controlId}" 
                  min="${control.min}" 
                  max="${control.max}" 
                  step="${step}" 
                  value="${sliderValue}" 
                  style="width: 100px;">
                <span class="stat-value" id="${controlId}-value">${sliderValue}</span>
              </div>
            </div>
          `;
                case 'button':
                    return `
            <div class="control-row">
              <button type="button" class="debug-button" id="${controlId}" style="grid-column: 1 / -1;">${control.label}</button>
            </div>
          `;
                case 'checkbox':
                    const checked = control.getValue();
                    return `
            <div class="control-row" style="grid-template-columns: 1fr;">
              <label class="debug-checkbox-label" id="${controlId}-label">
                <input type="checkbox" id="${controlId}" class="debug-checkbox" ${checked ? 'checked' : ''}>
                <span class="checkmark"></span>
                ${control.label}
              </label>
            </div>
          `;
            }
        }
        attachControlListeners(control, containerId) {
            var _a, _b;
            const controlId = `${containerId}-${control.label.replace(/\s+/g, '-').toLowerCase()}`;
            const element = (_a = this.debugContainer) === null || _a === void 0 ? void 0 : _a.querySelector(`#${controlId}`);
            if (!element)
                return;
            switch (control.type) {
                case 'slider':
                    const slider = element;
                    const valueDisplay = (_b = this.debugContainer) === null || _b === void 0 ? void 0 : _b.querySelector(`#${controlId}-value`);
                    slider.addEventListener('input', (e) => {
                        const value = parseFloat(e.target.value);
                        control.setValue(value);
                        if (valueDisplay) {
                            valueDisplay.textContent = value.toString();
                        }
                    });
                    break;
                case 'button':
                    element.addEventListener('click', () => control.onClick());
                    break;
                case 'checkbox':
                    const checkbox = element;
                    checkbox.addEventListener('change', (e) => {
                        control.setValue(e.target.checked);
                    });
                    break;
            }
        }
        updateRegisteredDisplays() {
            this.sections.forEach((section, id) => {
                section.controls.forEach(control => {
                    var _a;
                    if (control.type === 'display') {
                        const controlId = `content-${id}-${control.label.replace(/\s+/g, '-').toLowerCase()}`;
                        const element = (_a = this.debugContainer) === null || _a === void 0 ? void 0 : _a.querySelector(`#${controlId}`);
                        if (element) {
                            element.textContent = String(control.getValue());
                        }
                    }
                });
            });
        }
        getShowColliders() {
            return this.showColliders;
        }
        getShowOrigins() {
            return this.showOrigins;
        }
        getShowSlots() {
            return this.showSlots;
        }
    }
    DebugSystem.BUILD_VERSION = "v2.0.461";
    Jamble.DebugSystem = DebugSystem;
})(Jamble || (Jamble = {}));
