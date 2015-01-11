PlatformManager = {};
ZombiesManager = {};
MapManager = {};
UIManager = {};
GameSounds = {};

GameManager = {};
GameManager.stage1 = {};
GameManager.debugMode = false;

GameManager.toggleDebug = function () {
    GameManager.debugMode = !GameManager.debugMode;

    if (GameManager.debugMode) {
        stage.addChild(fps_txt);
        george_char.acc = 6;
        george_char.maxSpeed = 30;
        george_char.jumpHeight = -24;
        MapManager.randomLength = 4000;//30000
        MapManager.bridgeFinaleLength = 1000;
        GameSounds.muteThemeSong = true;
    } else {
        GameSounds.muteThemeSong = false;
        stage.removeChild(fps_txt);
    }
}

GameManager.beginGame1 = function(){
    PlatformManager.reset();
    george_char = new George(100);

    george_char.x = 300;
    george_char.y = 300;

    ZombiesManager.reset();
    MapManager.reset();

    PlatformManager.addPlatform(-999, 99999, 402);
    UIManager.createUI();

    george_char.addToWorld();

    world.x = -1;
    stage.addChild(world);
    stage.swapChildren(MapManager.layer0, world);

    //add fps text
    fps_txt = new PIXI.Text("FPS: x", {font:"12px Arial", fill:"white"});

    GameManager.toggleDebug();
    requestAnimFrame(GameManager.stage1.step);
}

GameManager.stage1.step = function () {
    var thisLoop = new Date;
    var fps = Math.round(1000 / (thisLoop - lastLoop));

    lastLoop = thisLoop;
    fps_txt.setText("FPS: "+fps);

    GameManager.stage1.simulateGravity();
    GameManager.stage1.handleChar();
    ZombiesManager.handleZombies();
    MapManager.step();
    UIManager.step();

    //Handle "Camera" coordinates
    var cameraX = -(george_char.leftLimit+300)+stageWidth/2;

    if(MapManager.proceedToBoss) {
        cameraX = -(george_char.x + 300) + stageWidth / 2;
    }else if(MapManager.focusRight){
        cameraX = -(george_char.x + 150) + stageWidth / 2;
    } else if(MapManager.bossFight){
        var cameraX = -(george_char.x)+stageWidth/2;

        if(cameraX>MapManager.cameraLeftX) cameraX = MapManager.cameraLeftX;
        if(cameraX<MapManager.cameraRightX) cameraX = MapManager.cameraRightX;
        //if(cameraX>-7854)cameraX = -7854;
        //if(cameraX<-9400)cameraX = -9400;
    }
    if(cameraX>0) cameraX = 0;

    world.x+=Math.round((cameraX-world.x)/15);
    world.y = (world.y + (MapManager.cameraY-world.y)/15);

    //simulate shaking------------------
    if(MapManager.shakeMagnitude != 0) {
        var shakeX = Math.random() * MapManager.shakeMagnitude * 2 - MapManager.shakeMagnitude;
        var shakeY = Math.random() * MapManager.shakeMagnitude;
        world.x += shakeX;
        world.y += shakeY;

        MapManager.layer0.x += shakeX;
        MapManager.layer2.x += shakeX;
        MapManager.layer3.x += shakeX;
        MapManager.layer4.x += shakeX;
        MapManager.layer5.x += shakeX;
    }

    //keep layers attached b/c of shaking
    MapManager.layer0.y = world.y;

    if(!MapManager.onElevator && !MapManager.bossFight) {
        MapManager.layer2.y = world.y;
    }else{
        MapManager.layer2.y = world.y + 850;
    }

    MapManager.layer3.y = world.y;
    MapManager.layer4.y = world.y;
    MapManager.layer5.y = world.y;

    //-----------------------------------

    //could add y dimension too (maybe taller maps somewhere along the point?

    requestAnimFrame(GameManager.stage1.step);
    //setTimeout(animate, 200);//30 fps


    renderer.render(stage);
}

GameManager.stage1.handleChar = function () {
    george_char.step();
}

GameManager.stage1.simulateGravity = function () {
    if(PlatformManager.freeze)return;
    for(i = 0;i<PlatformManager.charList.length;i++){
        //Acceleration
        PlatformManager.charList[i].y+=PlatformManager.charList[i].yAccel;
        PlatformManager.charList[i].yAccel+=PlatformManager.charList[i].g;
        PlatformManager.charList[i].onPlatform = false;

        //platform collision detection
        for(j = 0;j<PlatformManager.platforms.length;j++){
            if(PlatformManager.charList[i].x>=PlatformManager.platforms[j].x1 && PlatformManager.charList[i].x<=PlatformManager.platforms[j].x2
                && PlatformManager.charList[i].y<=PlatformManager.platforms[j].y &&
                PlatformManager.charList[i].y + PlatformManager.charList[i].yAccel >=PlatformManager.platforms[j].y){
                PlatformManager.charList[i].yAccel = 0;
                PlatformManager.charList[i].y = PlatformManager.platforms[j].y;
                PlatformManager.charList[i].onPlatform = true;
            }
        }
    }
}


ZombiesManager.handleZombies = function () {
    var zombie;

    for(i=0;i<ZombiesManager.zombies.length;i++){
        zombie = ZombiesManager.zombies[i];

        if(zombie.spawned){
            zombie.step();
        }else{
            zombie.updateMask();
        }
    }
}

ZombiesManager.createZombieAt = function (_x, _y, type) {
    var zombie;
    if(george_char.x>10000) {
        zombieType = (type == null) ? Math.round(Math.random() * 1 + 1) : type;
    }else{
        zombieType = 1;
    }
    zombie = new Zombie(zombieType);

    zombie.x = _x;
    zombie.y = _y;
    zombie.setMask(true);

    ZombiesManager.zombies.push(zombie);
    zombie.addToWorld();
}

ZombiesManager.manageZombies = function(){
    ZombiesManager.currentTimerID = setTimeout(function(){ZombiesManager.manageZombies()}, ZombiesManager.checkTime);

    var numToAdd = Math.round(Math.random()*8);
    var platform;
    var zombieX;

    if(PlatformManager.platforms == 0)return;//safety

    for(i=0;i<ZombiesManager.zombies.length;i++){
        if(ZombiesManager.zombies[i].x < george_char.x  -stageWidth/2 - 100){//kill trailing zombies, sorry bros
            ZombiesManager.zombies[i].die();
        }
    }


    if(ZombiesManager.numZombies >= ZombiesManager.maxZombies)return;


    for(i=0;i<numToAdd;i++){
        randPlat = Math.round(Math.random()*(PlatformManager.platforms.length-1));

        platform = PlatformManager.platforms[randPlat];


        if(platform.x2-platform.x1>1000) {//ground
            if(Math.random()<.5) {//spawn around GW
                zombieX = george_char.x;
                while (Math.abs(zombieX - george_char.x) < 20) {//leave 20 radius
                    zombieX = Math.round(george_char.x + Math.random() * 300 - 150);
                }
            }else{//spawn ahead
                zombieX = george_char.x+Math.random()*100+300;
            }
        }else{
            zombieX = Math.round(Math.random()*((platform.x2+5)-(platform.x1-5))+platform.x1);
        }

        ZombiesManager.numZombies++;
        ZombiesManager.createZombieAt(zombieX , platform.y);
    }
}

ZombiesManager.removeZombie = function(zombie){
    var index = ZombiesManager.zombies.indexOf(zombie);
    if(index != -1){
        ZombiesManager.zombies.splice(index, 1);
    }else{
        console.log("Zombie not found!");
    }
}

ZombiesManager.reset = function(){
    this.zombies = [];
    this.maxZombies = 10*1;//10
    this.checkTime = 500;
    this.numZombies = 0;
    this.currentTimerID = setTimeout(this.manageZombies, this.checkTime );
};

PlatformManager.reset = function(){
    PlatformManager.platforms = [];
    PlatformManager.charList = [];
    PlatformManager.freeze = false;
}

PlatformManager.addPlatform = function(x1, x2, y){
    PlatformManager.platforms.push(new platform(x1, x2, y));
};

MapManager.addToMap = function(item){
    MapManager.layer1.addChild(item);
}

MapManager.buildLayer0 = function (posX) {
    var grass = PIXI.Sprite.fromFrame("FrontGrass.png");

    grass.y = stageHeight-grass.height+20;
    grass.x = posX;

    MapManager.layer0.addChild(grass);
}

MapManager.buildLayer1 = function(posX){
    var ground = PIXI.Sprite.fromFrame("Ground.png");

    ground.y = stageHeight-ground.height;
    ground.x = posX;

    //add platforms
    for(var i =0;i<1;i++){
        var id = Math.round(Math.random()*4+1);
        var platform_spr = PIXI.Sprite.fromFrame("Floating"+id+".png");

        platform_spr.x = Math.round(posX + Math.random()*800);
        platform_spr.y = Math.round(Math.random()*100+200);

        if(id == 1) {
            PlatformManager.addPlatform(platform_spr.x-5, platform_spr.x + 255, platform_spr.y+20);
        }else if(id == 2){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+150, platform_spr.y+10);
        }else if(id == 3){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+150, platform_spr.y+10);
        }else if(id == 4){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+60, platform_spr.y+10);
        }else if(id == 5){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+140, platform_spr.y+45);
        }

        MapManager.addToMap(platform_spr);
    }

    MapManager.addToMap(ground);

}

MapManager.buildLayer2 = function (posX) {
    var hill = PIXI.Sprite.fromFrame("Backhill.png");

    hill.x = posX;
    hill.y = stageHeight-hill.height-40;

    MapManager.layer2.addChild(hill);
}

MapManager.buildLayer3 = function (posX) {
    var hill = PIXI.Sprite.fromFrame("Backhill2.png");

    hill.x = posX+Math.random()*200;
    hill.y = stageHeight-hill.height-10;

    MapManager.layer3.addChild(hill);
}

MapManager.buildLayer4 = function (posX) {
    var hill = PIXI.Sprite.fromFrame("Backhill3.png");

    hill.x = posX+Math.random()*200;
    hill.y = stageHeight-hill.height+30;

    MapManager.layer4.addChild(hill);
};

MapManager.buildFinale = function(posX) {
    if(MapManager.finale)return;
    MapManager.beginLayer0Fade();
    MapManager.finale = true;

    for (var i = 0; i < 3; i++) {
        var ground = PIXI.Sprite.fromFrame("Ground.png");

        ground.y = stageHeight - ground.height;
        ground.x = posX;//increment
        posX+=800;
        MapManager.addToMap(ground);
    }

    var bridge = new PIXI.Sprite.fromFrame("Bridge.png");

    bridge.x = posX-2;
    bridge.y = stageHeight-88;

    //add platforms
    /*for(var i =0;i<2;i++){
        var id = Math.round(Math.random()*4+1);
        var platform_spr = PIXI.Sprite.fromFrame("Floating"+id+".png");

        platform_spr.x = Math.round(posX + Math.random()*1000);
        platform_spr.y = Math.round(Math.random()*100+200);

        if(id == 1) {
            PlatformManager.addPlatform(platform_spr.x-5, platform_spr.x + 255, platform_spr.y+20);
        }else if(id == 2){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+150, platform_spr.y+10);
        }else if(id == 3){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+150, platform_spr.y+10);
        }else if(id == 4){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+60, platform_spr.y+10);
        }else if(id == 5){
            PlatformManager.addPlatform(platform_spr.x, platform_spr.x+140, platform_spr.y+45);
        }

        MapManager.addToMap(platform_spr);
    }*/

    posX+=800;

    for (i = 0; i < 2; i++) {
        var ground = PIXI.Sprite.fromFrame("Ground.png");

        ground.y = stageHeight - ground.height;
        ground.x = posX;//increment
        posX+=800;
        MapManager.addToMap(ground);
    }

    //add rail
    var rail = new PIXI.Sprite.fromFrame("Rail.png");

    rail.x = posX-190;
    rail.y = stageHeight-60;//-42

    MapManager.addToMap(rail);

    var leveler = new PIXI.Sprite.fromFrame("Leveler.png");

    leveler.x = posX +8;
    leveler.y = stageHeight-121;

    MapManager.elevator = leveler;

    MapManager.proccessedX = posX;

    //for elevator
    //george_char.rightLimit = MapManager.proccessedX+150;
    george_char.rightLimit = MapManager.proccessedX-1700;

    //make boss arena
    for (var i = 0; i < 3; i++) {
        var ground = PIXI.Sprite.fromFrame("Ground.png");

        ground.y = 1392;
        ground.x = posX;//increment
        posX+=800;
        MapManager.addToMap(ground);
    }

    MapManager.addToMap(leveler);//elevator

    var right_wall = new PIXI.Sprite.fromFrame("Rail.png");
    right_wall.x = rail.x+2130;
    right_wall.y = rail.y;

    MapManager.addToMap(right_wall);

    world.setChildIndex(MapManager.layer1, world.children.length -1);
    MapManager.addToMap(bridge);
};

MapManager.fadeLayer0 = function () {
    MapManager.layer0.alpha -= .1;
    if (MapManager.layer0.alpha <= 0) {
        MapManager.layer0.alpha = 1;
        MapManager.layer0.visible = false;
    } else {//keep on fading
        setTimeout(MapManager.fadeLayer0, 100);
    }
};

MapManager.beginLayer0Fade = function () {
    MapManager.fadeLayer0();
};

MapManager.startFinale = function(){//on bridge
    ZombiesManager.maxZombies = 100;
    ZombiesManager.checkTime = 250;//every half second
};

MapManager.manageMap = function() {//called every so often to build the map ahead


    if (MapManager.proccessedX < george_char.x && !MapManager.finale) {//extend ground
        for (var i = 0; i < 3; i++) {//build 3 chunks
            MapManager.proccessedX += 800;
            if (MapManager.proccessedX < MapManager.randomLength) {
                MapManager.buildLayer1(MapManager.proccessedX);
            } else {
                MapManager.startFinale();
                MapManager.buildFinale(MapManager.proccessedX);
                break;
            }
        }

    }

    if (Math.abs(MapManager.layer0.x - stageWidth - 200) > MapManager.processed0X) {
        for (var i = 0; i < 3; i++) {
            MapManager.processed0X += 799;
            MapManager.buildLayer0(MapManager.processed0X);
        }
    }


    if (Math.abs(MapManager.layer2.x - stageWidth - 200) > MapManager.processed2X) {
        for (var i = 0; i < 3; i++) {
            MapManager.processed2X += 913;
            MapManager.buildLayer2(MapManager.processed2X);
        }
    }

    if (Math.abs(MapManager.layer3.x - stageWidth - 200) > MapManager.processed3X) {

        for (var i = 0; i < 3; i++) {
            MapManager.processed3X += 464;
            MapManager.buildLayer3(MapManager.processed3X);
        }
    }

    if (Math.abs(MapManager.layer4.x - stageWidth - 200) > MapManager.processed4X) {

        for (var i = 0; i < 3; i++) {
            MapManager.processed4X += 350;
            MapManager.buildLayer4(MapManager.processed4X);
        }
    }
    setTimeout(MapManager.manageMap, MapManager.manageTime);


    if (!MapManager.bossFight) {
        for (var i = 0; i < MapManager.layer0.children.length; i++) {//this works right
            if (MapManager.layer0.children[i].x <= george_char.x - 2000) {
                //gotta remove stuff
                MapManager.layer0.removeChild(MapManager.layer0.children[i]);//removeChildat(i)?
            }
        }

        for (var i = 0; i < MapManager.layer1.children.length; i++) {//this works correctly b/c no parallax
            if (MapManager.layer1.children[i].x <= george_char.x - 2000) {
                //gotta remove stuff
                MapManager.layer1.removeChild(MapManager.layer1.children[i]);
            }
        }

        for (var i = 0; i < MapManager.layer2.children.length; i++) {
            if (MapManager.layer2.children[i].x - MapManager.layer2.x - world.x <= george_char.x - 2000) {
                //gotta remove stuff
                MapManager.layer2.removeChild(MapManager.layer2.children[i]);
            }
        }

        for (var i = 0; i < MapManager.layer3.children.length; i++) {
            if (MapManager.layer3.children[i].x - MapManager.layer3.x - world.x <= george_char.x - 2000) {
                //gotta remove stuff
                MapManager.layer3.removeChild(MapManager.layer3.children[i]);
            }
        }

        for (var i = 0; i < MapManager.layer4.children.length; i++) {
            if (MapManager.layer4.children[i].x - MapManager.layer4.x - world.x <= george_char.x - 2000) {
                //gotta remove stuff
                MapManager.layer4.removeChild(MapManager.layer4.children[i]);
            }
        }

        for (i = 0; i < PlatformManager.platforms.length; i++) {
            if (PlatformManager.platforms[i].x2 < george_char.x - 400) {
                PlatformManager.platforms.splice(i, 1);
                i--;//check new i platform
            }
        }
    }
}

MapManager.stopBridgeFinale = function () {
    ZombiesManager.maxZombies = 0;
    MapManager.proceedToBoss = true;

}

MapManager.fadeInPrepForElevator = function (){ //fades layer3 and 4
    MapManager.layer2.alpha -= .1;//3, 4
    MapManager.layer3.alpha -= .1;//3, 4
    MapManager.layer4.alpha -= .1;//3, 4
    if (MapManager.layer3.alpha <= 0) {
        MapManager.layer2.alpha = 1;
        MapManager.layer2.visible = false;
        MapManager.layer3.alpha = 1;
        MapManager.layer3.visible = false;
        MapManager.layer4.alpha = 1;
        MapManager.layer4.visible = false;
    } else {//keep on fading
        setTimeout(MapManager.fadeInPrepForElevator, 100);
    }
}

MapManager.spawnBoss = function () {//called when elevator stops
    MapManager.hitler = new Boss();

    george_char.doubleJump = true;

    MapManager.hitler.x = george_char.x+800;
    MapManager.hitler.y = george_char.y;

    MapManager.hitler.addToWorld();
    UIManager.createBossBar();
}

MapManager.elevatorRide = function () {//begin elevator ride
    while(MapManager.layer2.children.length>0){
        MapManager.layer2.removeChildAt(0);
    }

    MapManager.layer2.visible = true;//layer2 is where the bg for the boss fight is

    //build bg
    PlatformManager.platforms = [];//erase all platforms
    PlatformManager.addPlatform(7000, 99999,1402);//create boss platforms

    for(i =0;i<2;i++) {//2
        var sprite = PIXI.Sprite.fromFrame("Trees.png")

        //sprite.x = george_char.x-400;
        //sprite.y = george_char.y-200;

        sprite.x = MapManager.processed2X - 1150 + i*1022;//-1000
        sprite.y = george_char.y + 30;

        MapManager.layer2.addChild(sprite);
    }
        //world.addChild(sprite);
    //world.setChildIndex(sprite, 1);

    //MapManager.layer2.addChild(sprite);
    setTimeout(MapManager.elevatorStep, 30);
}

MapManager.elevatorStep = function () {

    if(george_char.y>1400){//elevator land
        MapManager.bossFight = true;
        MapManager.onElevator = false;
        george_char.acc = 2;//move again
        george_char.y = 1400;
        PlatformManager.freeze = false;

        george_char.leftLimit = george_char.x - 130;
        george_char.rightLimit = george_char.leftLimit+1880;
        MapManager.cameraLeftX = -(george_char.x-296);
        MapManager.cameraRightX = -(george_char.x+1250);

        MapManager.focusRight = false;
        MapManager.spawnBoss();
        return;
    }
    MapManager.cameraY-=10; //world.y-=10;
    george_char.y+=10;
    PlatformManager.freeze = true;
    if(MapManager.elevator != null){
        MapManager.elevator.y+=10;
    }

    setTimeout(MapManager.elevatorStep, 30);
}

MapManager.step = function(){
    if(MapManager.finale){
        world.setChildIndex(MapManager.layer1, world.children.length -1);
    }
    if(MapManager.onElevator){
        MapManager.layer2.y-=2;
        if(MapManager.layer2.y<=-150) MapManager.layer2.y = -150;
    }

    if(!MapManager.bossFight) {
        MapManager.layer0.x = world.x * 1.3;
        MapManager.layer2.x = world.x / 2;
        MapManager.layer3.x = world.x / 3;
        MapManager.layer4.x = world.x / 4;
        MapManager.layer5.x = world.x / 100;
    }else{
        MapManager.layer2.x = world.x / 2 ;
        MapManager.layer5.x = world.x / 100;
    }

    if(MapManager.finale && !MapManager.atBridge){
        if(george_char.rightLimit - george_char.x< 20){
            //end bridge scene
            MapManager.atBridge = true;
            MapManager.fadeInPrepForElevator();
            setTimeout(MapManager.stopBridgeFinale, MapManager.bridgeFinaleLength);//after 5 seconds
        }
    }
    if(MapManager.finale && MapManager.focusRight && !MapManager.onElevator){//finale over
        if(george_char.rightLimit - george_char.x< 20 && !george_char.inAir){//at elevator
            MapManager.elevatorRide();
            MapManager.onElevator = true;
            george_char.acc = 0;
        }
    }
    if(MapManager.proceedToBoss){
        for(var i = 0;i<ZombiesManager.zombies.length;i++){
            ZombiesManager.zombies[i].die();//kill leftover zombies
        }

        MapManager.proceedToBoss = false;
        george_char.rightLimit = MapManager.proccessedX+150;
        MapManager.focusRight = true;
    }
    if(MapManager.bossFight){//Map handling only during boss fight. Once goerge is off elevator
        MapManager.hitler.step();

    }

}

MapManager.shakeDone = function () {
    MapManager.shakeMagnitude = 0;
    MapManager.layer0.y = 0;
    MapManager.layer1.y = 0;
    if(!MapManager.bossFight && !MapManager.onElevator) {
        MapManager.layer2.y = 0;
    }
    MapManager.layer3.y = 0;
    MapManager.layer4.y = 0;
    MapManager.layer5.y =  0;
}

MapManager.shakeWorld = function (mag, dur) {
    if (MapManager.shakeMagnitude == 0) {
        MapManager.shakeMagnitude = mag;
        if(dur == null) dur = 500; //half a second default shake

        MapManager.currentTimerID = setTimeout(function () {//timer to disable shaking
            MapManager.shakeDone();
        }, dur)
    }
}

MapManager.reset = function(){//better name restart?
    MapManager.manageTime = 1000;//every 1 second
    MapManager.processed0X = -799;
    MapManager.proccessedX = -800;
    MapManager.processed2X = -464;
    MapManager.processed3X = -913;
    MapManager.processed4X = -350;
    MapManager.items = [];
    MapManager.layer0 = new PIXI.DisplayObjectContainer();//moves faster than ground
    MapManager.layer1 = new PIXI.DisplayObjectContainer();//ground
    MapManager.layer2 = new PIXI.DisplayObjectContainer();//backland+trees
    MapManager.layer3 = new PIXI.DisplayObjectContainer();//mountains
    MapManager.layer4 = new PIXI.DisplayObjectContainer();//third hill
    MapManager.layer5 = new PIXI.DisplayObjectContainer();//moon
    MapManager.clouds = [];
    MapManager.cloudSpeed = -.5;
    MapManager.charPadding = 300;
    MapManager.finale = false;
    MapManager.atBridge = false;
    MapManager.onElevator = false;
    MapManager.bridgeFinaleLength = 15000;//30 seconds
    MapManager.proceedToBoss = false;
    MapManager.focusRight = false;
    MapManager.elevator = null;
    MapManager.bossFight = false;
    MapManager.randomLength = 30000;//length in pixels of first stage
    MapManager.cameraLeftX = 0;
    MapManager.cameraRightX = 0;
    MapManager.hitler = null;
    MapManager.shakeMagnitude = 0;
    MapManager.cameraY = 0;

    //initialization
    var moon = PIXI.Sprite.fromFrame("Moon.png");
    moon.x = stageWidth-100;
    moon.y = 100;

    MapManager.sky = PIXI.Sprite.fromFrame("Sky.png");
    MapManager.sky.x = -1;

    MapManager.layer5.addChild(moon);

    MapManager.manageMap();
    stage.addChild(MapManager.sky);
    stage.addChild(MapManager.layer5);
    stage.addChild(MapManager.layer4);
    stage.addChild(MapManager.layer3);
    stage.addChild(MapManager.layer2);
    world.addChild(MapManager.layer1);
    stage.addChild(MapManager.layer0);

    var tut = new PIXI.Sprite.fromFrame("menu.png");

    tut.y = 45;

    MapManager.layer1.addChild(tut);
}

UIManager.updateGun = function () {
    if(this.expBar == null) return;
    if(this.expBar.gun != null){
        var current_gun = george_char.gun;
        this.expBar.removeChild(this.expBar.gun);
        this.expBar.gun = new PIXI.Sprite.fromFrame("MGun"+(current_gun+1)+".png");
        this.expBar.addChild(this.expBar.gun);

        this.expBar.id = current_gun;

        if(current_gun == 0){//pistol
            this.expBar.gun.x = 2;
            this.expBar.gun.y = 2;
        }else if(current_gun == 1){//machine gun
            this.expBar.gun.x = -18;
            this.expBar.gun.y = 2;
        }else if(current_gun == 2){//shotty
            this.expBar.gun.x = -35;
            this.expBar.gun.y = 2;
        }
    }

    for(var i = 0;i<6;i++){
        if(george_char.attLevels[george_char.gun] > i){
            this.expBar.stars[i].visible = true;
        }else{
            this.expBar.stars[i].visible = false;

        }
    }
}

UIManager.createUI = function () {
    this.UI = new PIXI.DisplayObjectContainer();

    //create health bar
    this.hpBar = new PIXI.DisplayObjectContainer();
    this.hpBar.heart = new PIXI.Sprite.fromFrame("HPFront.png");//heart
    this.hpBar.back = new PIXI.Sprite.fromFrame("HPBack.png");//hp bar outline
    this.hpBar.fill = new PIXI.Sprite.fromFrame("HPFill.png");//mask this
    this.hpBar.maskSprite = new PIXI.Graphics();

    this.hpBar.heart.x = this.hpBar.heart.y = 8;

    this.hpBar.back.x = 33;
    this.hpBar.back.y = 16;

    this.hpBar.fill.x = 37;
    this.hpBar.fill.y = 20;

    //set up rectangular mask
    this.hpBar.maskSprite.x = this.hpBar.fill.x;
    this.hpBar.maskSprite.y = this.hpBar.fill.y;
    this.hpBar.maskSprite.beginFill(0, 1);
    this.hpBar.maskSprite.moveTo(0, 0);
    this.hpBar.maskSprite.lineTo(102, 0);
    this.hpBar.maskSprite.lineTo(102, 18);
    this.hpBar.maskSprite.lineTo(0, 18);
    this.hpBar.maskSprite.endFill();

    this.hpBar.fill.mask = this.hpBar.maskSprite;
    this.hpBar.addChild(this.hpBar.back);
    this.hpBar.addChild(this.hpBar.fill);
    this.hpBar.addChild(this.hpBar.maskSprite);
    this.hpBar.addChild(this.hpBar.heart);
    this.UI.addChild(this.hpBar);

    //create experience bar (make it switch based on gun
    this.expBar = new PIXI.DisplayObjectContainer();
    this.expBar.id = 0;
    this.expBar.gunBar = new PIXI.Sprite.fromFrame("GunBG.png");
    this.expBar.fill = new PIXI.Sprite.fromFrame("GunFill.png");
    this.expBar.gun = new PIXI.Sprite.fromFrame("MGun1.png");
    this.expBar.maskSprite = new PIXI.Graphics();
    //this.expBar

    //build mask
    this.expBar.maskSprite.x = this.expBar.fill.x+33;
    this.expBar.maskSprite.y = this.expBar.fill.y+2;

    this.expBar.maskSprite.beginFill(0, 1);
    this.expBar.maskSprite.moveTo(0, 0);
    this.expBar.maskSprite.lineTo(66, 0);
    this.expBar.maskSprite.lineTo(66, 12);
    this.expBar.maskSprite.lineTo(0, 12);
    this.expBar.stars = [];

    //add stars
    for(var i = 0;i<6;i++){
        var no_star = PIXI.Sprite.fromFrame("GunNoStar.png");
        var star = PIXI.Sprite.fromFrame("GunStar.png");

        no_star.y = 18;
        no_star.x = 30+i*12;

        star.x = no_star.x;
        star.y = no_star.y;

        this.expBar.stars.push(star);

        this.expBar.addChild(no_star);
        this.expBar.addChild(star);
    }

    this.expBar.gunBar.x = 30;

    this.expBar.fill.x = 33;
    this.expBar.fill.y = 3;

    this.expBar.x = stageWidth - 105;
    this.expBar.y = 3;

    this.expBar.fill.mask = this.expBar.maskSprite;

    this.expBar.addChild(this.expBar.gunBar);
    this.expBar.addChild(this.expBar.fill);
    this.expBar.addChild(this.expBar.maskSprite);
    this.expBar.addChild(this.expBar.gun);

    this.updateGun();


    this.UI.addChild(this.expBar);

    stage.addChild(this.UI);
}

UIManager.step = function () {
    this.hpBar.maskSprite.scale.x = george_char.health/george_char.maxHealth;
    this.expBar.fill.scale.x = george_char.exp[george_char.gun]/george_char.levelup[george_char.gun];
}

UIManager.createBossBar = function () {
    return;
    this.bossBar = new PIXI.DisplayObjectContainer();
    this.bossBar.fill = new PIXI.Sprite.fromFrame("HitHPFill.png");
    this.bossBar.back = new PIXI.Sprite.fromFrame("HitHPBack.png");

    this.bossBar.addChild(this.bossBar.back);
    this.bossBar.addChild(this.bossBar.fill);

    this.bossBar.fill.x = 25;
    this.bossBar.fill.y = stageHeight-15;

    this.bossBar.back.x = 25;
    this.bossBar.back.y = stageHeight-20;

    stage.addChild(this.bossBar);
}

GameSounds.playSound = function (snd) {
    if(GameSounds.muted || GameSounds.forceMute)return;
    soundManager.play(snd);
}

GameSounds.init = function () {
    GameSounds.soundsLoaded = 0;
    GameSounds.forceMute = false; //if soundManager fails
    GameSounds.perc_loaded = 0;
    GameSounds.muted = false;
    GameSounds.muteThemeSong = false;
    GameSounds.sounds = [
        {id:'shotgun', url:'sound/SFX_Shotgun.ogg'},
        {id:'pistol', url:'sound/SFX_Gun.ogg'},
        {id: 'mg', url: 'sound/SFX_MGun.ogg'},
        {id: 'swing', url: 'sound/SFX_Swish.ogg'},
        {id: 'metal', url: 'sound/SFX_Metal.ogg'},
        {id: 'theme', url: 'sound/Theme.ogg'},
        {id: 'german1', url: 'sound/Boss_apfelsaft.ogg'},
        {id: 'german2', url: 'sound/Boss_Nein.ogg'},
        {id: 'german3', url: 'sound/Boss_YA.ogg'},
        {id: 'german4', url: 'sound/Boss_Shukrut.ogg'},
        {id: 'george1', url: 'sound/George_GeorgeWashington.ogg'},
        {id: 'george2', url: 'sound/George_ImGeorge.ogg'},
        {id: 'george3', url: 'sound/George_ImGeorgeWashington.ogg'},
        {id: 'george4', url: 'sound/George_Tastethepowerofgeorge.ogg'},
        {id: 'zombie1', url: 'sound/Zombie_Brains.ogg'},
        {id: 'zombie2', url: 'sound/Zombie_raarg.ogg'},
        {id: 'zombie3', url: 'sound/Zombie_Kill.ogg'}
    ];

    for(var i = 0;i<GameSounds.sounds.length;i++){//enumerate through list and load all sounds
        GameSounds[GameSounds.sounds[i].id] = soundManager.createSound({
            id: GameSounds.sounds[i].id,
            url: GameSounds.sounds[i].url
        });

        GameSounds[GameSounds.sounds[i].id].load({onload: function () {
            GameSounds.soundsLoaded+=1;
            GameSounds.perc_loaded = GameSounds.soundsLoaded/GameSounds.sounds.length*100;
        }})
    }

    var that = this;
    //setTimeout(function(){that.playRandom()}, 20000);
}

GameSounds.mute = function () {
    GameSounds.muted = !GameSounds.muted;
    if(GameSounds.muted){
        soundManager.mute();//mute all sounds;
    }else{
        //begin theme song
        GameSounds.beginThemeSong();
    }
}

GameSounds.beginThemeSong = function () {
    if(GameSounds.muted || GameSounds.forceMute || GameSounds.muteThemeSong) return;

    soundManager.play('theme', {onfinish: GameSounds.beginThemeSong}); //replay theme song when ended
}