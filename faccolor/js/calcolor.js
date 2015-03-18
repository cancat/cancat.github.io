function complement (hex) {
	var r = parseInt(hex.substr(1,2),16);
	var g = parseInt(hex.substr(3,2),16);
	var b = parseInt(hex.substr(5,2),16);
	var hexr = (255 - r).toString(16).length == 1 ? ('0' + (255 - r).toString(16)) : (255 - r).toString(16);
	var hexg = (255 - g).toString(16).length == 1 ? ('0' + (255 - g).toString(16)) : (255 - g).toString(16);
	var hexb = (b).toString(16).length == 1 ? ('0' + (b).toString(16)) : (b).toString(16);
	return '#' + hexr + hexg + hexb;
}
function dec2html(d){
	// Converts from decimal color value (0-255) to HTML-style (00-FF)
	var hch="0123456789ABCDEF";
	var a=d%16;
	var b=(d-a)/16;
	return hch.charAt(b)+hch.charAt(a);
}
function html2dec(h){
	// Converts from HEX/HTML-style (00-FF) to decimal color value (0-255)
	return parseInt(h,16);
}
function rgb2html(rgb){
	// Converts from RGB color object to HEX/HTML-style color (AABBCC)
	return dec2html(rgb.r)+dec2html(rgb.g)+dec2html(rgb.b);
}
function html2rgb(htmlcol){
	// Converts from RGB color object to HEX/HTML-style color (AABBCC)
	var rgb=new Object();
	rgb.r=html2dec(htmlcol.substr(0,2));
	rgb.g=html2dec(htmlcol.substr(2,2));
	rgb.b=html2dec(htmlcol.substr(4,2));
	return rgb;
}
function rgb2hsv(rg){
	// Converts an RGB color object to a HSV color object
	var hs=new Object();
	var m=rg.r;
	if(rg.g<m){m=rg.g};
	if(rg.b<m){m=rg.b};
	var v=rg.r;
	if(rg.g>v){v=rg.g};
	if(rg.b>v){v=rg.b};
	var value=100*v/255;
	var delta=v-m;
	if(v==0.0){hs.s=0}else{hs.s=100*delta/v};
	if(hs.s==0){hs.h=0}else{
		if(rg.r==v){hs.h=60.0*(rg.g-rg.b)/delta}
			else if(rg.g==v){hs.h=120.0+60.0*(rg.b-rg.r)/delta}
				else if(rg.b=v){hs.h=240.0+60.0*(rg.r-rg.g)/delta}
	if(hs.h<0.0){hs.h=hs.h+360.0}
	}
	hs.h=Math.round(hs.h);
	hs.s=Math.round(hs.s);
	hs.v=Math.round(value);
	return(hs);
}
function hsv2rgb(hsx){
	// Converts an HSV color object to a RGB color object
	var rg=new Object();
	
	var ls = hsx.s;
	var lh = hsx.h;
	var lv = hsx.v;
	
	if(ls==0){
		rg.r=rg.g=rg.b=Math.round(lv*2.55); return(rg);
	}
	ls=ls/100;
	lv=lv/100;
	lh/=60;
	var i=Math.floor(lh);
	var f=lh-i;
	var p=lv*(1-ls);
	var q=lv*(1-ls*f);
	var t=lv*(1-ls*(1-f));
	switch(i){
		case 0:rg.r=lv; rg.g=t; rg.b=p; break;
		case 1:rg.r=q; rg.g=lv; rg.b=p; break;
		case 2:rg.r=p; rg.g=lv; rg.b=t; break;
		case 3:rg.r=p; rg.g=q; rg.b=lv; break;
		case 4:rg.r=t; rg.g=p; rg.b=lv; break;
		default: rg.r=lv; rg.g=p; rg.b=q;
	}
	rg.r=Math.round(rg.r*255);
	rg.g=Math.round(rg.g*255);
	rg.b=Math.round(rg.b*255);
	return(rg);
}
function rgb2hsl(rg) {

    var r = bound01(rg.r, 255);
    var g = bound01(rg.g, 255);
    var b = bound01(rg.b, 255);

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
function hsl2rgb(hs) {
    var r, g, b;

    var h = bound01(hs.h, 360);
    var s = bound01(hs.s, 100);
    var l = bound01(hs.l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
function hueToWheel(h) {
    if(h<=120){
        return(Math.round(h*1.5));
    }else{
        return(Math.round(180+(h-120)*0.75));
    }
}
function wheelToHue(w) {
    if(w<=180){
        return(Math.round(w/1.5));
    }else{
        return(Math.round(120+(w-180)/0.75));
    }
}
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = Math.min(max, Math.max(0, parseFloat(n)));

    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    if ((Math.abs(n - max) < 0.000001)) {
        return 1;
    }

    return (n % max) / parseFloat(max);
}
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}
var colorAdv = {};
colorAdv.Type = ['单色系搭配', '相似色搭配', '互补色搭配', '邻接互补色', '三和色搭配'];
colorAdv.curColor = null;
colorAdv.setColor = function (color) {
	this.curColor = color;
}
colorAdv.single = function (hex) {
	if (!hex)
		return;
	var colorGroup = [];
	var html = hex.substring(1);
	var rgb = html2rgb(html);
	var hs = rgb2hsv(rgb);
	var z = new Object();
	colorGroup.push(hex);
	z.h = hs.h;
	z.s = hs.s;
	z.v = hs.v+((hs.v<50)?20:-20);
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.v = hs.v+((hs.v<50)?40:-40);
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.s = hs.s+((hs.s<50)?20:-20);
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	// z.s = hs.s+((hs.s<50)?40:-40);
	// z.v = hs.v;
	// rgb = hsv2rgb(z);
	// html = rgb2html(rgb);
	// colorGroup.push('#' + html);

	// z.s = hs.s+((hs.s<50)?40:-40);
	// z.v = hs.v+((hs.v<50)?40:-40);
	// rgb = hsv2rgb(z);
	// html = rgb2html(rgb);
	// colorGroup.push('#' + html);

	return colorGroup;
}
colorAdv.analogue = function (hex) {
	if (!hex)
		return;
	var colorGroup = [];
	var html = hex.substring(1);
	var rgb = html2rgb(html);
	var hs = rgb2hsv(rgb);
	var w = hueToWheel(hs.h);
	var z = new Object();
	colorGroup.push(hex);
	z.h = wheelToHue((w+30)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.h = wheelToHue((w+60)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.s = 0;
    z.h = 0;
    z.v = 100 - hs.v;
    rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	return colorGroup;
}
colorAdv.complement = function (hex) {
	if (!hex)
		return;
	var colorGroup = [];
	var html = hex.substring(1);
	var rgb = html2rgb(html);
	var hs = rgb2hsv(rgb);
	var z = new Object();
	colorGroup.push(hex);
	z.h = hs.h;
	z.s = (hs.s>50)?(hs.s * 0.5):(hs.s * 2);
	z.v = (hs.v<50)?(Math.min(hs.v*1.5,100)):(hs.v/1.5);
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	var w = hueToWheel(hs.h);
	z.h = wheelToHue((w+180)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.s = (z.s>50)?(z.s * 0.5):(z.s * 2);
	z.v = (z.v<50)?(Math.min(z.v*1.5,100)):(z.v/1.5);
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	return colorGroup;
}
colorAdv.split_complement = function (hex) {
	if (!hex)
		return;
	var colorGroup = [];
	var html = hex.substring(1);
	var rgb = html2rgb(html);
	var hs = rgb2hsv(rgb);
	var w = hueToWheel(hs.h);
	var z = new Object();
	colorGroup.push(hex);

	z.h = wheelToHue((w+150)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.h = wheelToHue((w+210)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.s = 0;
	z.v = hs.s;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	return colorGroup;
}
colorAdv.triadic = function (hex) {
	if (!hex)
		return;
	var colorGroup = [];
	var html = hex.substring(1);
	var rgb = html2rgb(html);
	var hs = rgb2hsv(rgb);
	var w = hueToWheel(hs.h);
	var z = new Object();
	colorGroup.push(hex);

	z.s = hs.s;
    z.h = hs.h;
    z.v = 100 - hs.v;
    rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.h = wheelToHue((w+120)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	z.h = wheelToHue((w+240)%360);
	z.s = hs.s;
	z.v = hs.v;
	rgb = hsv2rgb(z);
	html = rgb2html(rgb);
	colorGroup.push('#' + html);

	return colorGroup;
}
colorAdv.Sol = [colorAdv.single,colorAdv.analogue,colorAdv.complement,colorAdv.split_complement,colorAdv.triadic]