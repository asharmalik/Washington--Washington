var stageWidth = 704;
var stageHeight = 440;
var stage = new PIXI.Stage(0xCCCCCC);

// create a renderer instance
var renderer = new PIXI.autoDetectRenderer(stageWidth, stageHeight);
renderer.view.style.display = "block";

document.body.appendChild(renderer.view);

var assets = ["data/nazi.json", "data/nazipacked.json", "data/George.json", "data/georgepacked.json", "data/map/map1.json", "data/effects.json", "data/map/ui.json", "data/hitler.json", "data/RoboHitler.json"];

loader = new PIXI.AssetLoader(assets, false);

loader.onComplete = onAssetsLoaded;
loader.onProgress = onProgress;
loader.load();

var world = new PIXI.DisplayObjectContainer();

var lastLoop = new Date;
var fps_txt;
var loading_txt = new PIXI.Text("[0%]", {font:"42px Arial", fill:"white"});
var george_char;

loading_txt.x = stageWidth/2 - loading_txt.width/2;
loading_txt.y = stageHeight/2 - loading_txt.height;

stage.addChild(loading_txt);

//focus
renderer.view.setAttribute('tabindex','0');
renderer.view.focus();

renderer.view.addEventListener('click', function() {
    renderer.view.focus();
}, false);

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
    GameSounds.init();
    //GameSounds.theme.play();
}

function onProgress(){
    var percent = Math.round((assets.length - loader.loadCount) / assets.length * 100 * 100)/100;

    loading_txt.setText("["+percent+"%]");
    loading_txt.x = stageWidth/2 - loading_txt.width/2;
    renderer.render(stage);
}

// george_char.sprite.skeleton.setSkin()
//george_char.sprite.skeleton.bones[2].name
//george_char.sprite.skeleton.findBone("Head").rotation
