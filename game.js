
var stageWidth = 704;//880
var stageHeight = 440;//550
var stage = new PIXI.Stage(0xFFFFFF, true);

// create a renderer instance
var renderer = new PIXI.autoDetectRenderer(stageWidth, stageHeight);
renderer.view.style.display = "block";
//renderer.view.style.width = "100%"
//renderer.view.style.height = "100%"

document.body.appendChild(renderer.view);

var assetsToLoader = ["data/nazi.json", "data/nazipacked.json", "data/George.json", "data/georgepacked.json", "data/map/map1.json", "data/effects.json", "data/map/ui.json", "data/hitler.json", "data/RoboHitler.json"];

loader = new PIXI.AssetLoader(assetsToLoader, true);//was not, true before

loader.onComplete = onAssetsLoaded;
loader.load();

var world = new PIXI.DisplayObjectContainer();

var lastLoop = new Date;
var fps_txt;
var george_char;

//focus
renderer.view.setAttribute('tabindex','0');
renderer.view.focus();

renderer.view.addEventListener('click', function() {
    renderer.view.focus();
}, false);

//prevent space and arrow keys
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

function onAssetsLoaded()
{
    GameManager.beginGame1();
    GameSounds.init();
    //GameSounds.theme.play();
}

// george_char.sprite.skeleton.setSkin()
//george_char.sprite.skeleton.bones[2].name
//george_char.sprite.skeleton.findBone("Head").rotation
