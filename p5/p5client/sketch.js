
// let triggerSourceMacs=["1FA4","2EA8","BBA8","1EE8"]//,"1138","AAAA","BBBB"
let triggerSourceMacs=["A744","E7F8","2EA8","BBA8"]//,"1138","AAAA","BBBB"
let soundPlayers=[]
// let soundFileNames=["s00.wav","s01.wav","s02.wav","s03.wav"]//,"s04.wav","s05.wav","s06.wav",
let soundFileNames=["s00.mp3","s01.mp3","s02.mp3","s03.mp3"]//,"s04.wav","s05.wav","s06.wav",
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
    soundPlayers[i]=new SoundPlayer(i,"sounds/s"+nf(i,2,0)+".mp3")
    soundPlayers[i].loadSoundFile()
  })
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB)
  numSounds=soundPlayers.length
  let step=constrain(width/numSounds,40,width/4)
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
    sp.showTracker()
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
  let val=message.length>8?message.substring(8,12):-1
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
  if(instr=="ROLL"){
    let ind=triggerSourceMacs.findIndex(mac=>mac==mac4)
    // console.log("Heartbeat: "+ind)
    if(ind>-1 && val>-1){
      updateTracker(ind,parseInt(val),-1)
    }
  }
  if(instr=="PTCH"){
    let ind=triggerSourceMacs.findIndex(mac=>mac==mac4)
    // console.log("Heartbeat: "+ind)
    if(ind>-1 && val>-1){
      updateTracker(ind,-1,parseInt(val))
    }
  }
}

function updateDeviceMap(ind){
  soundPlayers[ind].heartbeat()
}

function updateTracker(ind,valRoll, valPitch){
  soundPlayers[ind].updateTracker(valRoll, valPitch)
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

    this.xPosRel=0.5
    this.yPosRel=0.5
    this.xPosEff=0.5
    this.yPosEff=0.5
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

  updateTracker(roll, pitch){
    console.log(roll, pitch)
    if(roll>-1){
      roll=roll/(10)
      this.xPosRel=1-roll/180
    }
    if(pitch>-1){
      pitch=pitch/(10)
      this.yPosRel=pitch/180
    }
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
    this.xPosEff+=(this.xPosRel-this.xPosEff)/10
    this.yPosEff+=(this.yPosRel-this.yPosEff)/10
    this.modifySound()
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

  showTracker(){
    push()
    translate(this.x, this.y)
    fill(200,100,100)
    stroke(0)
    strokeWeight(1)
    ellipse(-this.w/2+this.xPosEff*this.w, -this.h/2+this.yPosEff*this.h, this.h*0.2)
    translate(0,this.h/2)
    textSize(this.h*0.3)
    fill(0,0,100)
    noStroke()
    text(nf(this.xPosEff,0,2),10,10)
    text(nf(this.yPosEff,0,2),10,30)
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

  modifySound(){
    this.sound.pan(this.xPosEff*2-1)
    this.sound.setVolume(this.yPosEff)
    // this.sound.rate(this.yPosEff*2)
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