// vim: ts=4 sw=4
var Block_count=0;
Block.linkStart = null;
Block.widgets=[];
Block.classes={};
function Block()
{
	this.init();
}
Block.register=function(type,b)
{
	Block.classes[type] = b;
}
Block.prototype.init=function() {
	this.id = Block_count;
	this.div = $('<div></div>');
	this.type='block';
	this.div.attr('id','obj'+this.id);
	this.div.css('position','absolute');
	this.div.css('cursor','pointer');
	this.div.css('background-color','#00ff00');
	this.div.attr('class','block');
	this.setPosition(100,100);
	this.setSize(50,50);
	this.signals=[];
	this.actions=[];
	Block_count++;
	Block.widgets.push(this);
}

Block.getBlockTypes=function() {
	var types=[];

	for(var k in Block.classes) types.push(k);
	return types;
}

Block.factory=function(type) {
	var i;
	var cls = Block.classes[type];

	if (cls)
		return new cls();
	else
		return new Block();
}

Block.prototype.serialize=function(obj) {
	obj.id = this.id;
	var pos = this.getPosition();
	var size = this.getSize();
	obj.x = pos[0];
	obj.y = pos[1];
	obj.w = size[0];
	obj.h = size[1];
	obj.type = this.type;
	return obj;
}
Block.restore=function(a) {
	var n = Block.factory(a.type);
	n.id = a.id;
	n.setPosition(a.x,a.y);
	n.setSize(a.w,a.h);
	n.type = a.type;
	// Call the restore of the derived class in the future
	return n;
}
Block.prototype.draw=function() {
	var i;
	var pos = this.getPosition();
	var size = this.getSize();
	this.div.empty();
	for(i=0;i<this.signals.length;i++) {
		this.div.append('<div class=signal id=signal_'+this.id+'_'+i+'>');
		$('#signal_'+this.id+'_'+i).css('position','absolute').css('width',30).css('height',15).css('left',size[0]).css('top',i*15);
		$('#signal_'+this.id+'_'+i).html(this.signals[i].name);
	}
	for(i=0;i<this.actions.length;i++) {
		this.div.append('<div class=signal id=action_'+this.id+'_'+i+'>');
		$('#action_'+this.id+'_'+i).css('position','absolute').css('width',30).css('height',15).css('left',-30).css('top',i*15);
		$('#action_'+this.id+'_'+i).html(this.actions[i].name);
	}
}
Block.prototype.addSignal=function(con) {
	this.signals.push(con);
}
Block.prototype.getSignals=function() {
	return this.signals;
}
Block.prototype.addAction=function(con) {
	this.actions.push(con);
}
Block.prototype.findSignalPos=function(s) {
	var i;

	for(i=0;i<this.signals.length;i++) {
		if (this.signals[i].name == s)
			return i;
	}
	return -1;
}
Block.prototype.findActionPos=function(s) {
	var i;

	for(i=0;i<this.actions.length;i++) {
		if (this.actions[i].name == s)
			return i;
	}
	return -1;
}
Block.prototype.getActions=function() {
	return this.actions;
}

Block.prototype.attach=function(parent) {
	parent.append(this.div);
	this.div.draggable();
	var self = this;
	this.div.click(function() {
		if (Block.current) {
			Block.current.div.resizable("destroy");
			Block.current.setFocus(false);
		}
		self.div.resizable();
		self.setFocus(true);
		Block.current = self;
	});
	this.div.bind("dragstop", function(event,ui) {
		FBP_refreshLines();
	});
	this.draw();
}

Block.prototype.enableContextMenu=function(b) {
	if (b) {
		var self = this;
		$('#myMenu').css('left',this.div.css('left'));
		$('#myMenu').css('top',this.div.css('top'));
		$('#myMenu').menu({
			menu:'myMenu'
		}, function(action, el, pos) {
			if (action == 'link') {
				if (Block.linkStart != null) {
					if (Block.linkStart == self) {
						alert("Can not link to myself");
						return;
					}
					new Link(Block.linkStart,"on",self,"on");
					Block.linkStart.setFocus(false);
					Block.linkStart = null;
				} else {
					Block.linkStart = self;
					self.setFocus();
				}
			}
		});
	} else {
		$('#myMenu').hide();
	}
}

Block.prototype.setFocus=function(b) {
	if (b) {
		this.div.addClass('shadow');
		this.enableContextMenu(true);
	} else {
		this.div.removeClass('shadow');
		this.enableContextMenu(false);
	}
}

Block.prototype.setPosition=function(x,y) {
	this.div.css('left',x).css('top',y);
}

Block.prototype.setSize=function(w,h) {
	this.div.css('width',w).css('height',h);
}
Block.prototype.getDIV=function() {
	return this.div;
}

Block.prototype.getPosition=function() {
	return [Block.getpx(this.div.css('left')),Block.getpx(this.div.css('top'))];
}
Block.prototype.getSize=function() {
	return [Block.getpx(this.div.css('width')),Block.getpx(this.div.css('height'))];
}


Block.prototype.refresh=function(w) {
	this.setPosition(w['x'],w['y']);
}


Block.getClass=function(name) {
	return Block.classes[name];
}

Block.getpx=function(v) {
	var index = v.indexOf('px');
	if (index >= 0) 
		return parseInt(v.substr(0,index));
	else
		return parseInt(v);
}

Block.prototype.getBounds=function() {
	var pos = this.getPosition();
	var size = this.getSize();
	var bounds = {};
	bounds.left = pos[0];
	bounds.top = pos[1];
	bounds.right = pos[0]+size[0];
	bounds.bottom = pos[1]+size[1];
	return bounds;
}

Block.hitTest=function(x,y) {
	var i;

	for(i=0;i<Block.widgets.length;i++) {
		var bounds = Block.widgets[i].getBounds();
		if(x >= bounds.left){
			if(x <= bounds.right){
				if(y >= bounds.top){
					if(y <= bounds.bottom){
						return Block.widgets[i];
					}
				}
			}
		}
	}
	return null;
}
