
let triggerSourceMacs=["1FA4","2EA8","BBA8","1EE8"]//,"1138","AAAA","BBBB"
let soundPlayers=[]
let soundFileNames=["s00.wav","s01.wav","s02.wav","s03.wav"]//,"s04.wav","s05.wav","s06.wav",
let currentSound=0;
let numSounds=0
var connection = new WebSocket('ws://127.0.0.1:8011/', ['arduino']);
let triggerLockoutTime=5000
let triggerIsLocked=false;
let triggerTimeout;
let soundEnabled=false;

function preload(){
  soundFileNames.forEach((sf,i)=>{
    soundPlayers[i]=new SoundPlayer(i,"sounds/s"+nf(i,2,0)+".wav")
    soundPlayers[i].loadSoundFile()
  })
}

function setup() {
  createCanvas(400, 400);
  numSounds=soundPlayers.length
}

function draw() {
  if(!soundEnabled){
    background(200,100,100)
    textAlign(CENTER, CENTER)
    textSize(width*0.1)
    text("click to enable sound",width/2, height/2)
  } else {
    background(100,200,100);
  }
  if(triggerIsLocked){
    background(230,180,100)
  }
}

function mousePressed(){
  if(!soundEnabled){
    soundEnabled=true
  } else {
    soundPlayers[currentSound].triggerSound()
    currentSound=(currentSound+1)%numSounds
  }
}

connection.onopen = function () {
	//send browser identity string
	connection.send('IAMABROWSER');
	connection.send('Time: ' + new Date());
};

connection.onerror = function (error) {
	console.log('WebSocket Error ', error);
};

connection.onmessage = function (e) {
	console.log('Server: ', e.data);
	processMessage(e.data);
};

function processMessage(message){
  let instr=message.substring(4,8)
  let mac4=message.substring(0,4)
  if(instr=="TRIG"){
    let ind=triggerSourceMacs.findIndex(mac=>mac==mac4)
    console.log(mac4,ind)
    if(ind>-1 && !triggerIsLocked){
      soundPlayers[ind].triggerSound()
      triggerIsLocked=true
      triggerTimeout=setTimeout(function(){triggerIsLocked=false},triggerLockoutTime)
    }
  }
}

// function processData(data){
// 	//data format=SCDV+000+TYPE+0.000000
// 	//values for slice=0-4, 4-7, 7-11,

// 	done=false;
// 	var signal=data.slice(0,4);
// 	if(signal!=="SCDV"){
// 		done=false;
// 	} else {
// 		var client=Number(data.slice(4,7));
// 		var type=data.slice(7,11);
// 		var data=Number(data.slice(11));
// 		// console.log(client+":"+type+":"+data);
// 		var foundClient=null;
//         done=true
//     }

// 	return done;
// }

class SoundPlayer{
  constructor(soundNum,soundFile){
    this.soundFile=soundFile
    this.sound
    this.soundNum=soundNum
    this.triggered=false
    this.playing=false
    this.loaded=false
  }
  
  soundDidLoad(context){
    console.log("loaded" + context.soundNum)
    
    context.loaded=true
  }
  
  loadSoundFile(filename){
    console.log(this.soundNum, "getting", this.soundFile)
    this.sound= loadSound(this.soundFile, this.soundDidLoad(this))
    
  }
  
  
  
  triggerSound(){
    this.sound.setVolume(0.8);
    this.sound.stop();
    this.sound.play();
    this.sound.pan(random(-1,1));
    this.triggered=true;
  }
  
  run(){
    this.playing=this.triggered && this.sound.isPlaying();
    if(!this.playing){
      this.triggered=false
    }
  }
}

