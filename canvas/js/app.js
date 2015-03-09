function toRgb (hex) {
	var r = parseInt(hex.substr(1,2),16);
	var g = parseInt(hex.substr(3,2),16);
	var b = parseInt(hex.substr(5,2),16);
	return [r, g, b];
}
function imagesSelected(myFiles) {
  	for (var i = 0, f; f = myFiles[i]; i++) {
    	var imageReader = new FileReader();
    	imageReader.onload = (function(aFile) {
      		return function(e) {
        		var image = new Image();
        		image.src = e.target.result;
        		image.onload = (function (name) {
        			return function () {
        				var n = name.split('.')[0];
        				scene.loadLayer([{label:n,data:this}]);
        				scene.draw();
        				maskCanvas.width = scene.getScale().width;
						maskCanvas.height = scene.getScale().height;
						drawBackup(backUpCanvas, canvas);
        				canvas_wrapper.style.width = scene.getScale().width;
        				setLayerList();
        			}
        		})(aFile.name);
      		};
    	})(f);
    	imageReader.readAsDataURL(f);
  	}
}
function setLayerList () {
	var layerHtml = [];
	layerHtml.push('<ul class="list-unstyled">');
	$.each(scene.imgList, function (i, img) {
		var liHtml = ['<li><a class="layer layer-', i, i==0?' current':'', '" href="#" data-layer="', i, '"><span class="curcolor" style="background:', scene.multiplyColor[i],'"></span>', img.label, '</a></li>'].join('');
		layerHtml.push(liHtml);
	});
	layerHtml.push('</ul>');
	$('.layer-list').html(layerHtml.join(''));
}
function drawPoly (canvas, dotArray) {
	var ctx = canvas.getContext('2d');
	ctx.beginPath();
	$.each(dotArray, function (i, dot) {
		i == 0 ? ctx.moveTo(dot[0],dot[1]) : ctx.lineTo(dot[0],dot[1]);
	})
	ctx.closePath();
	ctx.fill();
}
function nearDot (a, b) {
	var x_pow = Math.pow(a[0] - b[0], 2);
	var y_pow = Math.pow(a[1]- b[1], 2);
	var distance = Math.sqrt(x_pow + y_pow);
	if (distance < 6)
		return true;
	else
		return false;
}
function clip (canvas, dotArray) {
	var ctx = canvas.getContext('2d');
	ctx.beginPath();
	$.each(dotArray, function (i, dot) {
		i == 0 ? ctx.moveTo(dot[0],dot[1]) : ctx.lineTo(dot[0],dot[1]);
	})
	ctx.closePath();
	ctx.clip();

}
function isEmptyLayer(data) {
	for (var i = 0; i < data.length; i+=4) {
		if (data[i+3] != 0) {
			return false
		}
	}
	return true;
}
function drawBackup (backup, canvas) {
	backup.width = scene.getScale().width;
	backup.height = scene.getScale().height;
	var ctx = backup.getContext('2d');
	ctx.drawImage(canvas, 0, 0);
}
var canvas = document.getElementById('mainCanvas');
var reset_btn = document.getElementById('reset-btn');
var current_layer = document.getElementById('current-layer');
var layer_pointer = document.getElementById('layer-pointer');
var canvas_wrapper = document.getElementById('canvas-wrapper');
var backUpCanvas = document.createElement('canvas');
var maskCanvas = document.createElement('canvas');
var scene = new Scene(canvas);
var imageManager = new ImageManager();
imageManager.load({
	'background': 'img/ganli/background.png',
	'wall': 'img/ganli/wall.png',
	'edge': 'img/ganli/edge.png',
	'normald': 'img/ganli/normald.png',
	'scrolld': 'img/ganli/scrolld.png',
	'handrail': 'img/ganli/handrail.png'
}, function () {
	var srcList = [{label:'背景',data:imageManager.get('background')}, {label:'墙面',data:imageManager.get('wall')}, {label:'挑檐',data:imageManager.get('edge')}, {label:'普通门',data:imageManager.get('normald')}, {label:'卷帘门',data:imageManager.get('scrolld')}, {label:'楼梯栏杆',data:imageManager.get('handrail')}];
	var selectT = false, dotStart = [], lastDot = [], dotArray = [];
	scene.loadLayer(srcList);
	scene.draw(canvas);
	drawBackup(backUpCanvas, canvas);
	canvas_wrapper.style.width = scene.getScale().width;
	reset_btn.onclick = function (e) {
		e.preventDefault();
		scene.resetLayer(scene.curLayer);
		var elem = '.layer-' + scene.curLayer + ' .curcolor';
		$(elem).css({
			background: '#ffffff'
		});
	}
	canvas.onmouseenter = function (e) {
		e.preventDefault();
		if (!selectT) {
			canvas.style.cursor = 'pointer';
			document.getElementById('layer-pointer').style.display = 'inline';
		}
	}
	canvas.onmouseleave = function (e) {
		e.preventDefault();
		canvas.style.cursor = 'default';
		document.getElementById('layer-pointer').style.display = 'none';
	}
	canvas.onmousemove = function (e) {
		e.preventDefault();
		var x = e.offsetX;
		var y = e.offsetY;
		var layer = scene.checkLayer(x, y);
		if (layer != undefined) {
			layer_pointer.innerText = scene.imgList[layer].label;
			layer_pointer.style.left = x + 12;
			layer_pointer.style.top = y;
		}
		if (selectT) {
			if (nearDot([x,y],dotStart)) {
				if (dotArray.length > 2) {
					canvas.style.cursor = 'pointer';
				}
			} else {
				canvas.style.cursor = 'default';
			}
		}
		return;
	}
	maskCanvas.width = scene.getScale().width;
	maskCanvas.height = scene.getScale().height;
	var maskCtx = maskCanvas.getContext('2d');
	canvas.onclick = function (e) {
		e.preventDefault();
		var x = e.offsetX;
		var y = e.offsetY;
		if (!selectT) {
			$(document).trigger({
				type: 'changeLayer',
				layer: scene.checkLayer(x, y)
			})
		} else {
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = 'rgba(255,0,0,.4)';
			if (dotArray.length == 0){
				dotStart = [x,y];
			} else {
				if (nearDot([x,y],dotStart)) {
					drawPoly(canvas, dotArray);
					maskCtx.fillStyle = 'black';
					drawPoly(maskCanvas, dotArray);
					dotArray = [];
					dotStart = [];
					return;
				}
			}
			dotArray.push([x,y]);
			ctx.fillStyle = 'red';
			ctx.beginPath();
			ctx.arc(x,y,3,0,2*Math.PI,false);
			ctx.fill();
			ctx.closePath();
		}
	}
	var options = {
		colors: [["#F3ED86", "#F5EC62", "#FAE600", "#CAAD00", "#AC9600", "#817214", "#F6E761", "#FAE22F", "#FEDB00", "#FFD100", "#DBAE00", "#AF8F00", "#998000", "#FAE15A", "#FAE051", "#FBDE4A", "#FFCE00", "#CE9D00", "#B38A00", "#8A761A", "#F9DF79", "#F3E2A7", "#FBDB6E", "#F5DD92", "#FDD44F", "#FDC745", "#FFC726", "#FFB300", "#EBAB00", "#C69200", "#BB8900", "#AA800E", "#A17C00", "#836514", "#EFDF85", "#F2D65E", "#F1CD44", "#F1AB00", "#D49100", "#A67A00", "#715913", "#F8D583", "#FBCF8D", "#FEC85A", "#FDC87D", "#FFBC3A", "#FFB754", "#FF9F00", "#FF9A00", "#E47F00", "#D67500", "#B67100", "#9E6209", "#7A560F", "#6C4713", "#EFC868", "#F1BB46", "#EFAA23", "#ED8000", "#CF7600", "#9F6000", "#715821", "#FBD09D", "#FFB57B", "#FEC688", "#FF963B", "#FFA94F", "#FF7200", "#FF7300", "#E76F00", "#CA4E00", "#C06600", "#933F00", "#995409", "#51260B", "#ECD6AF", "#FFBFA0", "#EFC18A", "#FFA97D", "#ED9B4F", "#FF8642", "#E96B10", "#FF6900", "#CD5806"], ["#DA5C05", "#A24E12", "#A24A13", "#613517", "#853C10", "#FDC3AA", "#FFA28B", "#FF9C71", "#FF8E70", "#FF7E43", "#FF6C3B", "#FF5F00", "#FF5200", "#E55300", "#E54800", "#C2510F", "#A83C0F", "#6F3014", "#863514", "#FFB6B1", "#FF897B", "#FF6141", "#FD4703", "#D84519", "#9A3416", "#703222", "#FFACB9", "#FE9DB0", "#FAAFC2", "#FF818C", "#FF859A", "#FB6581", "#FF5B60", "#F9455B", "#F9425F", "#F02233", "#E23828", "#D81F2A", "#D02433", "#C0362C", "#B0232A", "#A12830", "#792720", "#7C211E", "#5E2728", "#F8B8CB", "#FC8DA9", "#F85D7E", "#EA0437", "#D21034", "#B31B34", "#7C2230", "#F8A1BE", "#F3BCD4", "#F8779E", "#F59BBD", "#F23F72", "#F2558A", "#E90649", "#E40050", "#C30C3E", "#CB0447", "#9C1E3D", "#AA113F", "#93173B", "#EBC6D3", "#EB9BB2", "#E44D6F", "#DB0C41", "#C10435", "#9E1B34", "#892034", "#EBADCD", "#E87BAC", "#E34585", "#D7004D", "#B10042", "#902147", "#752641", "#FA9FCC", "#F97DB8", "#F34E9A", "#E61577", "#D00063"], ["#AA1054", "#7A1D42", "#ECBBDD", "#E86FB8", "#E0218A", "#AE0055", "#96004B", "#6C193F", "#F293D1", "#EF6ABF", "#E5239D", "#D60077", "#AE005F", "#8A0753", "#6A1D44", "#F7A7DB", "#F575C9", "#EF40B0", "#C90081", "#A6006B", "#890857", "#F2B0DF", "#EFC3E4", "#EE86D3", "#E270CD", "#E653BC", "#D733B4", "#E032AF", "#C40098", "#C41E99", "#A70084", "#AC0481", "#970076", "#7A1A57", "#820063", "#E8B7E5", "#E6A2E0", "#DF81D6", "#C70BAC", "#B3009D", "#9E0389", "#7B2266", "#E3C0E6", "#D99CE1", "#CA65D1", "#A91BB0", "#962399", "#70266C", "#D9BFE0", "#CFA5E4", "#C79DD8", "#BB99DA", "#CBA4D4", "#C084DC", "#B279C8", "#A276CC", "#92499E", "#A24CC8", "#9950B2", "#8348B5", "#6C1B72", "#9016B2", "#7E2B97", "#59058D", "#5F1D5F", "#7D0996", "#68177F", "#4F027C", "#591E55", "#6A1A7A", "#611774", "#4B0B71", "#4F2248", "#572458", "#581963", "#43125F", "#D8CBEB", "#BFAFE4", "#BCA8E6", "#AA94DE", "#8D65D2", "#9173D3", "#6732BA", "#7A52C7"], ["#4F1F91", "#4A217E", "#3B0084", "#452663", "#381D59", "#ADACDC", "#A29FE0", "#C4CBEA", "#BDD0EE", "#B1C5EA", "#9490D2", "#8580D8", "#94A1E2", "#A1BDEA", "#547ED9", "#7973C2", "#5E53C7", "#4555C7", "#3878DB", "#0047BE", "#25177A", "#280092", "#1E22AE", "#00129D", "#211265", "#22007A", "#1A1C96", "#00237E", "#001A7B", "#1D1157", "#1B0069", "#151D71", "#002065", "#001D68", "#241A44", "#1B0C55", "#151C55", "#0B2345", "#031E51", "#A9C7EC", "#8CB4E8", "#4189DD", "#00267F", "#002569", "#00204E", "#93BFEB", "#6CABE7", "#0077D4", "#0035AD", "#003798", "#003082", "#00234C", "#BED9ED", "#92C9EB", "#A4CEEC", "#62B4E8", "#6AB2E7", "#0092DD", "#0047B6", "#005BC3", "#003580", "#0053A5", "#002D62", "#003B6F", "#002740", "#003151", "#78C7EB", "#A5D9EC", "#42B4E6", "#40BDE8", "#00A0E2", "#00A2E1", "#0067C6", "#0076CC", "#00529B", "#0060A1", "#00436E", "#00496E", "#00344D", "#003A4F", "#A2DBEB", "#53CAEB", "#00B5E6", "#0070B2"], ["#005883", "#003947", "#66CFE6", "#6FD2E4", "#00C2E3", "#00C4DC", "#00A7D4", "#00AECE", "#0092C7", "#0092BA", "#007FAC", "#007A97", "#006685", "#00667C", "#004650", "#004F5D", "#BFE5EA", "#8EDBE5", "#36CCDA", "#0097AC", "#008193", "#006F7A", "#006068", "#98D9DB", "#75D9D8", "#7BDDD8", "#7BD2C8", "#47C7C7", "#41D2D2", "#32D4CB", "#43C4B7", "#00AFAD", "#00BAB9", "#00C2B6", "#00A994", "#008579", "#00A19C", "#00B09D", "#00997A", "#007168", "#008480", "#009384", "#007E64", "#00625A", "#005A53", "#007C6F", "#006752", "#00524D", "#00423C", "#004A41", "#004236", "#B2E7DF", "#9FE4DB", "#43D9C7", "#009878", "#007B63", "#006651", "#94D8C8", "#81E0C7", "#76D1BD", "#3BD6B2", "#00B08B", "#00C590", "#009460", "#00AE68", "#007856", "#00774B", "#006A4E", "#006644", "#00533E", "#004731", "#A6DEC1", "#89D5AF", "#5EC998", "#009543", "#007E3A", "#006233", "#18472C", "#A7E6C4", "#87E0B0", "#6ADCA2", "#00AB39", "#009530", "#007229"], ["#0F4D2A", "#A5DB92", "#9FD98B", "#55BE47", "#12AD2B", "#289728", "#2F8927", "#317023", "#CCE5A2", "#BCE18D", "#A4D867", "#62BD19", "#4FA600", "#4F8A10", "#4A601C", "#D7E9A1", "#CDE985", "#BAE55F", "#87D300", "#76B900", "#679000", "#4D5A12", "#DDE56C", "#D3E13C", "#C8DB00", "#B9D300", "#9FAA00", "#8B9000", "#6E6A12", "#E5E96E", "#DEE63A", "#D7E300", "#C6DB00", "#B2BC00", "#959200", "#7F7800", "#EDEB8F", "#F0EB7A", "#E9E73F", "#EFE600", "#E4E400", "#ECE100", "#DDDF00", "#E9DC00", "#BEB800", "#BBA800", "#ABA200", "#9B8900", "#998D00", "#6A5B07", "#CDC9C4", "#BDB8B1", "#ADA59D", "#988F86", "#7C7369", "#645A50", "#CAC4C2", "#A59997", "#948683", "#7B6E6A", "#62524E", "#372B27", "#C8C9C3", "#B5B6B0", "#9D9D96", "#87887F", "#6E6F64", "#5A5B51", "#1F211C", "#CCCCCC", "#BABBBC", "#A9AAAB", "#939495", "#767A7D", "#56595C", "#212424", "#D2D6D9", "#C3C8CD", "#A8ADB4", "#868F98", "#616A74", "#414B56", "#212930", "#D3C9CE"], ["#C8BAC0", "#B7A6AD", "#846E74", "#513E3E", "#443535", "#392E2C", "#CBD1D4", "#B3BCC0", "#99A3A6", "#7B858A", "#4F5559", "#3D4242", "#323532", "#473E26", "#5D4718", "#4D4325", "#836E2C", "#514826", "#9B8948", "#9F9B74", "#B5A570", "#B5B292", "#C5BA8E", "#C8C5AC", "#D4CCAA", "#D5D3BF", "#DED9C2", "#655415", "#977F09", "#B29200", "#DBCA67", "#DFD27C", "#E5DB97", "#E7E3B5", "#563F23", "#4E2614", "#6D4921", "#905A33", "#855723", "#B17F5C", "#B99C6B", "#C09477", "#CAB388", "#D1AE97", "#D5C4A1", "#DDC2B0", "#E0D4BB", "#E4D2C5", "#613418", "#532821", "#9B4D1B", "#7F4C3E", "#B75312", "#9B6E5F", "#E49969", "#B28D7F", "#EDB996", "#C5AAA0", "#EEC5A9", "#D4BEB6", "#F0D0BB", "#DDCDC7", "#513127", "#5E2F24", "#723629", "#AD806C", "#C8A99A", "#D5BDB0", "#DDCEC4", "#6A2E22", "#9F2D20", "#DC241F", "#EC9384", "#ECAB9D", "#ECBBAF", "#EBCDC3", "#5A272A", "#772B2F", "#91353B", "#E7A7B6", "#EDB8C5", "#EFC4CE", "#4E2A28", "#441E1F"], ["#68322E", "#854A50", "#763931", "#A16971", "#C88691", "#B7848C", "#DEACB7", "#D1A9B0", "#E5BFC7", "#DBBCC1", "#E9CCD2", "#E3CBD0", "#4E2029", "#6E2639", "#7E2B42", "#D38DA6", "#E2ABBF", "#E7B9CA", "#E9C2D1", "#60244E", "#4B253E", "#7E2271", "#704165", "#95288F", "#885E80", "#D385C8", "#A17E9A", "#DFA5D6", "#C0A6BD", "#E7BADF", "#D6C5D3", "#EBCAE3", "#E0D5DE", "#4B2A46", "#45293B", "#5A2D5F", "#5E3A51", "#682F73", "#8B687D", "#AD85BA", "#B195A6", "#BD9ECA", "#C6B0BE", "#CBB2D5", "#D4C4CE", "#DACCE1", "#DFD4DB", "#51265A", "#2A254B", "#61207F", "#433B67", "#6E20A0", "#57527E", "#A774CD", "#8581A4", "#C6A4E1", "#AAA7C1", "#CFB1E3", "#C1BED1", "#D7C4E7", "#D4D4E0", "#262A39", "#253355", "#293F6F", "#95A1C3", "#A4B1CD", "#BDC6DA", "#D2D7E4", "#002A46", "#02253A", "#002F5D", "#3E647E", "#003C79", "#587993", "#5998C9", "#7C98AE", "#93B9DC", "#A5B8C9", "#B1CBE5", "#BCCAD6", "#BFD3E6", "#CCD6E0", "#003440", "#002830"], ["#183533", "#003E51", "#00626E", "#3C5B59", "#004159", "#4F8D97", "#627D7C", "#5B97B1", "#81ADB5", "#8DA09F", "#85B0C6", "#A1C3C9", "#AAB8B9", "#9FC1D3", "#BED5D9", "#BFCBCC", "#B9D0DC", "#CFDEE1", "#CCD4D4", "#214232", "#1B3930", "#24604A", "#4A6D62", "#13694E", "#6E8D82", "#74A18E", "#8FA8A0", "#98BAAC", "#A9BDB6", "#ACC7BD", "#C0CFCB", "#C0D4CD", "#D3DEDB", "#22483F", "#193025", "#0F6259", "#5A7060", "#007770", "#6C8072", "#72B8B4", "#97A69B", "#98CCC9", "#B1BCB5", "#B9DCDA", "#BDC5BF", "#CDE3E2", "#CDD3CD", "#18453B", "#008478", "#76C6BE", "#9DD6CF", "#B4DEDB", "#C1E2DE", "#404F24", "#3E4723", "#404616", "#56732E", "#5E6639", "#6F732D", "#668E3C", "#6E7649", "#8D9150", "#B2C891", "#939871", "#A7AB74", "#BDD0A0", "#ADB291", "#C1C49A", "#C5D5A9", "#BDC2A9", "#CED1B3", "#CFDDBB", "#CED2BF", "#D9DCC5", "#605A12", "#4B4516", "#888600", "#7D762F", "#ABB400", "#9D9754", "#CBD34C", "#ADA86B", "#D8DB6F", "#C7C397"], ["#DDE18A", "#D3CFAC", "#E2E59F", "#D9D7B9", "#EEEBB6", "#EEEAA5", "#EEE88D", "#EDE25E", "#EADB1B", "#E0CA00", "#D8BD00", "#EBE9C3", "#E9E6B4", "#E7E29A", "#E2D973", "#D8CC46", "#C4B300", "#B39D00", "#E3E1C1", "#DDDBB1", "#D7D29D", "#C9C37F", "#B4A851", "#9C8E2A", "#887811", "#D2DFDC", "#BDD2CC", "#9EBCB3", "#78A095", "#518274", "#1F5647", "#032D23", "#C8E2E8", "#AADAE5", "#82CBDD", "#48B8D2", "#009EC0", "#007CA4", "#00628C", "#ADDDEB", "#8DD4E9", "#5BC8E7", "#00B2DE", "#009ACF", "#0085C2", "#0070B2", "#CED9E7", "#C5D2E3", "#97B1D0", "#7498C0", "#5781AE", "#11568C", "#002B5F", "#D4DCE8", "#C2CDE0", "#99AECE", "#6F8DB9", "#2A568F", "#003066", "#002252", "#D4DDED", "#BFD0EA", "#A1BBE4", "#6E96D5", "#296DC1", "#003596", "#002280", "#DED8E6", "#D7D0E0", "#C5BBD3", "#A392B7", "#7C6495", "#624A7E", "#432C5F", "#EAD4E4", "#E6C1DB", "#E1A7CF", "#DA89BE", "#CE62A4", "#B62A79", "#A30059", "#E5D1DF", "#E2C9DA", "#DEBDD4"], ["#CB97B7", "#B8749E", "#9C4878", "#7C2250", "#E5CAD9", "#E1BCD0", "#DBAEC6", "#C686A9", "#B46B93", "#95416F", "#6D2348", "#E7CDD2", "#E2C1C8", "#D9A7B1", "#CA909C", "#B06876", "#944554", "#81333D", "#EDCFD7", "#F0C2CD", "#ECA9B9", "#E58DA2", "#D5647C", "#BA394E", "#A22630", "#F2D6DE", "#F5C7D4", "#F5B0C1", "#F590A6", "#EF6782", "#E54661", "#D32939", "#FACDAE", "#FBC399", "#FDB179", "#F9964A", "#F17C0E", "#DE6100", "#CF5200", "#EFCFB8", "#ECC3A5", "#E5AE86", "#D58F59", "#C0722F", "#9A4B00", "#843B00", "#E8CEBB", "#E1BEA4", "#D5AA88", "#C38E63", "#AC703D", "#793F0D", "#64300A", "#00A7D8", "#5BDD45", "#FFE805", "#FFA243", "#FF585E", "#FF1CAC", "#D708B2", "#00AE97", "#E1E400", "#FFCE09", "#FF7750", "#FF3485", "#EA12AF", "#7E60CE"]]
	}
	$('#colorpalette-2').colorPalette(options).on('selectColor', function (e) {
		e.preventDefault();
		scene.filterLayer(toRgb(e.color), scene.curLayer);
		var elem = '.layer-' + scene.curLayer + ' .curcolor';
		var colorN = '.color-now .color-square';
		$(elem).css({
			background: e.color
		});
		$(colorN).css({
			background: e.color
		});
		$('.color-now .color').text(e.color.toLowerCase());
		colorAdv.setColor(e.color);
		$('.match-type').trigger('change');
	});
	options = {
		colors: [['#e3bb35', '#f4c505', '#c99f39', '#d1c322', '#a4a13a', '#78ac3d'], ['#98783d', '#7e6f44', '#7d743d', '#636d4a', '#3f6540', '#498842'], ['#009369', '#00795a', '#019058', '#30974e', '#157246', '#516e5c'], ['#6b4552', '#813f5a', '#a63d4e', '#b03d42', '#c24646', '#bf423c'], ['#644040', '#834240', '#954842', '#b4433b', '#a54d39', '#d35a3f']]
	}
	$('#colorpalette-1').colorPalette(options).on('selectColor', function (e) {
		e.preventDefault();
		scene.filterLayer(toRgb(e.color), scene.curLayer);
		var elem = '.layer-' + scene.curLayer + ' .curcolor';
		var colorN = '.color-now .color-square';
		$(elem).css({
			background: e.color
		});
		$(colorN).css({
			background: e.color
		});
		$('.color-now .color').text(e.color.toLowerCase());
		colorAdv.setColor(e.color);
		$('.match-type').trigger('change');
	})
	options = {
		colors: [['#1892d1', '#d1141b', '#f5e14a', '#127c3a']]
	}
	$('#colorpalette-0').colorPalette(options).on('selectColor', function (e) {
		e.preventDefault();
		scene.filterLayer(toRgb(e.color), scene.curLayer);
		var elem = '.layer-' + scene.curLayer + ' .curcolor';
		var colorN = '.color-now .color-square';
		$(elem).css({
			background: e.color
		});
		$(colorN).css({
			background: e.color
		});
		$('.color-now .color').text(e.color.toLowerCase());
		colorAdv.setColor(e.color);
		$('.match-type').trigger('change');
	});
	$('#switch-color').on('click', function (e) {
		e.preventDefault();
		var index = $(e.target).data('value');
		$(this).prev().children().css({
			'transform': 'translateY(' + index * -204 + 'px)'
		})
	});
	setLayerList();
	$('.layer-list').on('click', function (e) {
		e.preventDefault();
		scene.setCurLayer($(e.target).closest('.layer').data('layer'));
		$(document).trigger({
			type: 'changeLayer',
			layer: $(e.target).closest('.layer').data('layer')
		});
		
	});
	$(document).on('changeLayer', function (e) {
		scene.setCurLayer(e.layer);
		hLayerlist();
		hLayerlabel();
	});
	function hLayerlist () {
		var target = $('.layer-' + scene.curLayer);
		target.parent().siblings().children().removeClass('current');
		target.addClass('current');
	}
	function hLayerlabel () {
		var label = scene.imgList[scene.curLayer].label;
		current_layer.innerText = label;
		$('.color-now .layer-now').text(label);
	}
	$('.color-suggest .more-sol').on('click', function (e) {
		e.preventDefault();
		$('.color-suggest .more-block').css({
			'transform': 'translateY(-109px)',
			'z-index': '0'
		});
	});
	$('.color-suggest .hide-sol').on('click', function (e) {
		e.preventDefault();
		$('.color-suggest .more-block').css({
			'transform': 'translateY(0px)',
			'z-index': '-1'
		})
	});
	$('.color-match .more-sol').on('click', function (e) {
		e.preventDefault();
		$('.color-match .more-block').css({
			'transform': 'translateY(-109px)',
			'z-index': '0'
		});
	});
	$('.color-match .hide-sol').on('click', function (e) {
		e.preventDefault();
		$('.color-match .more-block').css({
			'transform': 'translateY(0px)',
			'z-index': '-1'
		})
	});
	$('#inColor').on('click', function (e) {
		e.preventDefault();
		var children = $('.color-exh').children();
		if (children.length == 0)
			return;
		$('.modal-wrap').css({
			'display': 'table'
		});
	});
	$('#geColor').on('click', function (e) {
		e.preventDefault();
		var targetHtml = [];
		targetHtml.push('<ul class="list-inline">');
		$('.layer-list li').each(function (i, elem) {
			var color = $(elem).find('.curcolor').css('background');
			var liHtml = ['<li><span class="color-block" style="background:', color, '"></span></li>'].join('');
			targetHtml.push(liHtml);
		});
		targetHtml.push('</ul>');
		$('.color-exh').html(targetHtml.join(''));
	});
	$('#modalQ').on('click', function (e) {
		e.preventDefault();
		$(this).parents('.modal-wrap').hide();
	});
	$('#modalC').on('click', function (e) {
		e.preventDefault();
		var input = $('.match-name');
		if(!input.val())
			return;
		$(this).parents('.modal-wrap').hide();
		var title = input.val();
		var list = $('.color-exh ul').clone();
		var wrap = $('<a href="#" class="plan-href"></a>').append(list);
		var div = $('<div class="color-plan"><h5>'+title+'</h5></div>').append(wrap);
		$('.color-match .more-block').append(div);
		input.val('');
	});
	$('.color-match .more-block').on('click', function (e) {
		e.preventDefault();
		var list = $(e.target).closest('ul').clone();
		if (list.length != 0)
			$('.color-exh').html(list);
		else
			return;
	});
	$('.match-type').on('change', function (e) {
		var value = $(this).val();
		var Html = ['<a href="#" class="suggest-href"><div>'];
		var result = colorAdv.Sol[value](colorAdv.curColor);
		if (!!result) {
			$.each(result, function (i, color) {
				var list = ['<span class="color-block" style="background:', color,'"></span>'].join('');
				Html.push(list);
			});
			Html.push('</div></a>');
			$('.match-exh').html(Html.join(''));
		}
	});
	$('.match-exh').on('click', function (e) {
		e.preventDefault();
		var type = $('.match-type').val();
		var list = $(e.target).closest('div').clone();
		$('.match-selected').html(list);
		$('.match-label').text(colorAdv.Type[type]);
	});
	$('.select-tool').on('click', function (e) {
		e.preventDefault();
		selectT = !selectT;
		$(this).toggleClass('active');
	});
	$('#new-layer').on('click', function (e) {
		var data = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
		var newCanvas = document.createElement('canvas');
		var newCtx = newCanvas.getContext('2d');
		var newCanvas_bg = document.createElement('canvas');
		var newCtx_bg = newCanvas.getContext('2d');
		newCanvas_bg.width = newCanvas.width = scene.getScale().width;
		newCanvas_bg.height = newCanvas.height = scene.getScale().height;
		newCtx_bg.drawImage(backUpCanvas, 0, 0);
		var oriImage = newCtx_bg.getImageData(0,0,scene.getScale().width,scene.getScale().height);
		var oriData = oriImage.data;
		if (isEmptyLayer(data)){
			return;
		}
		for (var i = 0; i < data.length; i+=4) {
			oriData[i+3] = data[i+3];
			if (data[i+3] == 0){
				oriData[i] = oriData[i+1] = oriData[i+2] = 0;
			}
		}
		newCtx.putImageData(oriImage, 0, 0);
		var layer_n = prompt('填写图层名称');
		scene.addLayer({label:layer_n?layer_n:'新图层',data:newCanvas});
		scene.draw();
		setLayerList();
	});
})