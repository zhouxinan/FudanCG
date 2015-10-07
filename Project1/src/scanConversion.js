//该函数在一个canvas上绘制一个点
//其中cxt是从canvas中获得的一个2d上下文context
//    x,y分别是该点的横纵坐标
//    color是表示颜色的整形数组，形如[r,g,b]
//    color在这里会本转化为表示颜色的字符串，其内容也可以是：
//        直接用颜色名称:   "red" "green" "blue"
//        十六进制颜色值:   "#EEEEFF"
//        rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
//        rgba分量表示形式:  "rgba(0-255,1-255,1-255,透明度)"
//由于canvas本身没有绘制单个point的接口，所以我们通过绘制一条短路径替代
function drawPoint(cxt, x, y, color) {
	drawLine(cxt, x, y, x + 1, y + 1, color);
}

// 绘制线段的函数绘制一条从(x1,y1)到(x2,y2)的线段，cxt和color两个参数意义与绘制点的函数相同，
function drawLine(cxt, x1, y1, x2, y2, color) {
	// 建立一条新的路径
	cxt.beginPath();
	// 设置画笔的颜色
	cxt.strokeStyle = "rgba(" + color[0] + "," + +color[1] + "," + +color[2]
			+ "," + +255 + ")";
	// 这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
	cxt.lineWidth = 1;
	// 设置路径起始位置
	cxt.moveTo(x1, y1);
	// 在路径中添加一个节点
	cxt.lineTo(x2, y2);
	// 用画笔颜色绘制路径
	cxt.stroke();
}

function drawCircle() {
	for (i = 0; i < vertex_pos.length; i++) {
		cxt.beginPath();
		cxt.arc(vertex_pos[i][0], vertex_pos[i][1], 10, 0, 2 * Math.PI, true);
		cxt.closePath();
		cxt.fillStyle = "rgb(255,0,0)";
		cxt.fill();
		cxt.strokeStyle = "rgb(0,0,0)";
		cxt.stroke();
	}
}

function fillPolygon(cxt, polygon) {
	var vertex = [];
	for (var i = 0; i < 4; i++) {
		vertex[i] = vertex_pos[polygon[i]];
	}
	var color = vertex_color[polygon[0]];
	for (var i = 0; i < 4; i++) {
		drawLine(cxt, vertex[i % 4][0], vertex[i % 4][1],
				vertex[(i + 1) % 4][0], vertex[(i + 1) % 4][1], color);
	}
}

window.onload = function() {
	canvas = document.getElementById("myCanvas");
	canvas.width = canvasSize.maxX;
	canvas.height = canvasSize.maxY;
	cxt = canvas.getContext("2d");
	// 将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
	cxt.translate(0.5, 0.5);
	drawCircle();
	fillPolygon(cxt, polygon[0]);
	// for (y = 0; y < 255; y++) {
	// for (x = 0; x < 255; x += 1) {
	// color = [ y % 255, x % 255, 0 ];// 这里根据坐标计算颜色，因为颜色分量必须在0~255之间，所以这里用了取余运算
	// drawPoint(cxt, x, y, color);
	// }
	// }
	// for (y = 0; y < 255; y++) {
	// color = [ 0, 0, y % 255 ];// 这里根据坐标计算颜色，因为颜色分量必须在0~255之间，所以这里用了取余运算
	// drawLine(cxt, 300, y, 555, y, color);
	// }
	//
	// for (var x = 0, offset = 0; x < 200; x += 10, offset += 0.1) {
	// color = [ 0, 0, 180 ];
	// drawLine(cxt, x, 280 + offset, x + 9, 280 + offset, color);
	// }
}