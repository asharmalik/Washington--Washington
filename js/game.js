var stage = new PIXI.Stage(0xCCCCCC);

var rendererOptions = {
    antialiasing:false,
    transparent:false,
    resolution: 1
}


// create a renderer instance
var renderer = new PIXI.autoDetectRenderer(ScreenManager.stageWidth, ScreenManager.stageHeight, rendererOptions);
renderer.view.style.display = "block";

document.body.appendChild(renderer.view);

//following is mobile only
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    GameManager.mobile = true;
    ScreenManager.init();//only initialize if mobile
}else{
    GameManager.mobile = false;
}


/*renderer.view.addEventListener("click", function () {
    console.log("click");
    if (screenfull.enabled) {
        screenfull.request();
    }
});*/

var assets = ["data/nazi.json", "data/nazipacked.json", "data/George.json", "data/georgepacked.json", "data/map/map1.json", "data/effects.json", "data/map/ui.json", "data/hitler.json", "data/RoboHitler.json"];

loader = new PIXI.AssetLoader(assets, false);

//loader.onComplete = onAssetsLoaded;
loader.onProgress = onProgress;
loader.load();

var world = new PIXI.DisplayObjectContainer();

var lastLoop = new Date;
var fps_txt;
var loading_txt = new PIXI.Text("[0%]", {font:"42px Arial", fill:"white"});
var george_char;
var perc_assets_loaded = 0;
var perc_loaded = 0;
var displayed_perc = 0;

loading_txt.x = ScreenManager.stageWidth/2 - loading_txt.width/2;
loading_txt.y = ScreenManager.stageHeight/2 - loading_txt.height;

GameSounds.init();

stage.addChild(loading_txt);

//focus
renderer.view.setAttribute('tabindex','0');
renderer.view.focus();

renderer.view.addEventListener('click', function() {
    renderer.view.focus();
}, false);

requestAnimationFrame(update_loader);


//prevent space and arrow keys
window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

function onAssetsLoaded()
{
    stage.removeChild(loading_txt);
    GameManager.beginGame1();
    GameSounds.beginThemeSong();
}

function onProgress(){
    perc_assets_loaded = (assets.length - loader.loadCount) / assets.length * 100; //update real-time percent
}

function update_loader(){
    perc_loaded = (perc_assets_loaded+GameSounds.perc_loaded)/2;
    while(displayed_perc<perc_loaded) displayed_perc+=1;

    loading_txt.setText("["+displayed_perc+"%]");
    loading_txt.x = ScreenManager.stageWidth/2 - loading_txt.width/2;
    renderer.render(stage);

    if(displayed_perc > 95 && perc_loaded == 100){
        onAssetsLoaded();
        return;
    }

    requestAnimationFrame(update_loader);
}



// george_char.sprite.skeleton.setSkin()
//george_char.sprite.skeleton.bones[2].name
//george_char.sprite.skeleton.findBone("Head").rotation
