function calcScale (w, h) {
	if (w > 1000 || h > 500) {
		return Math.max(w / 1000, h / 480);
	}
	return 1;
}

function Scene(canvas, imgList) {
	this.canvas = canvas;
	this.reset();
	if (!!imgList) {
		this.loadLayer(imgList);
	}
}

var p = Scene.prototype;

p.reset = function () {
	this.layer = [];
	this.imgList = [];
	this.oriLayerData = [];
	this.multiplyColor = [];
	this.curLayer = 0;
}

p.loadLayer = function (imgList) {
	this.reset();
	this.imgList = imgList;
	for (var i = 0; i < imgList.length; i++) {
		var tCanvas = document.createElement('canvas');
		var tCtx = tCanvas.getContext('2d');
		var image = imgList[i].data;
		var scale = calcScale(image.width, image.height);
		this.SceneW = tCanvas.width = Math.floor(image.width / scale);
		this.SceneH = tCanvas.height = Math.floor(image.height / scale);
		this.layer[i] = tCanvas;
		tCtx.drawImage(image, 0, 0, tCanvas.width, tCanvas.height);
		this.oriLayerData[i] = tCtx.getImageData(0, 0, this.SceneW, this.SceneH);
		this.multiplyColor.push('rgb(255,255,255)');
	}
}

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

p.addLayer = function (layer) {
	var length = this.layer.length;
	var image = layer.data;
	var tempCanvas = document.createElement('canvas');
	var tempCtx = tempCanvas.getContext('2d');
	tempCanvas.width = this.SceneW;
	tempCanvas.height = this.SceneH;
	tempCtx.drawImage(image, 0, 0, this.SceneW, this.SceneH);
	this.imgList.push(layer);
	this.layer[length] = tempCanvas;
	this.oriLayerData[length] = tempCtx.getImageData(0, 0, this.SceneW, this.SceneH);
	this.multiplyColor.push('rgb(255,255,255)');
}

p.filterLayer = function (color, index) {
	var canvas = this.layer[index];
	var ctx = canvas.getContext('2d');
	var image = this.imgList[index].data;
	canvas.width = canvas.width;
	ctx.drawImage(image, 0, 0, this.SceneW, this.SceneH);
	var imageData = ctx.getImageData(0, 0, this.SceneW, this.SceneH);
	var d = imageData.data;
	for (var i = 0; i < d.length; i+=4) {
		d[i] *= color[0] / 255;
		d[i+1] *= color[1] / 255;
		d[i+2] *= color[2] / 255;
	}
	ctx.putImageData(imageData, 0, 0);
	this.draw();
	this.multiplyColor[index] = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
}

p.resetLayer = function (index) {
	var canvas = this.layer[index];
	var ctx = canvas.getContext('2d');
	var imageData = this.oriLayerData[index];
	ctx.putImageData(imageData, 0, 0);
	this.draw();
	this.multiplyColor[index] = 'rgb(255,255,255)';
}

p.checkLayer = function (x, y) {
	if (x < 0 || y < 0 || x > this.SceneW - 1 || y > this.SceneH - 1)
		return;
	var row = y;
	var col = x;
	for (var i = this.layer.length; i > 0; i--) {
		var data = this.oriLayerData[i - 1].data;
		var alpha = data[(row * this.SceneW + col) * 4 + 3];
		if (alpha == 255)
			return i - 1;
	}
	return;
}

p.setCurLayer = function (i) {
	this.curLayer = i;
}

p.getScale = function () {
	return {
		width: this.canvas.width,
		height: this.canvas.height
	}
}