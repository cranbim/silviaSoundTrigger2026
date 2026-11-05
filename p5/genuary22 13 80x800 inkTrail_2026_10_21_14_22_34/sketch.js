var splotTrails=[];
var mover;
let controlX=0;
let controlY=0;
let relXY=0.5;
let controlCalib=10;
let motionTrails=[]

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  // splotTrails.push(new SplotTrail(splotTrails.length));
  // mover=new Mover(width/2, height/2);
  motionTrails.push(new MotionTrail(0,width/2, height/2))
}

function draw() {
  background(0,0,80,0.1);
  // splotTrails[0].add(mover.pos.x, mover.pos.y,relXY);
  // splotTrails[0].run();
  // mover.show();
  controlX=constrain(map(mouseX,0,width,-1,1),-1,1)
  controlY=constrain(map(mouseY,0,height,-1,1),-1,1)
  relXY=sqrt((controlX*controlX)+(controlY*controlY))
  // fill(0,0,0)
  // textSize(20)
  // text(nf(controlX,1,2),20,20)
  // text(nf(controlY,1,2),20,40)
  // text(nf(relXY,1,2),20,60)
  // mover.run(controlX*controlCalib,controlY*controlCalib);
  motionTrails[0].run(controlX, controlY, relXY)
}

class MotionTrail{
  constructor(index,x,y){
    this.mover=new Mover(x,y);
    this.splotTrail=new SplotTrail(index);
    this.controlCalib=10;
  }

  run(controlX, controlY,relXY){
    this.splotTrail.add(this.mover.pos.x, this.mover.pos.y,relXY);
    this.splotTrail.run();
    this.mover.run(controlX*this.controlCalib,controlY*this.controlCalib);
  }
}

function Mover(x,y){
  this.pos=createVector(x,y);
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
  
  this.show=function(){
    fill(0,100,100);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 50);
  };
}

function SplotTrail(id){
  var splots=[];
  var maxSplots=150;

  this.add=function(x,y,relSize){
    if(splots.length<maxSplots){
      splots.push(new Splot(x,y,5+(1-relSize)*width*0.1));
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

function Splot(x,y,ir){
  var ttlMax=120;
  var ttl=ttlMax;
  var verts=[];
  var numVerts=60;
  var cHue=noise(x/100,y/100+frameCount/120)*50-25;//random(-5,5);
  var sat=noise(11+x/90,y/90+frameCount/100)*30+50;//random(50,80);
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
      var n=constrain(noise(x+verts[i].x/55, y+verts[i].y/50, frameCount/10)*2-0.5,0,1);
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
    fill(240+cHue,sat*ttl/ttlMax, bri*ttl/ttlMax,ttl/ttlMax);
    fill(240+cHue,sat*(ttl/ttlMax), bri*(1),ttl/ttlMax);
    noStroke();
    beginShape();
    verts.forEach(function(v){
      vertex(v.x, v.y);
    });
    endShape(CLOSE);
    pop();
  };

}
