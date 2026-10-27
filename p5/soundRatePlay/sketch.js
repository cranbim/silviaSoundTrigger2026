let mySounds=[];
let sliders=[]

function preload() {
  // Load your audio file
  mySounds[0] = loadSound('assets/hum00.mp3');
  mySounds[1] = loadSound('assets/hum01.mp3');
}

function setup() {
  createCanvas(400, 200);
  mySounds.forEach(s=>{
    s.loop(); // Start looping the sound
  })
  for(let i=0; i<2; i++){
    let slider=createSlider(0, 1,0,0.1);
    slider.position(10, 10+20*i);
    slider.size(80);
    sliders.push(slider)
  }
  // sliders[0]=createSlider(0, 1);
  // sliders[0].position(10, 10);
  // sliders[0].size(80);
  // sliders[0]=createSlider(0, 1);
  // sliders[1].position(10, 30);
  // sliders[1].size(80);
}

function draw() {
  background(220);
  // Map mouseX position to a playback rate between 0.5 and 2.0
  let playbackRateX = map(mouseX, 0, width, 0.5, 2.0);
  let playbackRateY = map(mouseY, 0, height, 0.5, 2.0);

  // Apply the rate to the sound
  mySounds[0].rate(playbackRateX);
  mySounds[1].rate(playbackRateY);
  // let playback=1
  // mySounds.forEach((s,i)=>{
  //   playback=map(sliders[i].value(),0,1,0.5,2.0)
  //   text(nf(playback,1,2),10, 120+20*i)
  //   s.rate(playback)
  // })
  // Display current rate on screen
  textSize(16);
  text("Move mouse left/right to change rate", 20, 40);
  text("Playback Rate: " + playbackRateX.toFixed(2), 20, 80);
  text("Playback Rate: " + playbackRateY.toFixed(2), 20, 120);
  // text(sliders[0].value(),100,10)
  // text(sliders[1].value(),100,30)
}