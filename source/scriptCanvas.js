$(document).ready(() => {
    // ----------------- create a shooting star background here ------------------------
    class shootingStar {
        constructor (param) {
            this.radius = param.radius;
            this.x = param.x;
            this.xinit = param.x;
            this.y = param.y;
            this.yinit = param.y;
            this.speed = param.speed;
            this.opacity = param.opacity;
            this.out = false;
        }
    }
    window.space = {
        el: null,
        can: null,
        ctx: null,
        bg: '#0e0b47',
        // bg: '#130f40',
        starNo: 200,
        xcor: [0, $(window).width()],
        ycor: [0, $('.workPage').height() + 200],
        starSize: [0.2, 2],
        starColOp: [0, 1],
        shootNo: 0,
        shootStar: [],
        shootSpeed: [1, 1.2],
        shootStarSize: [0.2, 0.8],
        shootStarColOp: [0.1, 0.1],
        xcorShoot: [0, $(window).width()],
        ycorShoot: [0, $('.workPage').height() + 200],
        shootRadGrad: 0.02,
        shootOpGrad: 0.0001,
        shootLength: 250,
        shootErase: 0,
        genRand: function(i) {
            return (i[0] + (Math.random() * i[1]));
        },
        genRandCo: function(xarr, yarr) {
            let x = Math.floor(xarr[0] + (Math.random() * xarr[1]))
            let y = Math.floor(yarr[0] + (Math.random() * yarr[1]))
            return [x, y];
        },
        setSize: function() {
            this.can.width = $(window).width();
            this.can.height = $('.workPage').height() + 200;
        },
        setBg: function() {
            this.ctx.fillStyle = this.bg;
            // this.ctx.fillStyle = '#130f40';
            this.ctx.fillRect(0, 0, $(window).width(), $('.workPage').height() + 200);
        },
        drawStar: function(x, y, rad, col) {
            this.ctx.beginPath();
            this.ctx.fillStyle = col;
            this.ctx.arc(x, y, rad, 0, 2*Math.PI);
            this.ctx.fill();
        },
        init: function() {
            this.el = $('#can');
            this.can = this.el[0];
            this.el.css({
                'position': 'absolute',
                'top': $('.workPage').offset()
            })
            this.ctx = this.can.getContext('2d');
            this.setSize();
            this.setBg();
        },
        renderStars: function() {
            // this.init();
            for (let i = 0; i < this.starNo; i++) {
                let [x, y] = this.genRandCo(this.xcor, this.ycor);
                let r = this.genRand(this.starSize);
                let op = this.genRand(this.starColOp);
                this.drawStar(x, y, r, 'rgba(240, 240, 240, ' + op + ')');
            }
        },
        eraseShooters: function() {
            let i = space.shootErase;
            let div = Math.sqrt(2);
            let change = space.shootStar[i].speed / div;
            let x, y, radius, opacity;
            if ( !space.shootStar[i].out ) {
                x = space.shootStar[i].x;
                y = space.shootStar[i].y;
                radius = space.shootStar[i].radius;
                opacity = space.shootStar[i].opacity;
                space.drawStar(x, y, radius + 1, space.bg);
                space.shootStar[i].x = x - change;
                space.shootStar[i].y = y + change;
            }
            if ( space.shootStar[i].x < (space.shootStar[i].xinit - space.shootLength) || space.shootStar[i].y > (space.shootStar[i].yinit + space.shootLength) ) {
                space.shootStar[i].out = true;
            }
            if (space.shootStar[i].out) {
                space.drawStar(x + 6*change, y - 6*change, radius, 'rgba(245, 245, 245, ' + opacity + ')');
                space.shootErase += 1;
            }
            window.requestAnimationFrame(space.eraseShooters);
        },
        animShooters: function() {
            // space.setBg();
            // space.renderStars();
            // for (let i = 0; i < space.shootNo; i++) {
            let i = space.shootNo;
            let div = Math.sqrt(2);
            let change = space.shootStar[i].speed / div;
            if ( !space.shootStar[i].out ) {
                let x = space.shootStar[i].x;
                let y = space.shootStar[i].y;
                let radius = space.shootStar[i].radius;
                let opacity = space.shootStar[i].opacity;
                space.drawStar(x, y, radius, 'rgba(245, 245, 245, ' + opacity + ')');            
                space.shootStar[i].x = x - change;
                space.shootStar[i].y = y + change;
                space.shootStar[i].radius += space.shootRadGrad;
                space.shootStar[i].opacity += space.shootOpGrad;
            }
            if ( space.shootStar[i].x < (space.shootStar[i].xinit - space.shootLength + 10) || space.shootStar[i].y > (space.shootStar[i].yinit + space.shootLength - 10) ) {
                space.shootStar[i].out = true;
            }
            if (space.shootStar[i].out) {
                space.shootStar[i].out = false;
                space.shootStar[i].x = space.shootStar[i].xinit;
                space.shootStar[i].y = space.shootStar[i].yinit;
                // while (!space.erase) {
                //     space.eraseShooters();
                // }
                // space.erase = false;
                // space.shootCheck = 0;
                space.shootNo += 1;
                space.renderShooters();
            }
            window.requestAnimationFrame(space.animShooters);
        },
        renderShooters: function() {
            // for (let i = 0; i < this.shootNo; i++) {
            let [xt,yt] = this.genRandCo(this.xcorShoot, this.ycorShoot);
            let param = {
                x: xt,
                y: yt,
                radius: this.genRand(this.shootStarSize),
                opacity: this.genRand(this.shootStarColOp),
                speed: Math.floor(this.genRand(this.shootSpeed) + 1)
            }
            this.shootStar.push(new shootingStar(param));
            // }
            // console.log(this.shootStar)
        },
    }
    space.init();
    space.renderStars();
    space.renderShooters();
    space.animShooters();
    setTimeout(() => {
        space.eraseShooters();      
    }, 4000)

})