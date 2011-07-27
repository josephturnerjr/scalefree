var WIDTH = 600;
var HEIGHT = 600;
var NR_FRIENDS = 10;
var LINK_COEFF = 1;
var REP_COEFF = 1;
var DAMP_COEFF = -700;
var INTEG_TIME = 0.05;
var cxt, cvs;
var viewport = Object();
var you;
var friends_ = Object();
var m_down = false;
var start;
function init(){
    cvs = document.getElementById("graph");
    cxt = cvs.getContext('2d');
    viewport.center = new Vector(0, 0);
    viewport.scale = 1.0;
    $(document).keydown(handle_keydown).mousewheel(handle_scroll).mousedown(function(event){m_down = true; start = new Vector(event.pageX, event.pageY)}).mouseup(function(){m_down = false;}).mousemove(handle_move);
    create_graph();
}
function handle_move(event){
    if(m_down){
        viewport.center.x -= (event.pageX - start.x) * viewport.scale;
        viewport.center.y -= (event.pageY - start.y) * viewport.scale;
        start = new Vector(event.pageX, event.pageY);
    }
}

function handle_scroll(event, delta){
    if(delta > 0){
        viewport.scale *= 0.85;
        return;
    }
    if(delta < 0){
        console.log(delta);
        viewport.scale /= 0.85;
        return;
    }
}


function handle_keydown(event){
    switch(event.which){
        case 77:
            viewport.scale *= 0.95;
            break;
        case 78:
            viewport.scale /= 0.95;
            break;
        case 37: //left
            viewport.center.x -= (WIDTH/32) * viewport.scale
            break;
        case 38: //up
            viewport.center.y -= (HEIGHT/32) * viewport.scale
            break;
        case 39: //right
            viewport.center.x += (WIDTH/32) * viewport.scale
            break;
        case 40: //down
            viewport.center.y += (HEIGHT/32) * viewport.scale
            break;
    }
}
function iterate(){
    draw();
    calc_forces();
    integrate(INTEG_TIME);
}
// physics
function calc_forces(){
    for(i in friends_){
        var f = friends_[i];
        if(f == you)
            continue;
        // calculate damping force
        f.force.x = DAMP_COEFF * f.vel.x;
        f.force.y = DAMP_COEFF * f.vel.y;
        calc_edge_forces(f);
        for(j in friends_){
            if(j == i){
                continue;
            }
            calc_rep_force(f, friends_[j]);
        }
    }
}
function calc_edge_forces(f){
    for(l in f.edges){
        //calc_rep_force(f, f.edges[l].person);
        f.force.x += f.edges[l].coeff * (f.edges[l].person.pos.x - f.pos.x)
        f.force.y += f.edges[l].coeff * (f.edges[l].person.pos.y - f.pos.y)
    }
}
function calc_rep_force(f, other){
    var x = f.pos.x - other.pos.x;
    var y = f.pos.y - other.pos.y;
    var r = Math.sqrt(x * x + y * y);
    var a = f.mass * other.mass *REP_COEFF / (r*r*r);
    f.force.x += a * x;
    f.force.y += a * y;
}
function integrate(t){
    // uber-simple integration (stability WHO?!)
    for(i in friends_){
        var f = friends_[i];
        f.pos.x += t*f.vel.x;
        f.pos.y += t*f.vel.y;
        f.vel.x += t*f.force.x/f.mass;
        f.vel.y += t*f.force.y/f.mass;
    }
}
//drawing
function transform_to_vp(vec){
    var x = (vec.x -viewport.center.x + (WIDTH/2 * viewport.scale)) / viewport.scale;
    var y = (vec.y  -viewport.center.y+ (HEIGHT/2 * viewport.scale)) / viewport.scale;
    return new Vector(x, y);
}
function in_vp(v){
    if((v.x > WIDTH || v.x < 0)||(v.y > HEIGHT || v.y < 0)) 
        return false;
    return true;
}
function draw(){
    cvs.width = cvs.width;
    cxt.beginPath();
    var ystart = transform_to_vp(you.pos);
    for(e in you.edges){
        var end = transform_to_vp(you.edges[e].person.pos);
        cxt.moveTo(ystart.x, ystart.y);
        cxt.lineTo(end.x, end.y);
    }
    cxt.strokeStyle = "#FF0000";
    cxt.lineWidth = 0.125;
    cxt.stroke();
    cxt.beginPath();
    for(i in friends_){
        var f = friends_[i];
        for(j in f.edges){
            if(f.edges[j].person == you)
                continue;
            var start = transform_to_vp(f.pos);
            var end = transform_to_vp(f.edges[j].person.pos);
            cxt.moveTo(start.x, start.y);
            cxt.lineTo(end.x, end.y);
        }
    }
    cxt.strokeStyle = "#FFFFFF";
    cxt.lineWidth = 0.125;
    cxt.stroke();
    for(i in friends_){
        friends_[i].draw();
    }
}
function draw_circle(pos, rad, color){
    cxt.fillStyle = color;
    cxt.beginPath();
    cxt.arc(pos.x, pos.y, rad, 0, Math.PI*2, true);
    cxt.closePath();
    cxt.fill(); 
}

function draw_text(pos, text){
    cxt.beginPath();
    cxt.fillStyle = "#FFFFFF";
    cxt.fillText(text, pos.x, pos.y);
    cxt.closePath();
}
//classes
function Person(user, x, y, mass){
    this.id = user.id;
    this.name = user.name;
    this.edges = Object();
    this.mass = mass;
    this.pos = new Vector(x, y);
    this.vel = new Vector(0.0, 0.0);
    this.force = new Vector(0.0, 0.0);
    this.rad = 0.25;
    this.color = "#FFFFFF";
    this.draw = function(){
        var p = transform_to_vp(this.pos);
        if(viewport.scale < 0.125)
            draw_text(p, this.name);
        else
            draw_circle(p, this.rad / viewport.scale, this.color);
    }
}
function Edge(person, coeff){
    this.person = person;
    this.coeff = coeff;
}
function Vector(x, y){
    this.x = x;
    this.y = y;
}
