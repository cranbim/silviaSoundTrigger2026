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