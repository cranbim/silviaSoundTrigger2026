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
    frontFunc: (x,y,w,h,frame)=>{
      noStroke()
      fill(80,200,30)
      push()
      translate(x,y)
      translate(w/2,h/2)
      rotate(frame/10)
      circle(w*0.05,0,w*0.2)
      // circle(w/2,h/2,w*0.2)
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
    frontFunc: (x,y,w,h,frame)=>{
      noStroke()
      fill(60,80,80)
      push()
      translate(x,y)
      translate(w/2,h/2)
      rotate(frame/10)
      circle(w*0.05,0,w*0.2)
      pop()
    },
  },{
    modeName:'audio',
    initFunc: ()=>{
      console.log('initialising audio mode')
    },
    stopFunc: ()=>{
      console.log('stopping audio visual')
    },
    runFunc: (frame)=>{
      console.log(frame)
    },
    backFunc: (x,y,w,h)=>{
      noStroke()
      fill(280,80,80)
      push()
      translate(x,y)
      rectMode(CORNER)
      rect(0,0,w,h)
      pop()
    },
    frontFunc: (x,y,w,h,frame)=>{
      noStroke()
      fill(90,80,80)
      push()
      translate(x,y)
      translate(w/2,h/2)
      rotate(frame/10)
      circle(w*0.05,0,w*0.2)
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
    this.frontFunc(x,y,w,h,this.modeFrameCount)
  }

  stop(){
    this.stopFunc()
    this.isRunning=false
  }
}