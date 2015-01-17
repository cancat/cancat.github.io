function Scene(canvas, imgList) {
	this.layer = [];
	this.oriLayerData = [];
	this.canvas = canvas;
	this.imgList = imgList;
	this.curLayer = 0;
	for (var i = 0; i < imgList.length; i++) {
		var tCanvas = document.createElement('canvas');
		var tCtx = tCanvas.getContext('2d');
		var image = imgList[i].data;
		this.SceneW = tCanvas.width = image.width;
		this.SceneH = tCanvas.height = image.height;
		this.layer[i] = tCanvas;
		tCtx.drawImage(image, 0, 0);
		this.oriLayerData[i] = tCtx.getImageData(0, 0, this.SceneW, this.SceneH);
	}
}

var p = Scene.prototype;

p.drawLayer = function (index) {
	var image = this.layer[index];
	var ctx = this.canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
}

p.draw = function () {
	this.canvas.width = this.SceneW;
	this.canvas.height = this.SceneH;
	for (var i = 0; i < this.layer.length; i++) {
		this.drawLayer(i);
	}
}

p.filterLayer = function (color, index) {
	var canvas = this.layer[index];
	var ctx = canvas.getContext('2d');
	var image = this.imgList[index].data;
	canvas.width = canvas.width;
	ctx.drawImage(image, 0, 0);
	var imageData = ctx.getImageData(0, 0, this.SceneW, this.SceneH);
	var d = imageData.data;
	for (var i = 0; i < d.length; i+=4) {
		d[i] *= color[0] / 255;
		d[i+1] *= color[1] / 255;
		d[i+2] *= color[2] / 255;
	}
	ctx.putImageData(imageData, 0, 0);
	this.draw();
}

p.resetLayer = function (index) {
	var canvas = this.layer[index];
	var ctx = canvas.getContext('2d');
	var imageData = this.oriLayerData[index];
	ctx.putImageData(imageData, 0, 0);
	this.draw();
}

p.checkLayer = function (x, y) {
	if (x < 0 || y < 0 || x > this.SceneW - 1 || y > this.SceneH - 1)
		return false;
	var row = y;
	var col = x;
	for (var i = this.layer.length; i > 0; i--) {
		var data = this.oriLayerData[i - 1].data;
		var alpha = data[(row * this.SceneW + col) * 4 + 3];
		if (alpha == 255)
			return i - 1;
	}
	return false;
}

p.setCurLayer = function (i) {
	this.curLayer = i;
}