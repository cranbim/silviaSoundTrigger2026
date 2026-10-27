
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

let modeRunner

function preload(){
  // soundFileNames.forEach((sf,i)=>{
  //   soundPlayers[i]=new SoundPlayer(i,"sounds/s"+nf(i,2,0)+".mp3")
  //   soundPlayers[i].loadSoundFile()
  // })
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
  modeRunner=new ModeRunner(modes)
}

function draw() {
  // if(!soundEnabled){
  //   background(0,70,100)
  //   textAlign(CENTER, CENTER)
  //   textSize(width*0.06)
  //   text("click to enable sound",width/2, height/2)
  // } else {
  //   background(230,80,80);
  // }
  // if(triggerIsLocked){
  //   background(340,80,80)
  // }
  // soundPlayers.forEach(sp=>{
  //   sp.showButton()
  //   sp.showTracker()
  //   sp.update()
  // })
  // stopButton.showButton()
  // stopButton.update()
  modeRunner.run()
  modeRunner.show(showStandard,100,100,width-200,height-150)
}

function mousePressed(){
  modeRunner.nextMode()
  enableSound()
}

function showStandard(x,y,w,h){
  push()
  translate(x,y)
  fill(0,100,100)
  noStroke()
  rectMode(CENTER)
  rect(w/2,h/2,w/2,h/8)
  pop()
}

function enableSound(){
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

const modes=[
  {
    modeName:'base',
    initFunc: ()=>{
      console.log('initialising base mode')
    },
    stopFunc: ()=>{
      console.log('stopping base mode')
    },
    runFunc: (frame)=>{
      console.log(frame)
    },
    backFunc: (x,y,w,h)=>{
      noStroke()
      fill(80)
      push()
      translate(x,y)
      rectMode(CORNER)
      rect(0,0,w,h)
      pop()
    },
    frontFunc: (x,y,w,h)=>{
      noStroke()
      fill(80,200,30)
      push()
      translate(x,y)
      circle(w/2,h/2,w*0.2)
      pop()
    },
  },{
    modeName:'visual',
    initFunc: ()=>{
      console.log('initialising visual mode')
    },
    stopFunc: ()=>{
      console.log('stopping base visual')
    },
    runFunc: (frame)=>{
      console.log(frame)
    },
    backFunc: (x,y,w,h)=>{
      noStroke()
      fill(200,80,80)
      push()
      translate(x,y)
      rectMode(CORNER)
      rect(0,0,w,h)
      pop()
    },
    frontFunc: (x,y,w,h)=>{
      noStroke()
      fill(60,80,80)
      push()
      translate(x,y)
      circle(w/2,h/2,w*0.2)
      pop()
    },
  }
]//initFunc, runFunc, backFunc, frontFunc, stopFunc

class ModeRunner{
  constructor(modes){
    this.modes=[]
    modes.forEach(mode=>{
      this.modes.push(new Mode(mode))
    })
    this.currentMode=0
    // this.addMode(initialMode)
  }

  // addMode(mode){
  //   this.modes.push(mode)
  // }

  switchMode(modeID){
    console.log(modeID)
    if(modeID<this.modes.length && this.modes[modeID]){
      this.modes[this.currentMode].stop()
      this.currentMode=modeID
      this.modes[this.currentMode].init()
    }
  }

  nextMode(){
    this.currentMode=(this.currentMode+1)%this.modes.length
    console.log(this.currentMode)
    this.switchMode(this.currentMode)
  }

  run(){
    if(!this.modes[this.currentMode].isRunning){
      this.modes[this.currentMode].init()
    }
    this.modes[this.currentMode].run()
  }

  show(showStandard,x,y,w,h){
    this.modes[this.currentMode].showBack(x,y,w,h)
    showStandard(x,y,w,h)
    this.modes[this.currentMode].showFront(x,y,w,h)
  }

}

class Mode{
  constructor(modeDef){
    this.initFunc=modeDef.initFunc
    this.runFunc=modeDef.runFunc
    this.backFunc=modeDef.backFunc
    this.frontFunc=modeDef.frontFunc
    this.stopFunc=modeDef.stopFunc
    this.isRunning=false
    this.modeFrameCount=0
  }

  init(){
    this.initFunc()
    this.isRunning=true
    this.modeFrameCount=0
  }

  run(){
    this.runFunc(this.modeFrameCount)
    this.modeFrameCount++
  }

  showBack(x,y,w,h){
    this.backFunc(x,y,w,h)
  }

  showFront(x,y,w,h){
    this.frontFunc(x,y,w,h)
  }

  stop(){
    this.stopFunc()
    this.isRunning=false
  }
}