class Bear{
	constructor(){
		this.canvas = document.getElementById("bear");
		this.context = this.canvas.getContext("2d");
        //console.log(this.context);
        this.lastRefreshTime = Date.now();
		this.sinceLastSpawn = 0;
		this.sprites = [];
		this.score = 0;
		this.spriteData;
		this.spriteImage;
		this.bear;
		this.buttons = [];
		this.ui = [];
		this.sprites = [];
		this.level = 2;
		this.debug = false;
		this.font = '30px Verdana';
		this.txtoptions = {
			alignment: "center",
			font: 'Verdana',
			fontSize: 12,
			lineHeight: 15,
			color: "#fff"
		}

        const game = this;
		const options = {
			assets:[
				"beargame.json",
				"beargame.png"
			],
			oncomplete: function(){
				const progress = document.getElementById('progress');
				progress.style.display = "none";
				game.load();
			},
			onprogress: function(value){
				const bar = document.getElementById('progress-bar');
				bar.style.width = `${value*100}%`;
			}
		}
        
        const preloader = new Preloader(options);
    }

    loadJSON(json, callback) {   
		const xobj = new XMLHttpRequest();
			xobj.overrideMimeType("application/json");
		xobj.open('GET', json + '.json', true);
		const game = this;
		xobj.onreadystatechange = function () {
			  if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText, game);
			  }
		};
		xobj.send(null);  
	}

    load(){
		const game = this;
		this.loadJSON("beargame", function(data, game){
			game.spriteData = JSON.parse(data);
			game.spriteImage = new Image();
			game.spriteImage.src = game.spriteData.meta.image;
			game.spriteImage.onload = function(){	
				game.init();
			}
		})
	}

	init(){
		const fps = 25;
		this.config = {};
		this.config.iceberg = { row:105, col:160, x:-200, y:200 };
		this.config.height = 413;
		this.config.bear = {x: 170, y:100 };//Starting position of bear
		this.config.jump = { x: this.config.iceberg.col*(fps/11), y: this.config.iceberg.row*(fps/11)};
		this.config.speed = 80;//Starting speed of icebergs, pixel travel per second
		this.config.duration = 10000;//Game duration in milliseconds
		this.config.lives = 2;
		this.config.levels = 1;
		this.lives = this.config.lives;
		//Create bear anims
		let anims = [];
		anims.push(new Anim(
                            "static", 
                            {
                                frameData:this.spriteData.frames, 
                                frames:[0], 
                                loop:false, 
                                fps:fps
                            }
                        )
                );
		anims.push(new Anim(
                            "forward", 
                            {
                                frameData:this.spriteData.frames, 
                                frames:[0,"..",10], loop:false, 
                                motion:{ x:0, y:this.config.jump.y}, 
                                fps:fps, 
                                oncomplete(){ 
                                    game.jumpComplete(); 
                                }
                            }
                        )
                );
		anims.push(new Anim(
                            "backward", 
                            {
                                frameData:this.spriteData.frames, 
                                frames:[11,"..",21], 
                                loop:false, 
                                motion:{ x:0, y:-this.config.jump.y}, 
                                fps:fps, 
                                oncomplete(){ 
                                    game.jumpComplete(); 
                                }
                            }
                        )
                    );
		anims.push(new Anim(
                            "left", 
                            {
                                frameData:this.spriteData.frames, 
                                frames:[22,"..",32], 
                                loop:false, 
                                motion:{ x:-this.config.jump.x, y:0}, 
                                fps:fps, 
                                oncomplete(){ 
                                    game.jumpComplete(); 
                                }
                            }
                        )
                    );
		anims.push(new Anim(
                            "right", 
                            {
                                frameData:this.spriteData.frames, 
                                frames:[33,"..",43], 
                                loop:false, 
                                motion:{ x:this.config.jump.x, y:0}, 
                                fps:fps, 
                                oncomplete(){ 
                                    game.jumpComplete(); 
                                }
                            }
                        )
                    );


		const bearoptions = {
			context: this.context,
			debug: this.debug,
			image: this.spriteImage,
			x: this.config.bear.x,
			y: this.config.bear.y,
			anchor: new Vertex(0.35, 0.6),
			scale: 0.8,
			anims: anims
		}
		//Create bear
		this.bear = new AnimSprite("bear", bearoptions);
		this.bear.anim = "static";
		console.log(this.bear);
		this.sprites.push(this.bear);
		
		const buttonoptions = {
			game: this,
			frame: "xarrow{04}.png",
			index: 1,
			x: 30,
			y: 490,
			anchor: new Vertex(0.5, 0.5),
			scale: 1.0,
		}
		this.buttons = [];
		//Buttons - xarrow000x.png 1-4
		
		for(let i=1; i<=4; i++){
			buttonoptions.index = i;
			buttonoptions.x = (i-1) * 75 + 47;
			let button = new Sprite("button", buttonoptions);
			this.buttons.push(button);
			this.sprites.push(button);
		}
		
		const game = this;
		if ('ontouchstart' in window){
			this.canvas.addEventListener("touchstart", function(event){ game.tap(event); });
		}else{
			this.canvas.addEventListener("mousedown", function(event){ game.tap(event); });
		}
		
		this.state = "initialised";
		//this.state = "gameover";
		
		this.refresh();
	}

    refresh() {
		const now = Date.now();
		const dt = (now - this.lastRefreshTime) / 1000.0;

		this.update(dt);
		this.render();

		this.lastRefreshTime = now;
		
		const game = this;
		requestAnimationFrame(function(){ game.refresh(); });
	};

    update(dt){
		
		for(let sprite of this.sprites){
			if (sprite==null) continue;
			sprite.update(dt);
		}
		
	}
	
	spawn(anim){
		let sprite;
		let found = false;
		for(sprite of this.sprites){
			if (sprite._anim == anim){
				found = true;
				break;
			}
		}
	}
	
	render(){
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		for(let sprite of this.sprites) sprite.render();
		
	}
	
	getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
		const clientX = evt.targetTouches ? evt.targetTouches[0].pageX : evt.pageX;
		const clientY = evt.targetTouches ? evt.targetTouches[0].pageY : evt.pageY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }
	
	tap (evt) {
		if (this.state=="initialised"){
			this.state = "instructions2";
		}else if (this.state=="instructions2"){
			this.startGame();
		}else if (this.state=="gameover" || this.state=="complete"){
			this.restart();
		}
		if (this.state!="ready") return;
		if (this.bear.anim.name!="static") return;
		
		const mousePos = this.getMousePos(evt);
		const canvasScale = this.canvas.width / this.canvas.offsetWidth;
		const loc = {};
		
		loc.x = mousePos.x * canvasScale;
		loc.y = mousePos.y * canvasScale;
		
		let i=0;
		for (let button of this.buttons) {
			if (button.hitTest(loc)){
				this.bear.iceberg = null;
				switch(i){
					case 0:
						this.bear.anim = "left";
						break;
					case 1:
						this.bear.anim = "backward";
						break;
					case 2:
						this.bear.anim = "forward";
						break;
					case 3:
						this.bear.anim = "right";
						break;
				}
			}
			i++;
		}
	}

    startGame(){
		this.startTime = Date.now();
		this.state = "ready";
	}

    jumpComplete(){
		this.bear.anim = "static";
		return;
	}

}