
function platform(x1, x2, y){
    this.x1 = x1;
    this.x2 = x2;
    this.y = y;
}

function base_char(pixiLoc, hp){
    this.health = hp;
    this.yAccel = 0;
    this.g = 1; //acceleration due to gravity
    this.jumping = false;
    this.walking = false;
    this.inAir = false;
    this.step = function () {};
    this.move_speed = 5;

    this.addToWorld = function(){
        world.addChild(this.sprite);

        if(this.g != 0){
            PlatformManager.charList.push(this);
        }
    };

    this.setSprite = function(loc){
        this.sprite = new PIXI.Spine(loc);
        this.sprite.state.setAnimationByName("Idle", true);
    };

    this.__defineGetter__("x", function(){
        return this.sprite.x;
    });

    this.__defineGetter__("y", function(){
        return this.sprite.y;
    });

    this.__defineSetter__("x", function(val){
        this.sprite.x = val;
    });

    this.__defineSetter__("y", function(val){
        this.sprite.y = val;
    });
}

George.prototype = new base_char();
George.prototype.constructor = George;
function George(hp){
    this.setSprite("data/George.json");
    this.health = hp;
    this.maxHealth = hp;
    this.jumpHeight = -16;
    this.onPlatform = false;
    this.walking = false;
    this.attacking = false;
    this.speedX = 0;
    this.acc = 2;
    this.maxSpeed = 6;
    this.friction = .8;
    this.leftLimit = 40;
    this.jumpFreeze = false;
    this.kbrange = 40;
    this.kbDmg = 3;
    this.gun = 2;
    this.shootDelay = 100;
    this.gundmg = 1;
    this.gunhit = 1;
    this.gunrange = 500;
    this.shooting = false;
    this.dead = false;
    this.pulseAlpha = false;
    this.alphaDir = .05;
    this.invulnTimer = 250;
    this.recoilSpeed = 10;
    this.exp = [0, 0, 0, 0];//0-2 guns, 3 is melee
    this.levelup = [10, 10, 10, 20];
    this.attLevels = [1, 1, 1, 1];
    this.rightLimit = -999;
    this.doubleJump = false;
    this.doubleJumped = false;
    this.doubleJumpHeight = 22;

    this.gunranges = [600, 500, 300];
    this.gunhits = [1, 1, 2];
    this.gundmgs = [15, 6, 8];
    this.shootDelays = [350, 120, 500];//600
    //power ups

    this.attemptJump = function () {
        if(!this.attacking && !this.inAir && !this.jumpFreeze){
            this.yAccel = this.jumpHeight;
            this.inAir = true;
            this.sprite.state.setAnimationByName("Prejump", false);
            this.sprite.state.addAnimationByName("Jump", true, 0);
        }
    }
    
    this.step = function(){
        if(!MapManager.finale) {
            world.setChildIndex(this.sprite, world.children.length - 1);
        }else{
            index = world.children.length - 3;
            index = index<0?0:index;
            world.setChildIndex(this.sprite, index);
        }

        if(this.dead)return;
        //jumping
        if(ControlsManager.jump()){
            this.attemptJump();
        }
        //double jumping
        if(!this.attacking && ControlsManager.jump() && !this.jumpFreeze && this.doubleJump && !this.doubleJumped && this.inAir && this.yAccel>=0){//in air and coming down, double jump
            this.doubleJumped = true;
            this.yAccel = -this.doubleJumpHeight;
        }
        //falling
        if(this.yAccel != 0 && !this.inAir){//Jump/Fall
            this.inAir = true;
            this.sprite.state.setAnimationByName("Jump", true);
        }
        //Landing
        if(this.onPlatform && this.inAir){//Landing
            this.inAir = false;
            this.doubleJumped = false;
            this.sprite.state.clearAnimation();
            this.sprite.state.setAnimationByName("Landing", false);
            this.sprite.skeleton.setBonesToSetupPose();

            if (!this.walking) {
                    this.sprite.state.addAnimationByName("Idle", true, 0);
                } else {
                    this.sprite.state.setAnimationByName("Walking", true);
                }
        }
        //Walking
        if(!this.attacking) {
            if (ControlsManager.left() && !ControlsManager.right()) {
                if (!this.walking) {//began walking
                    this.walking = true;

                    if (!this.inAir) {
                        this.sprite.state.setAnimationByName("Walking", true);
                        //TODO: Fix gun getting stuck in up position
                        this.sprite.skeleton.setSlotsToSetupPose();
                        this.sprite.skeleton.setBonesToSetupPose();
                        this.sprite.skeleton.setToSetupPose();
                    }
                }
                this.sprite.scale.x = -1;
                this.speedX-=this.acc;
                if(this.speedX<= -this.maxSpeed) this.speedX = -this.maxSpeed;
            }

            if (ControlsManager.right() && !ControlsManager.left()) {
                if (!this.walking) {
                    this.walking = true;
                    if (!this.inAir) {
                        this.sprite.state.setAnimationByName("Walking", true);
                    }
                }
                this.sprite.scale.x = 1;
                this.speedX+=this.acc;
                if(this.speedX>= this.maxSpeed) this.speedX = this.maxSpeed;
            }

        }

        if (ControlsManager.left() == ControlsManager.right() && this.walking) {
            this.walking = false;
            if (!this.inAir) {
                this.sprite.state.clearAnimation();
                this.sprite.state.setAnimationByName("Idle", true);
                //update bones?
            }
        }

        if(!this.walking && this.speedX != 0 && !this.inAir){//friction
            this.speedX-=Math.abs(this.speedX)/this.speedX*this.friction;
            if(Math.abs(this.speedX)<this.friction){
                this.speedX = 0;
            }
        }

        //Hit testing zombies
        for(var i =0;i<ZombiesManager.zombies.length;i++){
            if(!ZombiesManager.zombies[i].dead && !GameManager.debugMode){
                if(Math.abs(this.y-ZombiesManager.zombies[i].y)<40 &&
                (this.x<=ZombiesManager.zombies[i].x && this.x+this.speedX>=ZombiesManager.zombies[i].x|| this.x>=ZombiesManager.zombies[i].x && this.x+this.speedX<=ZombiesManager.zombies[i].x)){
                    this.speedX = 0;
                }
            }
        }

        this.x+=this.speedX;
        if(this.rightLimit != -999){
            if(this.x>this.rightLimit){
                this.x = this.rightLimit;
                this.speedX = 0;
            }
        }

        if(this.x<this.leftLimit) {
            this.x = this.leftLimit;
            this.speedX = 0;
        }

        if(this.x>this.leftLimit+MapManager.charPadding && !MapManager.atBridge){
            this.leftLimit = this.x-MapManager.charPadding;
        }

        //pulsing alpha
        if(this.pulseAlpha){
            this.sprite.alpha+=this.alphaDir;
            if(this.sprite.alpha >= 1 || this.sprite.alpha<=.5){
                this.sprite.alpha = (this.sprite.alpha>1)? 1: (this.sprite.alpha <.5)?.5: this.sprite.alpha; //bound alpha
                this.alphaDir*=-1;
            }
        }

        //Melee
        if(!this.attacking && !this.shooting && ControlsManager.melee()){
            this.melee();
        }

        //Switching weapons
        if(Key.isDown(65) || Key.isDown(49)){
            this.setGun(0);
        }
        if(Key.isDown(83) || Key.isDown(50)){
            this.setGun(1);
        }
        if(Key.isDown(51) || Key.isDown(68)){
            this.setGun(2);//shotty
        }
        //Shoot
        if(ControlsManager.shoot() && !this.attacking) {
            if (!this.shooting && !this.walking && !this.inAir) {//Idle
                this.walking = false;
                this.shooting = true;

                if(this.gun == 0 || this.gun == 2) {
                    this.sprite.state.setAnimationByName("Shooting", false);
                    this.sprite.skeleton.setBonesToSetupPose();
                }

                var that = this;
                setTimeout(function () {
                    that.attackDone();
                    that.shooting = false;
                }, this.shootDelay);
                this.shoot();
            }
            if(!this.shooting && (this.inAir || this.walking)){//shooting in air/while walking
                this.shoot();
                //this.attacking = true;
                this.shooting = true;

                var that = this;
                setTimeout(function (){
                    that.attacking = false;
                    that.shooting = false;
                }, this.shootDelay);
            }
        }

    };

    this.levelHealth = function () {
        this.maxHealth+=10;
        this.health = this.maxHealth;
    };

    this.expGain = function (amount) {
        if(amount == null){//melee
            if(this.attLevels[3] == 6)return;//maxed
            this.exp[3]+=1;
            if(this.exp[3]>this.levelup[3]){//melee level up
                this.attLevels[3]++;
                this.levelHealth();
                this.exp[3] = 0;
                this.levelup[3]*=1.5;
                this.recoilSpeed+=2;
                this.kbDmg+=5;

                this.maxSpeed+=1;
                this.jumpHeight-=2;
            }
            return;
        }
        if(this.attLevels[this.gun] == 6){//maxed out
            return;
        }


        this.exp[this.gun]+=amount;
        if(this.exp[this.gun]>=this.levelup[this.gun]){
            this.levelup[this.gun]*=2;//double amount needed
            this.exp[this.gun] = 0;
            this.attLevels[this.gun]++;
            //level up

            this.levelHealth();
            if(this.gun == 0){//pistol
                this.gundmgs[this.gun]+=3;
                this.shootDelays[this.gun]-=30;
            }
            if(this.gun == 1){//MG
                this.gundmgs[this.gun]+=1;
                this.shootDelays[this.gun]-=10;
            }
            if(this.gun == 2){//shotty
                this.gundmgs[this.gun]+=3;
                this.gunhits[this.gun]+=1;
                this.shootDelays[this.gun]-=50;
            }

            if(this.shootDelays[this.gun] <= 0){
                this.shootDelays[this.gun] = 1;
            }

            this.setGun(this.gun);//refresh stats
            UIManager.updateGun();
        }
    };

    this.shoot = function () {
        //sound & shake-----------------------------------------
        if(this.gun == 0){//pistol
            MapManager.shakeWorld(2, 150);
            GameSounds.playSound("pistol");
            this.x-=this.sprite.scale.x*2;
        }else if(this.gun == 1){//mg
            MapManager.shakeWorld(3, 100);
            GameSounds.playSound("mg");
            this.x-=this.sprite.scale.x*2;
        }
        else if(this.gun == 2){//shotty
            MapManager.shakeWorld(4, 200);
            GameSounds.playSound("shotgun");
            this.x-=this.sprite.scale.x*4;
        }

        //add muzzle fire effect-------------------------------
        var shooting = new PIXI.Spine("data/effects.json");
        shooting.state.setAnimationByName("shooting1", true);

        shooting.y = george_char.y-45;
        shooting.scale.x = george_char.sprite.scale.x;

        if(this.gun == 0){
            shooting.x = george_char.x+george_char.sprite.scale.x*35;
        }else if(this.gun == 1){
            shooting.x = george_char.x+george_char.sprite.scale.x*55;
        }else if(this.gun == 2){//shotty
            shooting.x = george_char.x+george_char.sprite.scale.x*70;
        }

        shooting.offsetX = george_char.x-shooting.x;

        shooting.fadeAlpha = function () {
            shooting.alpha-=.1;
            shooting.x = george_char.x-shooting.offsetX;
            shooting.timer = setTimeout(shooting.fadeAlpha, 10);
        };

        //shooting.timer = setTimeout(shooting.fadeAlpha, 50);


        setTimeout(function () {
            clearTimeout(shooting.timer);
            world.removeChild(shooting);
        }, shooting.state.current.duration*1000);

        world.addChild(shooting);

        if(this.walking){ //get rid of gun setting stuck in shooting pose while walking
            this.sprite.skeleton.setSlotsToSetupPose();
        }

        //hittest zombies
        if(!MapManager.proceedToBoss && !MapManager.bossFight) {
            var to_hit = this.gunhit;

            //get zombies closest to char
            for (var i = 0; i < ZombiesManager.zombies.length; i++) {
                if (ZombiesManager.zombies[i].attacking && !ZombiesManager.zombies[i].dead && ZombiesManager.zombies[i].spawned &&
                    ((this.sprite.scale.x == 1 && this.x <= ZombiesManager.zombies[i].x ) || (this.sprite.scale.x == -1 && this.x >= ZombiesManager.zombies[i].x ))) {
                    to_hit--;
                    ZombiesManager.zombies[i].shot(this.gundmg);
                    if (to_hit == 0) break;
                }
            }

            //need to do old fashioned way
            while (to_hit > 0) {
                var closest = null;
                if (this.sprite.scale.x == 1) {//facing right
                    for (i = 0; i < ZombiesManager.zombies.length; i++) {
                        if (ZombiesManager.zombies[i].x >= this.x && !ZombiesManager.zombies[i].dead && ZombiesManager.zombies[i].spawned && Math.abs(this.y - ZombiesManager.zombies[i].y) < 40 &&
                            (closest == null || ZombiesManager.zombies[closest].x >= ZombiesManager.zombies[i].x)) {
                            closest = i;
                        }
                    }
                }

                if (this.sprite.scale.x == -1) {//facing left
                    for (i = 0; i < ZombiesManager.zombies.length; i++) {
                        if (ZombiesManager.zombies[i].x <= this.x && !ZombiesManager.zombies[i].dead && ZombiesManager.zombies[i].spawned && Math.abs(this.y - ZombiesManager.zombies[i].y) < 40 &&
                            (closest == null || ZombiesManager.zombies[closest].x <= ZombiesManager.zombies[i].x)) {
                            closest = i;
                        }
                    }
                }

                if (closest != null && Math.abs(ZombiesManager.zombies[closest].x - george_char.x) < this.gunrange) {
                    ZombiesManager.zombies[closest].shot(this.gundmg);
                }
                to_hit--;
            }
        }

        //hittest boss
        if(MapManager.hitler != null){//boss fight
            if(this.y-MapManager.hitler.y>=-80 && ((george_char.sprite.scale.x == 1 && this.x<MapManager.hitler.x) || (george_char.sprite.scale.x == -1 && this.x>MapManager.hitler.x))){
                GameSounds.playSound('metal');
                MapManager.hitler.damage(this.gundmgs[this.gun]);
            }
        }

    };
    
    this.melee = function () {
        this.walking = false;
        this.attacking = true;
        GameSounds.playSound('swing');
        id = Math.round(Math.random()*1+1);
        this.sprite.state.setAnimationByName("Melee"+id, false);
        var that = this;
        setTimeout(function(){that.attackDone()}, this.sprite.state.current.duration*1000);

        //hit test
        var contactMade = false;
        for(i = 0;i<ZombiesManager.zombies.length;i++){
            if(ZombiesManager.zombies[i].dead)continue;
            if(this.sprite.scale.x == -1){//facing left
                if(ZombiesManager.zombies[i].x<this.x && Math.abs(this.x-ZombiesManager.zombies[i].x)<this.kbrange && Math.abs(this.y -ZombiesManager.zombies[i].y) < 40){
                    ZombiesManager.zombies[i].knockback();
                    contactMade = true;
                }
            }else if(this.sprite.scale.x == 1){//facing right
                if(ZombiesManager.zombies[i].x>=this.x && Math.abs(this.x-ZombiesManager.zombies[i].x)<this.kbrange && Math.abs(this.y -ZombiesManager.zombies[i].y) < 40){
                    ZombiesManager.zombies[i].knockback();
                    contactMade = true;
                }
            }
        }

        if(contactMade){
            //play melee hit sound
            GameSounds.playSound('punch');
        }
    }
    
    this.setGun = function (gun) {
        if(gun == 0){
            this.sprite.skeleton.setSkinByName("Gun");
        }else if(gun == 1){//machine gun
            this.sprite.skeleton.setSkinByName("MGun");
        }else if(gun == 2){//shotty
            this.sprite.skeleton.setSkinByName("SGun");//place holder
        }

        this.gunrange = this.gunranges[this.gun];
        this.gunhit = this.gunhits[this.gun];
        this.gundmg = this.gundmgs[this.gun];
        this.shootDelay = this.shootDelays[this.gun];

        this.gun = gun;
        UIManager.updateGun();

        this.sprite.skeleton.setSlotsToSetupPose();
    };
    
    this.revive = function () {
        GameSounds.playSound("respawn");
        this.sprite.state.setAnimationByName("Respawn", false);
        this.health = this.maxHealth;
        this.attacking = false;

        //animate light beam
        var beam = new PIXI.Spine("data/effects.json");
        beam.state.setAnimationByName("Lightbeam");

        beam.x = george_char.x;
        beam.y = george_char.y;

        world.addChild(beam);

        //knockback
        for(var i = 0;i<ZombiesManager.zombies.length;i++){
            if(!ZombiesManager.zombies[i].dead && ZombiesManager.zombies[i].spawned){
                ZombiesManager.zombies[i].knockback();
            }
        }

        setTimeout(function () {
            george_char.dead = false;
        }, beam.state.current.duration*1000);
    };
    
    this.hit = function (dmg) {
        if(this.dead || GameManager.debugMode)return;
        this.health-=dmg;
        if(this.pulseAlpha)return;
        this.pulseAlpha = true;

        var that = this;
        setTimeout(function () {
            that.pulseAlpha = false;
            that.sprite.alpha = 1;
        }, this.invulnTimer);

        if(this.health<=0){
            //dead
            this.health = 0;
            this.dead = true;
            this.sprite.state.setAnimationByName("Death", false);
            GameSounds.playSound("gw_die");

            setTimeout(function(){george_char.revive();}, 1000);
        }
        if(this.yAccel<0)this.yAccel = 0;
        if(!this.jumpFreeze){
            this.jumpFreeze = true;

            var that = this;
            setTimeout(function(){that.jumpFreeze = false;}, 300);//can jump in half a second
            setTimeout(function(){that.jumpFreeze = false;}, 300);//can jump in half a second
        }
    };
    this.attackDone = function() {
        if(this.dead)return;
        this.attacking = false;
        if (!this.walking) {
            this.sprite.state.setAnimationByName("Idle", true);
        }
    };

    this.setGun(this.gun);
}

Zombie.prototype = new base_char();
Zombie.prototype.constructor = Zombie;

function Zombie(type){
    this.health = 10;
    this.spawned = false;
    this.offsetX = Math.random()*10+25;
    this.maxSpeed = Math.round(Math.random()*2+1);
    this.attacking = false;
    this.stoppingAttack = false;
    this.dead = false;
    this.attackRange = 30;
    this.attackSpeed = 500;
    this.recoil = false;
    this.speedX = 0;
    this.walking = false;
    this.damage = 2;
    this.type = type;
    this.toX = 0;
    this.mobbingRange = Math.round(Math.random()*30+80);

    if(this.type == 2){//no helmet zombie
        this.maxSpeed = Math.round(Math.random()*5+3);
        this.damage = 1;
        this.health = 5;
    }
    
    this.setMask = function (val) {
        if (val) {
            //set up mask
            var thing = new PIXI.Graphics();

            thing.lineStyle(1);
            thing.beginFill(0x0, 1);
            thing.moveTo(-50, 0);
            thing.lineTo(50, 0);
            thing.lineTo(50, -130);
            thing.lineTo(-50, -130);
            thing.endFill();

            this.sprite.mask = thing;

            world.addChild(thing);
            thing.x = this.sprite.x;
            thing.y = this.sprite.y;
        }else{
            world.removeChild(this.sprite.mask);
            this.sprite.mask = null;
        }
    };
    
    this.updateMask = function () {
        this.sprite.mask.y = this.y;
    };
    
    this.shot = function (dmg) {
        if(this.dead)return;
        this.health-=dmg;

        if(george_char.gun == 2){
            this.x+=this.sprite.scale.x*30;
        }

        //add blood particle effect
        var blood = new PIXI.Spine("data/effects.json");

        blood.state.setAnimationByName("Blood");

        blood.scale.x = -george_char.sprite.scale.x;
        blood.x = this.x+Math.random()*5-10 + george_char.sprite.scale.x*10;
        blood.y = this.y-30+Math.random()*5;


        setTimeout(function () {

            MapManager.layer1.removeChild(blood);
        }, blood.state.current.duration*20000);

        MapManager.layer1.addChild(blood);

        if(this.health<=0){
            //dead
            george_char.expGain(2);
            if(george_char.gun == 2){
                this.die(2);
            }else this.die();
        }else{//shot
            this.sprite.state.setAnimationByName("Shot", false);
            this.sprite.state.addAnimationByName("Walking", true);
            this.sprite.skeleton.setBonesToSetupPose();
            this.attacking = false;
            if(this.hitTestID != -1){//clear hit test interval to block attacking
                clearTimeout(this.hitTestID);
            }
            this.recoil = true;
            this.speedX = 0;

            var that = this;
            setTimeout(function () {
                that.recoil = false;
                that.sprite.skeleton.setSlotsToSetupPose();
            },this.sprite.state.current.duration*1000);
        }
    };

    this.setSprite = function(loc, skin){ //override base_char
        this.sprite = new PIXI.Spine(loc);
        this.sprite.skeleton.setSkinByName(skin);
        this.sprite.state.setAnimationByName("Spawn", false);//change this to spawn
        this.sprite.state.addAnimationByName("Walking", true, 0);
        this.sprite.skeleton.setSlotsToSetupPose();

        var that = this;
        setTimeout(function(){//done spawning
            that.spawned = true;
            that.setMask(false);
        }, this.sprite.state.current.duration*1000);
    };
    this.setSprite("data/nazi.json", "Z"+type);

    this.stopAttack = function(){
        if(this.dead)return;
        this.stoppingAttack = false;
        this.attacking = false;
        this.sprite.state.setAnimationByName("Walking", true);
    };

    this.die = function(id){
        if(this.dead) return; //can't die twice!
        //gotta remove from charlist

        if(!this.recoil){
            this.speedX = 0;
        }

        ZombiesManager.numZombies--;

        id = (id == null)?Math.round(Math.random()+1):id;//1 to 2 if not given


        this.dead = true;

        this.sprite.state.setAnimationByName("Death"+id, false);
        this.sprite.skeleton.setBonesToSetupPose();
        this.sprite.skeleton.setSlotsToSetupPose();
        var that = this;

        setTimeout(function(){
            that.fadeBody(that);
        }, (GameManager.mobile)?3000: 15000);
    };

    this.fadeBody = function(ref){
        var index = PlatformManager.charList.indexOf(ref);
        if(index != -1){
            PlatformManager.charList.splice(index, 1);
        }else{
            console.log("Zombie not found in char list!");
        }

        ref.step = function(){
            ref.sprite.alpha-=.1;
            if(ref.sprite.alpha<=0){
                ZombiesManager.removeZombie(ref);
                world.removeChild(ref.sprite);
            }
        }
    };

    this.hitTestID = -1;
    this.hitTestChar = function () {
        this.hitTestID = -1;
        if(!this.attacking || this.dead)return;
        if(george_char.x-this.x < this.attackRange && Math.abs(george_char.y-this.y)<40){
            george_char.hit(this.damage);
        }

        var that = this;
        this.hitTestID = setTimeout(function () {
            that.hitTestChar();
        }, this.attackSpeed);
    };
    
    this.knockback = function () {
        if(!this.dead) {
            this.sprite.state.setAnimationByName("Knockback", false);
            this.sprite.state.addAnimationByName("Walking", true);
        }

        this.attacking = false;
        this.recoil = true;
        if(this.hitTestID != -1){//clear hit test interval
            clearTimeout(this.hitTestID);
        }
        this.speedX = this.sprite.scale.x*george_char.recoilSpeed;
        this.walking = false;

        if(!george_char.dead) {
            george_char.expGain();
            this.health -= Math.random() * 5 + george_char.kbDmg;
            //attach
            //add blood particle effect
            var blood = new PIXI.Spine("data/effects.json");

            blood.state.setAnimationByName("Blood");

            blood.scale.x = -george_char.sprite.scale.x;
            blood.x = this.x+Math.random()*5-10;
            blood.y = this.y-30+Math.random()*5;

            if(blood.scale.x == -1){//facing right so move blood right
                blood.x+=45;
            }else{
                blood.x-=45;
            }

            setTimeout(function () {
                MapManager.layer1.removeChild(blood);
             }, blood.state.current.duration*1000);

            MapManager.layer1.addChild(blood);
        }

        if(this.health<=0){
            this.die(2);
        }

        var that = this;
        setTimeout(function () {
            that.recoil = false;
        },120);
    };

    this.step = function(){ //zombie AI
        if(!this.dead) {
            if (!george_char.dead && !this.recoil && !this.attacking && this.x < george_char.x && this.x + this.offsetX < george_char.x) {//need to move right
                this.walking = true;
                if (this.speedX < this.maxSpeed)this.speedX++;
                this.sprite.scale.x = -1;
            } else if (!george_char.dead && !this.recoil && !this.attacking && this.x > george_char.x && this.x - this.offsetX > george_char.x) {//need to move left
                if (this.speedX > -this.maxSpeed)this.speedX--;
                this.walking = true;
                this.sprite.scale.x = 1;
            } else if (!this.recoil && !this.attacking && !george_char.dead) {//Attack! Check to see if char is within range
                if (Math.abs(george_char.y - this.y) < 80) {
                    this.walking = false;
                    this.attacking = true;
                    this.sprite.state.setAnimationByName("PreAttack", false);
                    this.sprite.state.addAnimationByName("Attack", true, 0);

                    var that = this;
                    this.hitTestID = setTimeout(function () {
                        that.hitTestChar();
                    }, this.sprite.state.current.duration * 1000);
                } else {//character is above or below zombie
                    this.speedX = -this.sprite.scale.x;
                    this.walking = true;
                }
            } else if (this.attacking && !this.stoppingAttack && (Math.abs(this.x - george_char.x) > this.offsetX || george_char.dead)) {//character has moved too far
                var that = this;
                this.stoppingAttack = true;
                if (this.hitTestID != -1) {
                    clearTimeout(this.hitTestID);
                    this.hitTestID = -1;
                }
                setTimeout(function () {
                    (that.stopAttack())
                }, 500 + Math.random() * 700);
            } else if (this.attacking) {
                this.sprite.scale.x = (george_char.x < this.x) ? 1 : -1;//set direction while attacking
            } else if (!this.recoil && george_char.dead && ( (this.speedX > 0 && this.x > george_char.x + this.mobbingRange || this.speedX < 0 && this.x < george_char.x - this.mobbingRange) || this.speedX == 0)) {//mobbing
                //mobbing when dead
                this.walking = true;
                if (george_char.x < this.x) {
                    this.speedX = -this.maxSpeed;
                    this.sprite.scale.x = 1;
                } else {
                    this.speedX = this.maxSpeed;
                    this.sprite.scale.x = -1;
                }
            }
        }

        if(!this.walking && this.speedX != 0 && !this.recoil){
            this.speedX-=Math.abs(this.speedX)/this.speedX;
        }

        this.x += this.speedX;//walk right
    }
}

Boss.prototype = new base_char();
Boss.prototype.constructor = Boss;

function Boss(){
    this.health = 5000;//5000
    this.setSprite("data/RoboHitler.json");
    this.sprite.skeleton.setSkinByName("Normal");
    this.sprite.skeleton.setSlotsToSetupPose();
    this.attacking = false;
    this.state = 0;//0= idle, 1 = moving, 2 = aggressive
    this.stateTimer = -1;
    this.nextAttackID = -1;
    this.toX = 0;
    this.speed = 3;
    this.dead = false;
    this.hitTimerID = -1;
    this.followFor = 0;
    this.punchDamage = 10;

    this.step = function () {//AI
        if(this.dead)return;

        if(this.x<george_char.x){
            this.sprite.scale.x= -1;
        }else{
            this.sprite.scale.x= 1;
        }
        if(this.followFor>0){
            this.followFor--;
            //follow
            if(this.x<george_char.x-50){
                this.x+=this.speed;

            }
            if(this.x>george_char.x+50){
                this.x-=this.speed;
            }
        }else if(Math.random()<.3){
            this.followFor = Math.round(Math.random()*60+30);//.5-1.5 seconds
        }
        if(!this.attacking && this.followFor <= 0){
            this.attacking = true;
            this.punch();
        }
    };

    
    this.idle = function () {
        if(this.attacking)return;
        this.sprite.state.setAnimationByName("Idle");
    };

    this.hitTestPunch = function () {
        if(Math.abs(this.x-george_char.x)<200 && Math.abs(this.y-george_char.y)<180){
            george_char.hit(this.punchDamage);
            george_char.speedX = -this.sprite.scale.x*10;//knockback
        }
    };
    
    this.punch = function () {
        this.sprite.state.setAnimationByName("Hit1");

        var that = this;

        setTimeout(function(){
            that.hitTestPunch();
        }, 400);

        setTimeout(function () {
            that.attacking = false;
            that.idle();
        }, this.sprite.state.current.duration*1000);
    };
    
    this.shoot = function () {
        this.sprite.state.setAnimationByName("Hit2");

        var ball = new PIXI.Sprite.fromFrame("HitBall.png");
        ball.x = this.x;
        ball.y = this.y;

        if(this.sprite.scale.x == 1){//left
            ball.speedX = -20;
        }else{//right
            ball.speedX = 20;
        }

        console.log("ball");

        ball.step = function () {
            this.x+=this.speedX;

            var that = this;
            ball.timer = setTimeout(function(){that.step()}, 30);
        };

        ball.timer = setTimeout(function(){ball.step()}, 30);

        world.addChild(ball);


        var that = this;
        setTimeout(function () {
            that.attacking = false;
            that.idle();
        }, this.sprite.state.current.duration*1000);
    };

    this.die = function () {
        if(this.dead)return;
        if(this.stateTimer != -1){
            clearTimeout(this.stateTimer);
            this.stateTimer = -1;
        }
        this.attacking = false;
        this.dead = true;
        this.sprite.state.clearAnimation();
        this.sprite.state.setAnimationByName("Death", false);
    };

    this.damage = function (amount) {
        if(this.dead)return;
        return;//lolool
        console.log(this.health, amount);
        this.health-=amount;

        if(this.health<=0){
            this.health = 0;
            this.die();
            return;
        }

        return;
        if(this.hitTimerID != -1)return;//mustache already red

        this.sprite.skeleton.setSkinByName("Hit");
        this.sprite.skeleton.setSlotsToSetupPose();


        if(this.hitTimerID != -1){
            clearTimeout(this.hitTimerID);
        }

        var that = this;

        this.hitTimerID = setTimeout(function () {
            that.setSprite("data/RoboHitler.json");
            that.sprite.skeleton.setSkinByName("Normal");
            that.hitTimerID = -1;
        }, 500);


    }

}