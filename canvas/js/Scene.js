function Scene(canvas, imgManager) {
	this.layer = [];
	this.oriLayerData = [];
	this.canvas = canvas;
	for (var i = 0; i < imgManager.getLen(); i++) {
		var tCanvas = document.createElement('canvas');
		var tCtx = tCanvas.getContext('2d');
		var image = imageManager.get('layer-' + i);
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