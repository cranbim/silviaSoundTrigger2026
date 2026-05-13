
let triggerSourceMacs=["1FA4","2EA8","BBA8","1EE8"]//,"1138","AAAA","BBBB"
let soundPlayers=[]
let soundFileNames=["s00.wav","s01.wav","s02.wav","s03.wav"]//,"s04.wav","s05.wav","s06.wav",
let currentSound=0;
let numSounds=0
var connection = new WebSocket('ws://127.0.0.1:8011/', ['arduino']);
let triggerLockoutTime=10000
let triggerIsLocked=false;
let triggerTimeout;
let soundEnabled=false;
let stopButton

function preload(){
  soundFileNames.forEach((sf,i)=>{
    soundPlayers[i]=new SoundPlayer(i,"sounds/s"+nf(i,2,0)+".wav")
    soundPlayers[i].loadSoundFile()
  })
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB)
  numSounds=soundPlayers.length
  let step=constrain(width/numSounds,40,width/10)
  for(let i=0; i<soundPlayers.length; i++){
    soundPlayers[i].createButton((i+0.5)*step,0.5*step,0.8*step,0.5*step)
  }
  stopButton=new Button(step,height-step,step*0.8,step*0.5)
}

function draw() {
  if(!soundEnabled){
    background(0,70,100)
    textAlign(CENTER, CENTER)
    textSize(width*0.06)
    text("click to enable sound",width/2, height/2)
  } else {
    background(230,80,80);
  }
  if(triggerIsLocked){
    background(340,80,80)
  }
  soundPlayers.forEach(sp=>{
    sp.showButton()
    sp.update()
  })
  stopButton.showButton()
  stopButton.update()
}

function mousePressed(){
  if(!soundEnabled){
    soundEnabled=true
  } else {
    // soundPlayers[currentSound].triggerSound()
    // currentSound=(currentSound+1)%numSounds
  }
  soundPlayers.forEach(sp=>{
    sp.click()
  })
  if(stopButton.click()){
    soundPlayers.forEach(sp=>{
      sp.stop()
    })
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
  if(instr=="HTBT"){
    let ind=triggerSourceMacs.findIndex(mac=>mac==mac4)
    // console.log("Heartbeat: "+ind)
    if(ind>-1){
      updateDeviceMap(ind)
    }
  }
}

function updateDeviceMap(ind){
  soundPlayers[ind].heartbeat()
}


class SoundPlayer{
  constructor(soundNum,soundFile){
    this.soundFile=soundFile
    this.sound
    this.soundNum=soundNum
    this.triggered=false
    this.playing=false
    this.loaded=false
    this.x=0
    this.y=0
    this.w=0
    this.h=0
    this.alive=1
    this.lastHearbeat=0
    this.heartbeatInterval=10000
    this.hover=false
  }

  stop(){
    this.sound.stop();
  }

  click(){
    if(this.hover){
      this.triggerSound()
    }
  }

  createButton(x,y,w,h){
    this.x=x
    this.y=y
    this.w=w
    this.h=h
  }

  heartbeat(){
    let now=Date.now()
    this.lastHearbeat=now
  }

  update(){
    let now=Date.now()
    // console.log(now-this.lastHearbeat)
    // console.log(nf((now-this.lastHearbeat)/this.heartbeatInterval,3,2))
    if(now>this.lastHearbeat+this.heartbeatInterval){
      this.alive=0
    } else {
      this.alive=1-(now-this.lastHearbeat)/this.heartbeatInterval
    }
    this.hover=mouseX<this.x+this.w/2 &&
                mouseX>this.x-this.w/2 &&
                mouseY<this.y+this.h/2 &&
                mouseY>this.y-this.h/2
  }

  showButton(){
    push()
    translate(this.x, this.y)
    rectMode(CENTER)
    fill(0+this.alive*120,80,80)
    if(this.hover){
      fill(200,80,80)
    }
    stroke(0,0,100)
    rect(0,0,this.w,this.h,this.h*0.2)
    fill(0,0,100)
    textAlign(CENTER, CENTER)
    textSize(this.h)
    text(this.soundNum+1,0,0)
    pop()
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

class Button{
  constructor(x,y,w,h){
    this.x=x
    this.y=y
    this.w=w
    this.h=h
    this.alive=1
    this.lastHearbeat=0
    this.heartbeatInterval=10000
    this.hover=false
  }

  
  click(){
    return this.hover
  }

  update(){
    this.hover=mouseX<this.x+this.w/2 &&
                mouseX>this.x-this.w/2 &&
                mouseY<this.y+this.h/2 &&
                mouseY>this.y-this.h/2
  }

  showButton(){
    push()
    translate(this.x, this.y)
    rectMode(CENTER)
    fill(20,80,80)
    if(this.hover){
      fill(200,80,80)
    }
    stroke(0,0,100)
    rect(0,0,this.w,this.h,this.h*0.2)
    fill(0,0,100)
    textAlign(CENTER, CENTER)
    textSize(this.h*0.5)
    text('stop all',0,0)
    pop()
  }
  
}