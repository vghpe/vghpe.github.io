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
                this.autoRunDirection = this.lastDirection;
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
        drawPlayer(ctx, x, y) {
            const drawX = x + this.visualOffsetX;
            const drawY = y + this.visualOffsetY;
            ctx.fillStyle = '#4db6ac';
            this.drawRoundedRect(ctx, drawX, drawY, 20, 20, 4);
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
        constructor(id, x = 0, y = 0) {
            super(id, x, y);
            this.visualOffsetX = 5;
            this.visualOffsetY = 0;
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
    class Knob extends Jamble.GameObject {
        constructor(id, x = 0, y = 0, slotManager, slotId) {
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
            this.hitTolerance = 3;
            this.currentHits = 0;
            this.knobState = 'active';
            this.respawnTimer = 0;
            this.respawnDelay = 2.0;
            this.currentSlotId = '';
            this.economyManager = Jamble.EconomyManager.getInstance();
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
                category: 'kinematic'
            };
        }
        update(deltaTime) {
            if (this.knobState === 'hidden') {
                this.respawnTimer -= deltaTime;
                if (this.respawnTimer <= 0) {
                    this.respawn();
                }
                return;
            }
            if (this.knobState === 'active') {
                this.anim.update(deltaTime);
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
        onCollected(player) {
            if (this.knobState !== 'active')
                return 0;
            const collisionType = this.detectCollisionType(player);
            let currencyAmount = this.currencyValue;
            if (collisionType === 'top') {
                currencyAmount = this.topHitValue;
                this.anim.triggerSquash();
            }
            else {
                this.anim.triggerDeflect(Math.random() > 0.5 ? 1 : -1);
            }
            this.economyManager.addCurrency(currencyAmount);
            this.currentHits++;
            if (this.currentHits >= this.hitTolerance) {
                this.startRelocation();
            }
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
            if (this.knobState !== 'active')
                return;
            if (other instanceof Jamble.Player) {
                this.onCollected(other);
            }
        }
        startRelocation() {
            this.knobState = 'hidden';
            this.respawnTimer = this.respawnDelay;
            this.render.visible = false;
            if (this.collisionBox) {
                this.collisionBox.category = 'deadly';
            }
            this.relocateToNewSlot();
        }
        relocateToNewSlot() {
            const availableSlots = this.slotManager.getAvailableSlots('ground')
                .filter(slot => slot.id !== this.currentSlotId);
            if (availableSlots.length > 0) {
                const newSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
                this.transform.x = newSlot.x;
                this.transform.y = newSlot.y;
                this.slotManager.freeSlot(this.currentSlotId);
                this.slotManager.occupySlot(newSlot.id, this.id);
                this.currentSlotId = newSlot.id;
            }
        }
        respawn() {
            this.knobState = 'active';
            this.currentHits = 0;
            this.render.visible = true;
            if (this.collisionBox) {
                this.collisionBox.category = 'kinematic';
            }
        }
    }
    Jamble.Knob = Knob;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class KnobAnim {
        constructor(knob) {
            this.knob = knob;
            this.isDeflecting = false;
            this.deflectionDirection = 1;
            this.deflectTimer = 0;
            this.deflectDuration = 0.2;
            this.isSquashing = false;
            this.squashPhase = 'compress';
            this.originalLength = 0;
            this.originalLineWidth = 0;
            this.squashVelocity = 0;
            this.squashPhaseTimer = 0;
            this.squashSpringElapsed = 0;
            this.squashOmega = 24.6;
            this.squashZeta = 0.15;
            this.squashHoldTimeS = 0.15;
        }
        update(deltaTime) {
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
                const targetLength = this.originalLength;
                const displacement = this.knob.config.length - targetLength;
                const omega = this.squashOmega;
                const zeta = this.squashZeta;
                const acc = -2 * zeta * omega * this.squashVelocity - (omega * omega) * displacement;
                this.squashVelocity += acc * deltaTime;
                this.knob.config.length += this.squashVelocity * deltaTime;
                this.squashSpringElapsed += deltaTime;
                const lengthProgress = 1 - Math.abs(displacement) / Math.abs(this.originalLength * 0.9);
                const clampedProgress = Math.max(0, Math.min(1, lengthProgress));
                const widthMultiplier = 1.3;
                this.knob.config.lineWidth = this.originalLineWidth * widthMultiplier -
                    (this.originalLineWidth * (widthMultiplier - 1.0) * clampedProgress);
                const isSettled = Math.abs(displacement) < 0.01 && Math.abs(this.squashVelocity) < 0.01;
                if (isSettled || this.squashSpringElapsed > 1.5) {
                    this.knob.config.length = this.originalLength;
                    this.knob.config.lineWidth = this.originalLineWidth;
                    this.isSquashing = false;
                    this.squashVelocity = 0;
                }
            }
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
            const squashPercent = 4;
            this.knob.config.length = this.originalLength * (squashPercent / 100);
            const widthMultiplier = 1.3;
            this.knob.config.lineWidth = this.originalLineWidth * widthMultiplier;
            this.squashPhaseTimer = this.squashHoldTimeS;
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
        }
        execute(player) {
        }
    }
    Jamble.MoveSkill = MoveSkill;
    class JumpSkill {
        constructor() {
            this.id = 'jump';
            this.name = 'Jump';
        }
        execute(player) {
            player.jump();
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
            if (skill) {
                skill.execute(player);
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
        z-index: 1;
      `;
            gameElement.appendChild(this.canvas);
        }
        setupContext() {
            const ctx = this.canvas.getContext('2d', { alpha: false });
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
            this.canvas.style.width = this.gameWidth + 'px';
            this.canvas.style.height = this.gameHeight + 'px';
            this.scaleX = pixelRatio;
            this.scaleY = pixelRatio;
            this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
            this.ctx.imageSmoothingEnabled = false;
        }
        render(gameObjects) {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            gameObjects.forEach(obj => {
                if (!obj.render.visible)
                    return;
                this.ctx.save();
                this.applyTransform(obj);
                this.renderCanvasObject(obj);
                this.ctx.restore();
            });
        }
        applyTransform(obj) {
            var _a, _b, _c, _d;
            const x = Math.round(obj.transform.x);
            const y = Math.round(obj.transform.y);
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
                if (!obj.collisionBox)
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
                if (!dyn.collisionBox)
                    continue;
                const wasGrounded = dyn.grounded === true;
                const vyBefore = (_a = dyn.velocityY) !== null && _a !== void 0 ? _a : 0;
                for (const solid of solids) {
                    if (dyn === solid || !solid.collisionBox)
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
                        if (!solid.collisionBox)
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
                if (!dyn.collisionBox)
                    continue;
                for (const other of triggers) {
                    if (!other.collisionBox)
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
            if (!obj.collisionBox)
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
            if (!obj.collisionBox)
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
            this.currentState = 'idle';
            this.stateStartTime = 0;
            this.countdownDuration = 3000;
            this.currentState = 'idle';
            this.stateStartTime = Date.now();
        }
        getCurrentState() {
            return this.currentState;
        }
        getStateTime() {
            return Date.now() - this.stateStartTime;
        }
        getCountdownTimeRemaining() {
            if (this.currentState !== 'countdown')
                return 0;
            return Math.max(0, this.countdownDuration - this.getStateTime());
        }
        getCountdownSeconds() {
            return Math.ceil(this.getCountdownTimeRemaining() / 1000);
        }
        isIdle() {
            return this.currentState === 'idle';
        }
        isCountdown() {
            return this.currentState === 'countdown';
        }
        isRunning() {
            return this.currentState === 'run';
        }
        startCountdown() {
            if (this.currentState === 'idle') {
                this.setState('countdown');
                return true;
            }
            return false;
        }
        startRun() {
            if (this.currentState === 'countdown') {
                this.setState('run');
                return true;
            }
            return false;
        }
        returnToIdle() {
            this.setState('idle');
        }
        forceRunState() {
            this.setState('run');
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
    class DebugSystem {
        constructor(container) {
            this.debugContainer = null;
            this.showColliders = false;
            this.showOrigins = false;
            this.showSlots = false;
            this.player = null;
            this.stateManager = null;
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
              <h2>Debug</h2>
              <p class="debug-info">Rebuilt Architecture</p>
              <p class="build-info">Build: ${DebugSystem.BUILD_VERSION}</p>
            </div>
            
            <div class="debug-section">
              <div class="section-header">Economy</div>
              <div class="section-content">
                <div class="form-grid" id="economy-stats">
                  <!-- Economy stats will be populated here -->
                </div>
              </div>
            </div>
            
            <div class="debug-section">
              <div class="section-header">Player Stats</div>
              <div class="section-content">
                <div class="form-grid" id="player-stats">
                  <!-- Player stats will be populated here -->
                </div>
              </div>
            </div>
            
            <div class="debug-section">
              <div class="section-header">Debug Controls</div>
              <div class="section-content">
                <label class="debug-checkbox-label">
                  <input type="checkbox" id="toggle-colliders" class="debug-checkbox">
                  <span class="checkmark"></span>
                  Show Colliders
                </label>
                <label class="debug-checkbox-label">
                  <input type="checkbox" id="toggle-origins" class="debug-checkbox">
                  <span class="checkmark"></span>
                  Show Origins
                </label>
                <label class="debug-checkbox-label">
                  <input type="checkbox" id="toggle-slots" class="debug-checkbox">
                  <span class="checkmark"></span>
                  Show Slots
                </label>
              </div>
            </div>
            
            <div class="debug-section">
              <div class="section-header">Game State</div>
              <div class="section-content">
                <div class="form-grid" id="game-state">
                  <!-- Game state will be populated here -->
                </div>
              </div>
            </div>
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
            padding: 16px;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            background-color: #f8f9fa;
            height: 100%;
            overflow-y: auto;
          }
          
          .debug-header {
            background: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            margin-bottom: 12px;
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
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
          }
          
          .section-header {
            background: #f8f9fa;
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 1px solid #dee2e6;
            color: #212529;
          }
          
          .section-content {
            padding: 16px;
          }
          
          .form-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px 16px;
            align-items: center;
          }
          
          .stat-label {
            color: #495057;
            font-weight: 500;
          }
          
          .stat-value {
            font-family: monospace;
            color: #212529;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid #dee2e6;
          }
          
          .debug-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
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
          
          .form-grid {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 8px 12px;
            align-items: center;
          }
        `;
                document.head.appendChild(style);
                const toggleCollidersCheckbox = this.debugContainer.querySelector('#toggle-colliders');
                if (toggleCollidersCheckbox) {
                    toggleCollidersCheckbox.onchange = () => {
                        this.showColliders = toggleCollidersCheckbox.checked;
                    };
                }
                else {
                    console.error('Could not find toggle-colliders checkbox');
                }
                const toggleOriginsCheckbox = this.debugContainer.querySelector('#toggle-origins');
                if (toggleOriginsCheckbox) {
                    toggleOriginsCheckbox.onchange = () => {
                        this.showOrigins = toggleOriginsCheckbox.checked;
                    };
                }
                else {
                    console.error('Could not find toggle-origins checkbox');
                }
                const toggleSlotsCheckbox = this.debugContainer.querySelector('#toggle-slots');
                if (toggleSlotsCheckbox) {
                    toggleSlotsCheckbox.onchange = () => {
                        this.showSlots = toggleSlotsCheckbox.checked;
                    };
                }
                else {
                    console.error('Could not find toggle-slots checkbox');
                }
            }
            catch (error) {
                console.error('Error setting up debug panel styles and events:', error);
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
        setPlayer(player) {
            this.player = player;
        }
        setStateManager(stateManager) {
            this.stateManager = stateManager;
        }
        update() {
            if (!this.player)
                return;
            if (this.debugContainer) {
                this.updateSidePanelDebug();
            }
            else {
                this.updateOverlayDebug();
            }
        }
        updateSidePanelDebug() {
            if (!this.player || !this.debugContainer)
                return;
            const economyContainer = this.debugContainer.querySelector('#economy-stats');
            if (economyContainer) {
                economyContainer.innerHTML = `
          <span class="stat-label">Currency:</span>
          <span class="stat-value">$${this.economyManager.getCurrency()}</span>
        `;
            }
            const statsContainer = this.debugContainer.querySelector('#player-stats');
            if (statsContainer) {
                statsContainer.innerHTML = `
          <span class="stat-label">Move Speed:</span>
          <span class="stat-value">${this.player.moveSpeed}</span>
          
          <span class="stat-label">Jump Height:</span>
          <span class="stat-value">${this.player.jumpHeight}</span>
          
          <span class="stat-label">Position X:</span>
          <span class="stat-value">${this.player.transform.x.toFixed(1)}</span>
          
          <span class="stat-label">Position Y:</span>
          <span class="stat-value">${this.player.transform.y.toFixed(1)}</span>
          
          <span class="stat-label">Velocity X:</span>
          <span class="stat-value">${this.player.velocityX.toFixed(1)}</span>
          
          <span class="stat-label">Velocity Y:</span>
          <span class="stat-value">${this.player.velocityY.toFixed(1)}</span>
          
          <span class="stat-label">Grounded:</span>
          <span class="stat-value">${this.player.grounded ? 'YES' : 'NO'}</span>
        `;
            }
            if (this.stateManager) {
                const gameStateContainer = this.debugContainer.querySelector('#game-state');
                if (gameStateContainer) {
                    const currentState = this.stateManager.getCurrentState();
                    gameStateContainer.innerHTML = `
            <span class="stat-label">Current State:</span>
            <span class="stat-value">${currentState.toUpperCase()}</span>
          `;
                }
            }
            const colliderStatus = this.debugContainer.querySelector('#collider-status');
            if (colliderStatus) {
                colliderStatus.textContent = this.showColliders ? 'ON' : 'OFF';
            }
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
    DebugSystem.BUILD_VERSION = "v2.0.149";
    Jamble.DebugSystem = DebugSystem;
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
    }
    Jamble.Sensor = Sensor;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class ShopManager {
        constructor() {
            this.availableItems = [];
            this.purchasedItems = new Set();
            this.economyManager = Jamble.EconomyManager.getInstance();
            this.initializeShopItems();
        }
        static getInstance() {
            if (!ShopManager.instance) {
                ShopManager.instance = new ShopManager();
            }
            return ShopManager.instance;
        }
        initializeShopItems() {
            this.availableItems = [
                { id: 'jump-boost', name: 'Jump Boost', price: 25 },
                { id: 'speed-boost', name: 'Speed Boost', price: 20 },
                { id: 'heavy-mass', name: 'Heavy Mass', price: 35 },
                { id: 'double-jump', name: 'Double Jump', price: 50 },
                { id: 'dash', name: 'Dash', price: 30 },
                { id: 'wall-jump', name: 'Wall Jump', price: 40 },
                { id: 'lucky-coin', name: 'Lucky Coin', price: 45 },
                { id: 'magnet', name: 'Magnet', price: 60 }
            ];
        }
        getAllItems() {
            return [...this.availableItems];
        }
        getItemById(id) {
            return this.availableItems.find(item => item.id === id);
        }
        canPurchase(itemId) {
            const item = this.getItemById(itemId);
            if (!item || this.isItemOwned(itemId))
                return false;
            return this.economyManager.canAfford(item.price);
        }
        purchaseItem(itemId) {
            const item = this.getItemById(itemId);
            if (!item) {
                return { success: false, message: 'Item not found' };
            }
            if (this.isItemOwned(itemId)) {
                return { success: false, message: 'Already owned' };
            }
            if (!this.economyManager.canAfford(item.price)) {
                return { success: false, message: 'Not enough currency' };
            }
            if (this.economyManager.spendCurrency(item.price)) {
                this.purchasedItems.add(itemId);
                return { success: true, message: 'Purchase successful' };
            }
            return { success: false, message: 'Purchase failed' };
        }
        isItemOwned(itemId) {
            return this.purchasedItems.has(itemId);
        }
    }
    Jamble.ShopManager = ShopManager;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class ShopUI {
        constructor() {
            this.container = document.createElement('div');
            this.isVisible = false;
            this.stateManager = null;
            this.shopManager = Jamble.ShopManager.getInstance();
            this.createShopContainer();
            this.setupStyles();
            this.setupResizeListener();
        }
        setStateManager(stateManager) {
            this.stateManager = stateManager;
        }
        createShopContainer() {
            this.container.id = 'shop-container';
            this.container.className = 'shop-container hidden';
            const items = this.shopManager.getAllItems();
            items.forEach((shopItem) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'shop-item';
                itemElement.dataset.itemId = shopItem.id;
                const price = document.createElement('div');
                price.className = 'shop-item-price';
                price.textContent = `$${shopItem.price}`;
                itemElement.appendChild(price);
                itemElement.addEventListener('click', () => this.handleItemClick(shopItem.id));
                this.container.appendChild(itemElement);
            });
            document.body.appendChild(this.container);
        }
        setupStyles() {
            const style = document.createElement('style');
            style.textContent = `
        .shop-container {
          position: fixed;
          display: grid;
          grid-template-columns: repeat(4, 50px);
          grid-template-rows: repeat(2, 50px);
          gap: 12px;
          width: max-content;
          z-index: 1000;
        }

        .shop-container.hidden {
          display: none;
        }

        .shop-item {
          width: 50px;
          height: 50px;
          background: #9e9e9e;
          cursor: pointer;
          position: relative;
          margin: 0 auto;
        }

        .shop-item.owned {
          background: #4a4;
        }

        .shop-item-price {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          color: #fff;
          background: transparent;
          padding: 0;
          border: none;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
        }
      `;
            document.head.appendChild(style);
        }
        handleItemClick(itemId) {
            const result = this.shopManager.purchaseItem(itemId);
            if (result.success) {
                console.log(`Purchased: ${itemId}`);
                this.updateItemDisplay(itemId);
            }
            else {
                console.log(`Failed: ${result.message}`);
            }
        }
        updateItemDisplay(itemId) {
            const itemElement = this.container.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                itemElement.classList.add('owned');
            }
        }
        show() {
            if (!this.isVisible) {
                this.isVisible = true;
                this.container.classList.remove('hidden');
                this.reposition();
            }
        }
        hide() {
            if (this.isVisible) {
                this.isVisible = false;
                this.container.classList.add('hidden');
            }
        }
        setupResizeListener() {
            const handler = () => {
                if (this.isVisible)
                    this.reposition();
            };
            window.addEventListener('resize', handler, { passive: true });
            window.addEventListener('scroll', handler, { passive: true });
        }
        update() {
            if (!this.stateManager)
                return;
            const currentState = this.stateManager.getCurrentState();
            if (currentState === 'idle') {
                this.show();
            }
            else {
                this.hide();
            }
        }
        reposition() {
            const gameRoot = document.getElementById('jamble-game');
            if (!gameRoot)
                return;
            const rect = gameRoot.getBoundingClientRect();
            const containerWidth = this.container.offsetWidth || 0;
            const left = rect.left + rect.width / 2 - containerWidth / 2;
            const top = rect.bottom + 16;
            this.container.style.left = `${left}px`;
            this.container.style.top = `${top}px`;
        }
    }
    Jamble.ShopUI = ShopUI;
})(Jamble || (Jamble = {}));
var Jamble;
(function (Jamble) {
    class Game {
        constructor(gameElement, debugContainer) {
            this.gameObjects = [];
            this.lastTime = 0;
            this.gameWidth = 500;
            this.gameHeight = 100;
            try {
                this.gameElement = gameElement;
                this.renderer = new Jamble.CanvasRenderer(gameElement, this.gameWidth, this.gameHeight);
                this.debugRenderer = new Jamble.DebugRenderer(gameElement);
                this.stateManager = new Jamble.StateManager();
                this.inputManager = new Jamble.InputManager();
                this.slotManager = new Jamble.SlotManager(this.gameWidth, this.gameHeight);
                this.skillManager = new Jamble.SkillManager();
                this.debugSystem = new Jamble.DebugSystem(debugContainer);
                this.collisionManager = new Jamble.CollisionManager(this.gameWidth, this.gameHeight);
                this.shopUI = new Jamble.ShopUI();
                this.shopUI.setStateManager(this.stateManager);
                this.setupGameElement();
                this.createPlayer();
                this.TempEntitiesLayout();
                this.setupInput();
                this.debugSystem.setPlayer(this.player);
                this.debugSystem.setStateManager(this.stateManager);
            }
            catch (error) {
                console.error('Error during game initialization:', error);
                throw error;
            }
        }
        setupGameElement() {
            this.gameElement.style.cssText = `
        position: relative;
        width: ${this.gameWidth}px;
        height: ${this.gameHeight}px;
        background: #e8f5e9;
        overflow: hidden;
        margin: 0 auto;
      `;
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
                const home = new Jamble.Home('home', homeSlot.x, homeSlot.y);
                this.gameObjects.push(home);
                this.slotManager.occupySlot(homeSlot.id, home.id);
                const homeSensor = new Jamble.Sensor('home-sensor', home, 0, -20);
                homeSensor.setTriggerSize(70, 10);
                homeSensor.onTriggerEnter = (other) => {
                    if (other.id === 'player') {
                        this.stateManager.returnToIdle();
                    }
                };
                this.gameObjects.push(homeSensor);
            }
            const availableGroundSlots = this.slotManager.getAvailableSlots('ground');
            if (availableGroundSlots.length > 2) {
                const treeSlot = availableGroundSlots[2];
                const tree = new Jamble.Tree('tree1', treeSlot.x, treeSlot.y);
                this.gameObjects.push(tree);
                this.slotManager.occupySlot(treeSlot.id, tree.id);
            }
            if (availableGroundSlots.length > 3) {
                const knobSlot = availableGroundSlots[3];
                const knob = new Jamble.Knob('knob1', knobSlot.x, knobSlot.y, this.slotManager, knobSlot.id);
                this.gameObjects.push(knob);
                this.slotManager.occupySlot(knobSlot.id, knob.id);
            }
            if (lowAirSlots.length > 2) {
                const platformSlot = lowAirSlots[2];
                const platform = new Jamble.Platform('platform1', platformSlot.x, platformSlot.y);
                this.gameObjects.push(platform);
                this.slotManager.occupySlot(platformSlot.id, platform.id);
            }
            const groundSensor = new Jamble.Sensor('ground-sensor', undefined, this.gameWidth / 2, this.gameHeight - 5);
            groundSensor.setTriggerSize(this.gameWidth, 5);
            groundSensor.onTriggerEnter = (other) => {
                if (other.id === 'player') {
                    this.stateManager.forceRunState();
                }
            };
            this.gameObjects.push(groundSensor);
        }
        setupInput() {
            this.inputManager.onKeyDown('Space', () => {
                if (this.skillManager.hasSkill('jump')) {
                    this.skillManager.useSkill('jump', this.player);
                }
            });
        }
        handleInput() {
            if (!this.skillManager.hasSkill('move'))
                return;
            if (this.stateManager.isRunning()) {
                this.player.startAutoRun();
            }
            else if (this.stateManager.isIdle()) {
                this.player.stopAutoRun();
                if (this.inputManager.isMovingLeft()) {
                    this.player.moveLeft();
                }
                else if (this.inputManager.isMovingRight()) {
                    this.player.moveRight();
                }
                else {
                    this.player.stopMoving();
                }
            }
        }
        update(deltaTime) {
            this.handleInput();
            this.gameObjects.forEach(obj => obj.update(deltaTime));
            this.collisionManager.update(this.gameObjects);
            this.debugSystem.update();
            this.shopUI.update();
        }
        render() {
            this.renderer.render(this.gameObjects);
            this.debugRenderer.render(this.gameObjects, this.debugSystem.getShowColliders(), this.debugSystem.getShowOrigins(), this.debugSystem.getShowSlots(), this.slotManager.getAllSlots());
        }
        start() {
            const gameLoop = (currentTime) => {
                const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
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
