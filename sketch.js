/*
BUGS:
- theres is a bug in the ringmodulator on the p5.sound library, a warning is outpit for every play() or loop()
    https://github.com/processing/p5.js-sound/issues/506
- scoobydoo run before starting
- there are doble intanciation of some trails? (when cornering)
*/
//-------------------------------------------------------------------
//cube stuff
var speed = 6;
var cubes = [];
var hitbox = 80;
var dir = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
}
var random_is_ON = true;
// images
var cube_down = [];
var cube_right = [];
var cube_up = [];
var cube_left = [];
var trail_images = []

//music
var music_is_muted = false;

// help stuff
var help_window;
var help_grid;
var help_button;
var help_is_ON = true;

// mouse stuff
var cursor_add;
var cursor_remove;
var cursor_link;
var mouseisOver_cube = false;
var mouseisOver_helpbtn = false;
//--------------------------------------------------
function preload() {
    for (var i = 0; i < 10; i++) {
        cube_down[i] = loadImage("assets/cube_" + i + ".png");
    }
    for (var i = 0; i < 10; i++) {
        cube_right[i] = loadImage("assets/cube_" + (i + 10) + ".png");
    }
    for (var i = 0; i < 10; i++) {
        cube_up[i] = loadImage("assets/cube_" + (i + 20) + ".png");
    }
    for (var i = 0; i < 10; i++) {
        cube_left[i] = loadImage("assets/cube_" + (i + 30) + ".png");
    }

    for (var i = 0; i < 3; i++) {
        trail_images[i] = loadImage("assets/trail_" + i + ".png");
    }

    //TODO: maybe supor more angles?
    cube_left = cube_down;

    cursor_add = loadImage("assets/cursor_add.png");
    cursor_remove = loadImage("assets/cursor_remove.png");
    cursor_link = loadImage("assets/cursor_link.png");

    help_window = loadImage("assets/help.png");
    help_grid = loadImage("assets/help_grid.png");
    help_button = loadImage("assets/help_button.png");

    //music loads (gb_[0,1,2,3] are load in the Cube class)
    soundFormats('mp3', 'ogg');
    sfx_floorhit = loadSound("assets/audio/floorhit");

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);
    imageMode(CENTER);
    noCursor();
}

function draw() {
    background(0);
    if(help_is_ON){
        image(help_grid, windowWidth/2, windowHeight/2);
    }

    //cubes and trails. Put all in the same loop for Z ordening
    // for (let i = 0; i < cubes.length; i++) {
    //     cubes[i].drawTrail();
    // }
    mouseisOver_cube = false;
    for (let i = 0; i < cubes.length; i++) {
        cubes[i].drawTrail();
        cubes[i].display();

        if (mouseX > cubes[i].x-hitbox &&
            mouseX < cubes[i].x+hitbox &&
            mouseY > cubes[i].y-hitbox &&
            mouseY < cubes[i].y+hitbox)
        {
            mouseisOver_cube = true;
        }

        if (cubes[i].REMOVE){
            cubes.splice(i, 1);
        } 
    }    

    //help stuff
    image(help_button, windowWidth-48-10, 24+10);
    if(help_is_ON){
        background(0, 180);
        image(help_window, windowWidth/2, windowHeight/2);
    }
    if(mouseX > windowWidth-72-10 && mouseY < 48+10) mouseisOver_helpbtn = true;
    else mouseisOver_helpbtn = false;

    //draw cursor
    if (mouseisOver_helpbtn) image(cursor_link, mouseX, mouseY);
    else if (mouseisOver_cube) image(cursor_remove, mouseX, mouseY);
    else image(cursor_add, mouseX, mouseY);
}

function keyPressed() {
    
    if (keyCode == DELETE|| keyCode == 68){ // D
        restart();
    }
    else if(keyCode == ESCAPE)
    {
        help_is_ON = false;
    }
    else if (keyCode == 82){ // Key R
        random_is_ON = !random_is_ON;
        for (let i = 0; i < cubes.length; i++) {
            cubes[i].control_bot = random_is_ON;
        } 
    }
    else if (keyCode == 83){ // Key S
        music_is_muted = !music_is_muted;
        if (music_is_muted) masterVolume(0, 0.25);
        else {
            if(help_is_ON) masterVolume(0.15, 0.25);
            else masterVolume(1, 0.25);
        }
    }
    else if (keyCode == 72){ // Key H
        help_is_ON = !help_is_ON; 
    }
    else{
        var direction_number = -1;

        if (keyCode == UP_ARROW) {
            direction_number = 0;
        } else if (keyCode == RIGHT_ARROW) {
            direction_number = 1;
        } else if (keyCode == DOWN_ARROW) {
            direction_number = 2;
        } else if (keyCode == LEFT_ARROW) {
            direction_number = 3;
        }

        if (direction_number != -1)
        {
            for (let i = 0; i < cubes.length; i++) {
                cubes[i].setNextDirection(direction_number);
                random_is_ON = false;
                cubes[i].control_bot = false;
            }            
        }
    }

    return false; // prevent browser default;
}

function restart(){
    for (let i = 0; i < cubes.length; i++) {
        cubes[i].startDying();
    }
}

function mousePressed() {
    
    if (help_is_ON)
    {
        help_is_ON = false;
        if (!music_is_muted) masterVolume(1, 0.25);
    }
    else if (mouseisOver_helpbtn)
    {
        help_is_ON = true;
        if (!music_is_muted) masterVolume(0.15, 0.25);
    }
    else
    {        
        for (let i = 0; i < cubes.length; i++) {
            if (mouseX > cubes[i].x-hitbox &&
                mouseX < cubes[i].x+hitbox &&
                mouseY > cubes[i].y-hitbox &&
                mouseY < cubes[i].y+hitbox)
            {
                cubes[i].startDying(); 
                mouseisOver_cube = true;
            }        
        }
        if (!mouseisOver_cube) cubes.push(new Cube(mouseX, mouseY));
    }
}



class Cube {
    constructor(_x=windowWidth/2, _y=windowHeight/2) {
        this.x = _x;
        this.y = 0;
        this.fallto_y = _y;
        this.current_animation = cube_down;
        this.current_animation_sprite = 0;

        this.frame_counter = 0;

        this.intro = true;
        this.falling = true;
        this.falling_tween_time = 10 * (this.fallto_y/windowHeight);
        this.time_when_hit_the_floor = 0;

        this.alreadySwitchedDirection = true;
        this.alreadyPainted = true;
        this.wished_direction = null;
        this.past_direction = null;

        this.direction = [0, 0];

        this.trails = [];
        this.trail_index = 0;

        this.control_bot = true;
        this.bot_steps_since_change = 0;

        this.music_loops = []
        for (var i = 0; i < 4; i++) {
            this.music_loops[i] = loadSound("assets/audio/gc_" + i);
        }
        this.music = this.music_loops[0];


        this.dying = false;
        this.dying_from_y = 0;

        this.REMOVE = false;
    }

    display(){
        this.frame_counter += 1;
        if(this.dying)
        {
            // this.y = this.dying_from_y + ((this.frame_counter/10)*(windowHeight-this.dying_from_y-200));
            // image(this.current_animation[0], this.x, this.y);

            if(!this.trails.length >= 1)
            {
                this.REMOVE = true;
            }
        }
        else
        {
            if (this.intro)
            {   
                if (this.falling)
                {            
                    this.y = (this.frame_counter/this.falling_tween_time)*this.fallto_y
                    
                    if(this.y >= this.fallto_y)
                    {
                        this.y = this.fallto_y;                
                        sfx_floorhit.play();
                        this.time_when_hit_the_floor = this.frame_counter;
                        this.falling = false;
                    }
                }
                else{

                    var tween_total_time = 8;
                    var tween_current_time = this.frame_counter-this.time_when_hit_the_floor;
                    this.y =this.fallto_y + sin(tween_current_time/tween_total_time*PI)*25;

                    if(tween_current_time >= tween_total_time)
                    {
                        this.y = this.fallto_y;
                        this.intro = false;
                        this.alreadySwitchedDirection = false;
                        // this.wished_direction = floor(random(3))+1; // 1, 2, 3. 0 is up
                        this.wished_direction = dir.LEFT;
                    }
                }
                image(this.current_animation[0], this.x, this.y);
            }
            else
            {
                

                this.current_animation_sprite = (this.current_animation_sprite + ((10 * speed) / 30)) % 10;

                this.x += this.direction[0] * ((54) * (speed / 30));
                this.y += this.direction[1] * ((54) * (speed / 30));

                

                if (floor(this.current_animation_sprite) <= 1) {            
                    if (!this.alreadySwitchedDirection)
                    {
                        this.alreadySwitchedDirection = true;
                        
                        this.music.stop();
                        if (this.wished_direction == dir.UP) { //UP
                            this.current_animation = cube_up;
                            this.direction = [0, -1];
                            this.trail_index = 1;
                            this.music = this.music_loops[2];
                        } else if (this.wished_direction == dir.RIGHT) {
                            this.current_animation = cube_right;
                            this.direction = [0.88, 0.53];
                            this.trail_index = 0;
                            this.music = this.music_loops[1];
                        } else if (this.wished_direction ==dir.DOWN) { //down               
                            this.current_animation = cube_down;
                            this.direction = [0, 1];
                            this.trail_index = 0;
                            this.music = this.music_loops[3];
                        } else if (this.wished_direction == dir.LEFT) {
                            this.current_animation = cube_left;
                            this.direction = [-0.88, 0.53];;
                            this.trail_index = 2;
                            this.music = this.music_loops[0];
                        }
                        this.music.loop();
                    }

                    if (!this.alreadyPainted) {
                        this.alreadyPainted = true;
                        
                        if ((this.past_direction == dir.LEFT && this.wished_direction == dir.DOWN) || 
                            (this.past_direction == dir.UP && this.wished_direction == dir.DOWN))
                        {
                            //nothing
                        }
                        else if ((this.past_direction == dir.UP && this.wished_direction == dir.LEFT) ||
                                 (this.past_direction == dir.RIGHT && this.wished_direction == dir.UP) ||
                                 (this.past_direction == dir.LEFT && this.wished_direction == dir.RIGHT))
                        {
                            //remove lastone
                            this.trails.splice(this.trails.length-1, 1);
                        }
                        else
                        {
                            //draw a new one
                            if ((this.past_direction == dir.DOWN && this.wished_direction == dir.UP))
                            {
                                this.trails.push(new Trail(this.x, this.y-52, 2));
                            }
                            else
                            {
                                this.trails.push(new Trail(this.x, this.y, this.trail_index));
                            }

                            //draw an extra
                            if (this.past_direction == dir.UP && this.wished_direction == dir.RIGHT){
                                this.trails.push(new Trail(this.x, this.y, 1));  
                            }
                            else if (this.past_direction ==dir.DOWN && this.wished_direction == dir.LEFT){
                                this.trails.push(new Trail(this.x, this.y, 0));  
                            }
                            else if (this.past_direction == dir.LEFT && this.wished_direction == dir.UP){
                                this.trails.push(new Trail(this.x, this.y, 2));  
                            }
                            else if (this.past_direction == dir.RIGHT && this.wished_direction == dir.LEFT){
                                this.trails.push(new Trail(this.x, this.y, 0));  
                            }
                        }
                        this.past_direction = this.wished_direction;

                        //random movement
                        if(this.control_bot)
                        {
                            this.bot_steps_since_change += 1;
                            if(this.bot_steps_since_change >= 3 && random()<0.25)
                            {
                                this.bot_steps_since_change = 0;
                                var dirs_len = 4;

                                var random_value = random() <= 0.5 ? -1 : 1;
                                var random_dir = (this.wished_direction+random_value)%4;

                                if (random_dir >= dirs_len) random_dir = random_dir - dirs_len;
                                else if (random_dir < 0) random_dir = dirs_len + random_dir;  
                                this.setNextDirection(random_dir);
                            }
                        }
                    }
                } else {
                    this.alreadyPainted = false;
                }

                image(this.current_animation[floor(this.current_animation_sprite)], this.x, this.y);

                //wrap-around
                var margin = 64;
                if (this.x < -margin) this.x = windowWidth + margin;
                else if (this.x > windowWidth + margin) this.x = -margin;
                if (this.y < -margin) this.y = windowHeight + margin;
                else if (this.y > windowHeight + margin) this.y = -margin;
            }
        }
    }

    drawTrail()
    {
        for (let i = 0; i < this.trails.length; i++) {
            this.trails[i].display();
            if (this.trails[i].isReadyToDie()) {
                this.trails.splice(i, 1);
            }
        }
    }

    setNextDirection(nextdir)
    {
        if(nextdir != this.wished_direction)
        {
            this.wished_direction = nextdir;
            this.alreadySwitchedDirection = false;
        }
    }

    startDying(){
        this.dying = true;
        this.music.stop();
        this.frame_counter = 0;
        this.dying_from_y = this.y;

        for (let i = 0; i < this.trails.length; i++) {
            this.trails[i].livedTimeMax = 0.3;
        }
    }
}

class Trail {
    constructor(x, y, index = 0) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.livedTime = 0;
        this.readyToDie = false;
        this.fadingOut = false;
        this.livedTimeMax = max(10 / cubes.length, 3); 
    }

    display() {
        this.livedTime += 1;

        var a = 255;
        if (this.fadingOut) {
            var fadetime = 0.5;
            a = constrain(255 - (this.livedTime / (30*fadetime)) * 255, 0, 255);
            if (this.livedTime > fadetime * 30) {
                this.readyToDie = true;
            }
        } else {
            a = constrain((this.livedTime / (30*0.2)) * 255, 0, 255);
            if (this.livedTime > this.livedTimeMax * 30) {
                this.fadingOut = true;
                this.livedTime = 0;
            }
        }

        
        drawingContext.globalAlpha = a/255; // because tint(255, a) is slow af
        image(trail_images[this.index], this.x, this.y);
        drawingContext.globalAlpha = 1;
    }

    isReadyToDie() {
        return this.readyToDie;
    }
}