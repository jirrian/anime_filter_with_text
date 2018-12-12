// Copyright (c) 2018 ml5
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Style Transfer Image Example using p5.js
This uses a pre-trained model of The Great Wave off Kanagawa and Udnie (Young American Girl, The Dance)
=== */

let inputImg;
let style1;
let img;
let poseNet;
let poses = [];
let canvas;
let sparkle;
let filter;
let addTextBtn;
let textBubbles;
let textBubblesInput;

function setup() {
    canvas = createCanvas(500, 500).parent(select('#result'));

    sparkle = loadImage('img/sparkle.png');
    filter = loadImage('img/filter2.png');
    font = loadFont('img/CC-Wild-Words-Roman.ttf');
    font2 = loadFont('img/augie.ttf');

    // create an image using the p5 dom library
    // call modelReady() when it is loaded
    domimg = document.getElementById("inputImg1");
    img = createImg(domimg.src, imageReady);
    // set the image size to the size of the canvas
    img.size(500, 500);

    img.hide(); // hide the image in the browser
    frameRate(1); // set the frameRate to 1 since we don't need it to be running quickly in this case

  // Create Style methods with pre-trained model
  style1 = ml5.styleTransfer('models/run9ckpt', modelReady);

    addTextBtn = select('#btn')
    addTextBtn.mousePressed(addText);

}

// when the image is ready, then load up poseNet
function imageReady(){
    // set some options
    let options = {
        imageScaleFactor: 1,
        minConfidence: 0.1,
        maxPoseDetections: 2
    }
    
    // assign poseNet
    poseNet = ml5.poseNet(modelReady, options);
    // This sets up an event that listens to 'pose' events
    poseNet.on('pose', function (results) {
        poses = results;
    });
}

// when poseNet is ready, do the detection
function modelReady() {

  if(poseNet.ready && style1.ready){
    select('#statusMsg').html('Models loaded');
     
    // When the model is ready, run the singlePose() function...
    // If/When a pose is detected, poseNet.on('pose', ...) will be listening for the detection results 
    // in the draw() loop, if there are any poses, then carry out the draw commands
    poseNet.singlePose(img);
  }
}


// draw() will not show anything until poses are found
function draw() {
    if (poses.length > 0) {
        image(img, 0, 0, 500, 500);
        //drawSkeleton(poses);
        drawKeypoints(transferImages);
        //drawPoints();
        noLoop(); // stop looping when the poses are estimated
        
    }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints(callback)  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    
    let nose = pose.keypoints[0];
    let lefteye = pose.keypoints[1];
    let righteye = pose.keypoints[2];
      
    drawEye(lefteye, nose);
    drawEye(righteye, nose);
    
    drawBlush(lefteye, nose);
    drawBlush(righteye, nose);

    drawSparkles(nose);
  }
  callback();
}

function drawPoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255);
                stroke(20);
                strokeWeight(4);
                ellipse(round(keypoint.position.x), round(keypoint.position.y), 8, 8);
            }
        }
    }
}

function drawEye(keypoint, nose){
      if (keypoint.score > 0.2) {
        // fill(255, 0, 0);
        // noStroke();
        let noseToEye = abs(nose.position.x-keypoint.position.x);

        //offset
        noseToEye = noseToEye+10;

        //get eye area in square
        let e = get(keypoint.position.x - (noseToEye/2), keypoint.position.y - (noseToEye/4), noseToEye, noseToEye/2);

        //create mask for eyes
        //imgMask = createGraphics(noseToEye, noseToEye);
        //imgMask.ellipse(noseToEye/2,noseToEye/2,noseToEye,noseToEye/2);
        
        //e.mask(imgMask);

        // use png for eye filter
        e.mask(filter);


        image(e, keypoint.position.x - (noseToEye*1.5/2), keypoint.position.y - (noseToEye*2/4), noseToEye*1.5, noseToEye);
        //ellipse(keypoint.position.x+5, keypoint.position.y+5, noseToEye+10, noseToEye+10);
        //ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
}

function drawBlush(keypoint, nose){
  if (keypoint.score > 0.2) {

    let noseToEye = nose.position.x-keypoint.position.x;

    fill(255, 132, 183, 100);
    noStroke();
    ellipse(keypoint.position.x - (noseToEye/2), keypoint.position.y + abs(noseToEye*0.8), noseToEye*1.2, noseToEye*0.7);
    //ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
  }
}

function drawSparkles(nose){
  if (nose.score > 0.2) {
    image(sparkle, nose.position.x+random(-20,20), nose.position.y+random(-20,20), width/3, height/3);
    image(sparkle, nose.position.x- width/3+random(-20,20), nose.position.y+random(-40,20), width/3, height/3);
    image(sparkle, nose.position.x- width/6+random(-20,20), nose.position.y/3-height/6+random(-40,20), width/3, height/3);
  }
}

// Apply the transfer to image!
function transferImages() {
  select('#statusMsg').html('Applying Style Transfer...!');
  
  // save canvas as frame
  saveFrames('edited', 'png', 1, 1, function(data){
    let input = data[0].imageData;
    let inputIMG = createImg(input, function(){

      //apply style
        style1.transfer(inputIMG, function(err, result) {
      let styleIMG = createImg(result.src);
      

        select('#statusMsg').html('Done!');
        styleIMG.id('styledImage');

        //inputIMG.remove();
      });
    });

    //inputIMG.parent(canvas);   
  });

}

function addText(){
    let s = select('#styledImage');
    image(s, 0, 0, width, height);

    let pose;
    let lefteye;
    let righteye;

    let soundEffectsInput = select('#soundEffects').value();
    textBubblesInput = select('#textBubbles').value();
    console.log(soundEffectsInput);
    console.log(textBubblesInput);

    if(textBubblesInput != ""){
        textBubbles = textBubblesInput.split(',');
        console.log(textBubbles);
        //addBubbles(lefteye, righteye, textBubbles);
    }

    for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
        pose = poses[i].pose;
    
        lefteye = pose.keypoints[1];
        righteye = pose.keypoints[2];

        if(soundEffectsInput != ""){
            soundEffects = soundEffectsInput.split(',');
            console.log(soundEffects);
            addSounds(lefteye, righteye, soundEffects);
        }
    }



    
}

function addSounds(left, right, array){
    console.log(array);
    textSize(20);
    stroke(255);
    strokeWeight(2);
    textFont(font2);
    textAlign(CENTER);
    fill(255, 132, 183);
    for(let j = 0; j < array.length; j++){
        let r = int(random(0, 2));
        if(r == 0 && left.score > 0.2){
            text(array[j],left.position.x+random(60,100), left.position.y + random(-50,100));
        }
        else if(r == 1 && right.score > 0.2){
            text(array[j],right.position.x-random(60,100), left.position.y + random(-50,100));
        }
    }


}

var i = 0; // need to reset this variable on button press
function mousePressed(){
    if(textBubbles){
        if(i < textBubbles.length && textBubblesInput != "" && mouseX > 0 && mouseX < 500 && mouseY > 0 && mouseY < 500){
            textSize(12);
            textFont(font);
            textAlign(CENTER, CENTER);   

            let bounds = font.textBounds(textBubbles[i], 0, 0, 12);
            fill(255);
            if(bounds.w <=80){
                ellipse(mouseX, mouseY, bounds.w+40, bounds.w*2+40);
                fill(0);
                text(textBubbles[i], mouseX, mouseY);
            }
            else{
                ellipse(mouseX, mouseY, 80+20, 150);
                fill(0);
                text(textBubbles[i], mouseX-(80/2), mouseY-(130/2), 80, 130);
            }
            i++;

        }
    }
    console.log(i);
}

