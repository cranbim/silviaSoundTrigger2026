
// let triggerSourceMacs=["1FA4","2EA8","BBA8","1EE8"]//,"1138","AAAA","BBBB"
let triggerSourceMacs=["A744","E7F8","9164","F928"]//,"1138","AAAA","BBBB"
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
let soundTriggersEnabled=false;
let stopButton
let numDevices=triggerSourceMacs.length
let revealButton
let lastUIMouse=0;
let inactiveUIinterval=2000;
let fadeUI=1
let activeUI=false
//
let controlX=0;
let controlY=0;
let relXY=0.5;
let motionTrails=[]

function preload(){
  soundFileNames.forEach((sf,i)=>{
    soundPlayers[i]=new SoundPlayer(i,"sounds/s"+nf((i+0)%4,2,0)+".mp3")
    soundPlayers[i].loadSoundFile()
  })
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB)
  numSounds=soundPlayers.length
  let step=constrain(width/numSounds,10,width/10)
  for(let i=0; i<soundPlayers.length; i++){
    soundPlayers[i].createButton((i+1.5)*step,0.5*step,0.8*step,0.5*step)
  } 
  revealButton=new RoundButton(step*0.5,step*0.5,step*0.5,'show')
  soundButton=new Button(step,height-step,step*0.8,step*0.5,'enable')
  stopButton=new Button(step*2,height-step,step*0.8,step*0.5,'stop all')
  for(let i=0; i<numDevices; i++){
    motionTrails.push(new MotionTrail(i,width/2, height/2,(200+i*40)%360,width/2, height/2, i*TWO_PI/4,height*0.6))
  }
  // motionTrails.push(new MotionTrail(0,width/2, height/2,220))
  // motionTrails.push(new MotionTrail(1,width/2, height/2,260))
  noCursor()
}

function draw() {
  
  if(millis()-lastUIMouse<inactiveUIinterval){
    fadeUI+=(1-fadeUI)/20
    cursor()
  } else {
    fadeUI+=(0-fadeUI)/50
    activeUI=false
    noCursor()
  }
  if(!soundEnabled){
    // background(0,70,100)
    // background(0,10,80)
    // textAlign(CENTER, CENTER)
    // textSize(width*0.06)
    // text("click to enable sound",width/2, height/2)
  } else {
    // background(230,80,80);
    // background(230,10,80);
  }
  background(0,0,40);
  // fill(0)
  // noStroke()
  // textSize(20)
  // textAlign(LEFT,TOP)
  // text(millis()-lastUIMouse+" "+inactiveUIinterval+" "+nf(fadeUI,1,2),20,20)
  if(triggerIsLocked){
    // background(340,10,80)
  }
  soundPlayers.forEach(sp=>{
    if(activeUI){
      sp.showButton()
      sp.showTracker()
    }
    sp.update()
  })
  if(activeUI){
      stopButton.showButton(false)
      stopButton.update()
      soundButton.showButton(soundTriggersEnabled)
      soundButton.update()
  }
  revealButton.showButton(fadeUI)
  revealButton.update()
  //
  // controlX=constrain(map(mouseX,0,width,-1,1),-1,1)
  // controlY=constrain(map(mouseY,0,height,-1,1),-1,1)
  // controlX=constrain(map(soundPlayers[0].xPosEff,0,1,-1,1),-1,1)
  // controlY=constrain(map(soundPlayers[0].yPosEff,0,1,-1,1),-1,1)
  // relXY=sqrt((controlX*controlX)+(controlY*controlY))
  // motionTrails[0].run(controlX, controlY, relXY,soundPlayers[0].alive)
  motionTrails.forEach((mt,i)=>{
    controlX=constrain(map(soundPlayers[i].xPosEff,0,1,-1.2,1.2),-1,1)
    controlY=constrain(map(soundPlayers[i].yPosEff,0,1,-1.2,1.2),-1,1)
    relXY=sqrt((controlX*controlX)+(controlY*controlY))
    mt.run(controlX, controlY, relXY,soundPlayers[i].alive)
  })
}

function mouseMoved(){
  lastUIMouse=millis()
}

function mousePressed(){
  if(!soundEnabled){
    soundEnabled=true
  } else {
    // soundPlayers[currentSound].triggerSound()
    // currentSound=(currentSound+1)%numSounds
  }
  if(activeUI){
    soundPlayers.forEach(sp=>{
      sp.click()
    })
    if(stopButton.click()){
      soundPlayers.forEach(sp=>{
        sp.stop()
      })
      soundTriggersEnabled=false
    }
    if(soundButton.click()){
      soundTriggersEnabled=!soundTriggersEnabled
    }
  }
  if(revealButton.click()){
    activeUI=!activeUI
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
    // if(ind>-1 && !triggerIsLocked){
    if(ind>-1 && soundTriggersEnabled){
      soundPlayers[ind].triggerSound()
      // triggerIsLocked=true
      // triggerTimeout=setTimeout(function(){triggerIsLocked=false},triggerLockoutTime)
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
    this.lastTriggered=0
    this.playInterval=10000
    this.fadeSound=0
    this.fadeSoundEase=60

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
    let dNow=new Date()
    console.log("last heart",this.soundNum, dNow.getHours()+':'+dNow.getMinutes())
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
    // this.modifySound()
    if(this.fadeSound>0){
      if(millis()-this.lastTriggered>this.playInterval){
        this.fadeSound+=(0-this.fadeSound)/this.fadeSoundEase
        this.sound.setVolume(0.8*this.fadeSound);
        if(this.fadeSound<0.02){
          this.fadeSound=0
          this.sound.stop();
        }
      }
    }
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
    this.fadeSound=1
    this.sound.setVolume(0.8*this.fadeSound);
    this.sound.stop();
    this.sound.play();
    this.sound.pan(random(-1,1));
    this.triggered=true;
    this.lastTriggered=millis()
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
  constructor(x,y,w,h,label){
    this.x=x
    this.y=y
    this.w=w
    this.h=h
    this.alive=1
    this.lastHearbeat=0
    this.heartbeatInterval=10000
    this.hover=false
    this.label=label
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

  showButton(isOn){
    push()
    translate(this.x, this.y)
    rectMode(CENTER)
    if(isOn){
      fill(120,80,40+(this.hover?40:0))
    } else {
      fill(20,80,40+(this.hover?40:0))
    }
    // if(this.hover){
    //   fill(200,80,80)
    // }
    stroke(0,0,100)
    rect(0,0,this.w,this.h,this.h*0.2)
    fill(0,0,100)
    textAlign(CENTER, CENTER)
    textSize(this.h*0.5)
    text(this.label,0,0)
    pop()
  }
  
}

class RoundButton{
  constructor(x,y,w,label){
    this.x=x
    this.y=y
    this.w=w
    this.alive=1
    this.lastHearbeat=0
    this.heartbeatInterval=10000
    this.hover=false
    this.label=label
  }

  
  click(){
    return this.hover
  }

  update(){
    this.hover=mouseX<this.x+this.w/2 &&
                mouseX>this.x-this.w/2 &&
                mouseY<this.y+this.w/2 &&
                mouseY>this.y-this.w/2
  }

  showButton(fade){
    push()
    translate(this.x, this.y)
    // rectMode(CENTER)
    fill(20,80,80,fade)
    if(this.hover){
      fill(200,80,80,fade)
    }
    stroke(0,0,100,fade)
    ellipse(0,0,this.w)
    fill(0,0,100,fade)
    textAlign(CENTER, CENTER)
    textSize(this.h*0.5)
    text(this.label,0,0)
    pop()
  }
  
}

//************************************************* */

class MotionTrail{
  constructor(index,x,y,hueOffset,cx,cy,a,range){
    this.cx=cx
    this.cy=cy
    this.a=a-PI/2
    this.range=range
    this.mover=new Mover(x,y,cx,cy,a,range);
    this.splotTrail=new SplotTrail(index,hueOffset);
    this.controlCalib=20;
    this.active=0;
  }

  run(controlX, controlY,relXY,active){
    this.active+=(active-this.active)/20
    if(this.active>0.05 && random(10)<8){
      this.splotTrail.add(this.mover.pos.x, this.mover.pos.y,relXY,this.active);
    }
    this.splotTrail.run();
    // this.mover.run(controlX*this.controlCalib,controlY*this.controlCalib);
    this.mover.run2(controlX,controlY);
  }
}

function Mover(x,y,cx,cy,a,range){
  this.pos=createVector(x,y);
  this.cx=cx
  this.cy=cy
  this.a=a
  this.aRel=0
  this.range=range
  var vel=createVector(0,0);
  var acc=createVector(0,0);
  
  this.oldrun=function(cx, cy){
    acc=p5.Vector.fromAngle(noise(this.pos.x/100+this.pos.y/100,frameCount/500)*PI*6).setMag(0.5);
    acc.x+=0.55;
    vel.add(acc);
    vel.limit(5);
    vel.mult(0.95);
    this.pos.add(vel);
    this.pos.x=(this.pos.x+width)%width;
    this.pos.y=(this.pos.y+height)%height;
  };

  this.run=function(cx, cy){
    this.pos.x=(this.pos.x+width+cx)%width;
    this.pos.y=(this.pos.y+height+cy)%height;
  }

  this.run2=function(controlX, controlY){
    this.aRel=-controlX*TWO_PI/4
    this.pos.x=this.cx+(cos(this.a+this.aRel))*(controlY+1)*0.5*this.range//(this.pos.x+width+cx)%width;
    this.pos.y=this.cy+(sin(this.a+this.aRel))*(controlY+1)*0.5*this.range//(this.pos.y+height+cy)%height;
  }
  
  this.show=function(){
    fill(0,100,100);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 50);
  };
}

function SplotTrail(id,hueOffset){
  var splots=[];
  var maxSplots=100;

  this.add=function(x,y,relSize,active){
    if(splots.length<maxSplots){
      splots.push(new Splot(x,y,5+(1-relSize)*width*0.04*active,hueOffset));
    }
  };

  this.run=function(){
    splots.forEach(function(splot){
      splot.show();
    });
    for(var i=splots.length-1; i>=0; i--){
      if(splots[i].run()){
        // splots[i].show();
      } else {
        splots.splice(i,1);
      }
    }
  };
}

function Splot(x,y,ir,hueOffset){
  var ttlMax=120;
  var ttl=ttlMax;
  var verts=[];
  var numVerts=30;
  var cHue=noise(x/100,y/100+frameCount/120)*30-15;//random(-5,5);
  var sat=noise(11+x/90,y/90+frameCount/100)*20+50;//random(50,80);
  var bri=noise(9+x/70,y/70+frameCount/70)*10+80;//random(80,90);
  var rot=TWO_PI/numVerts;
  var rGrow=2*random(1,1.9);
  for(var i=0; i<numVerts; i++){
    var r=ir
    var vx=cos(i*rot)*r;
    var vy=sin(i*rot)*r;
    verts[i]={x:vx, y:vy, r:r};
  }

  this.run=function(){
    for(var i=0; i<numVerts; i++){
      var n=constrain(noise(x+verts[i].x/55, y+verts[i].y/50, frameCount/30)*2-0.5,0,1);
      var r=verts[i].r+n*0.45*rGrow;
      var vx=cos(i*rot)*r;
      var vy=sin(i*rot)*r;
      verts[i]={x:vx, y:vy, r:r};
    }
    ttl--;
    return ttl>0;
  };

  this.show=function(){
    push();
    translate(x,y);
    // fill(hueOffset+cHue,sat*ttl/ttlMax, bri*ttl/ttlMax,ttl/ttlMax);
    fill(hueOffset+cHue,40+0.6*sat*(ttl/ttlMax), bri*(1),ttl/ttlMax);
    noStroke();
    beginShape();
    verts.forEach(function(v){
      vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();
  };

}
