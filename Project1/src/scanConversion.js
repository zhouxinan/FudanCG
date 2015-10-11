// 该函数在一个canvas上绘制一条从(x1,y)到(x2,y)的线段。
// 其中cxt是从canvas中获得的一个2d上下文context
// color是表示颜色的整形数组，形如[r,g,b]
// color在这里会转化为表示颜色的字符串，其内容也可以是：
// 直接用颜色名称:   "red" "green" "blue"
// 十六进制颜色值:   "#EEEEFF"
// rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
// rgba分量表示形式:  "rgba(0-255,0-255,0-255,透明度)"
// Since this function is only used to draw horizontal scan lines, only one y position is necessary, which can improve performance. 
function drawLine(cxt, x1, x2, y, color) {
	// 建立一条新的路径
	cxt.beginPath();
	// 设置画笔的颜色
	cxt.strokeStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
	// 这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
	cxt.lineWidth = 2;
	// 设置路径起始位置
	cxt.moveTo(x1, y);
	// 在路径中添加一个节点
	cxt.lineTo(x2, y);
	// 用画笔颜色绘制路径
	cxt.stroke();
}

// This function is to draw all vertex circles. The radius of the circles is
// circleRadius, which is defined in the window.onload function.
function drawCircle() {
	for (var i = 0; i < vertex_pos.length; i++) {
		cxt.beginPath();
		cxt.arc(vertex_pos[i][0], vertex_pos[i][1], circleRadius, 0,
				2 * Math.PI, true);
		cxt.closePath();
		// The fill color of the circles is red.
		cxt.fillStyle = "red";
		cxt.fill();
		// The border color of the circles is black.
		cxt.strokeStyle = "black";
		cxt.stroke();
	}
}

// This function is to fill a single polygon.
function fillPolygon(cxt, polygon) {
	// The vertex array is to store the vertex positions of the polygon.
	var vertex = [];
	for (var i = 0; i < polygon.length; i++) {
		vertex[i] = vertex_pos[polygon[i]];
	}
	// The polygon's color is the first vertex's color.
	var color = vertex_color[polygon[0]];
	// minY is the minimal y coordinate of the vertexes.
	// maxY is the maximal y coordinate of the vertexes.
	var minY = vertex[0][1];
	var maxY = minY;
	for (var i = 1; i < polygon.length; i++) {
		if (vertex[i][1] < minY) {
			minY = vertex[i][1];
			continue; // This is an performance optimization. If vertex[i][1]
			// is less than minY, it could not be larger than
			// maxY.
		}
		if (vertex[i][1] > maxY) {
			maxY = vertex[i][1];
		}
	}
	// Construct activeEdgeTable and newEdgeTable. There are only (maxY - minY +
	// 1) scan lines for the polygon.
	var scanLineCount = maxY - minY + 1;
	var activeEdgeTable = new Array(scanLineCount);
	var newEdgeTable = new Array(scanLineCount);
	for (var i = 0; i < scanLineCount; i++) {
		newEdgeTable[i] = [];
		activeEdgeTable[i] = [];
	}

	// For every edge of the polygon, if the two vertexes' y positions are the
	// same, dx can not be computed.
	// So dx can only be computed when the two vertexes' y positions are
	// different.
	// The newEdgeTable stores {x, dx, maxY} for the scan line whose y position
	// is the less one of the two vertexes.
	// Then, by using newEdgeTable, we can construct activeEdgeTable using x, dx
	// and maxY.
	for (var i = 0; i < polygon.length; i++) {
		var p1y = vertex[i][1];
		var p2y = vertex[(i + 1) % polygon.length][1];
		if (p1y < p2y) {
			// Calculating p1x and p2x only when necessary can improve
			// performance. So I put these two lines inside the if-clause rather
			// than outside the if-clause.
			var p1x = vertex[i][0];
			var p2x = vertex[(i + 1) % polygon.length][0];
			newEdgeTable[p1y - minY].push({
				x : p1x,
				dx : ((p2x - p1x) / (p2y - p1y)),
				maxY : p2y
			});
		} else if (p1y > p2y) {
			var p1x = vertex[i][0];
			var p2x = vertex[(i + 1) % polygon.length][0];
			newEdgeTable[p2y - minY].push({
				x : p2x,
				dx : ((p2x - p1x) / (p2y - p1y)),
				maxY : p1y
			});
		}
	}
	// Construct activeEdgeTable using newEdgeTable.
	for (var i = 0; i < scanLineCount; i++) {
		for (var j = 0; j < newEdgeTable[i].length; j++) {
			// For the current scan line, if it has at least an entry in
			// newEdgeTable, it
			// can be used to construct activeEdgeTable.
			var xPositionOfIntersection = newEdgeTable[i][j].x;
			// Let k be the index of the current scan line, add dx to
			// xPositionOfIntersection and get the xPositionOfIntersection of
			// the next scan line.
			for (var k = i; k < newEdgeTable[i][j].maxY - minY; k++) {
				activeEdgeTable[k].push(Math.round(xPositionOfIntersection));
				xPositionOfIntersection += newEdgeTable[i][j].dx;
			}
		}
	}
	// Sort xPositionOfIntersection of each scan line and fill the polygon
	// pairwise.
	for (var i = 0; i < scanLineCount; i++) {
		activeEdgeTable[i].sort(sortNumber);
		for (var j = 0; j < activeEdgeTable[i].length; j += 2) {
			drawLine(cxt, activeEdgeTable[i][j], activeEdgeTable[i][j + 1], i
					+ minY, color);
		}
	}
}

// This function is used in fillPolygon to sort xPositionOfIntersection.
function sortNumber(a, b) {
	return a - b;
}

// This function is to redraw the canvas.
function redraw(cxt) {
	// Clear the canvas.
	cxt.clearRect(0, 0, canvas.width, canvas.height);
	// Draw each polygon.
	for (var i = 0; i < polygon.length; i++) {
		fillPolygon(cxt, polygon[i]);
	}
	// Draw the vertex circles.
	drawCircle();
}

// This function is invoked on mouse down.
// When the mouse's x and y position are within the radius of any vertex, set
// the
// vertex as the active vertex so that it's position can be changed.
function onMouseDown() {
	for (var i = 0; i < vertex_pos.length; i++) {
		if (Math.abs(mouseX - vertex_pos[i][0]) < circleRadius
				&& Math.abs(mouseY - vertex_pos[i][1]) < circleRadius) {
			activeVertex = i;
			break;
		}
	}
}

// This function is invoked on mouse up.
// It resets activeVertex to -1.
function onMouseUp() {
	activeVertex = -1;
}

// This function is invoked on mouse move.
function onMouseMove(e) {
	// This if-clause is used to get the mouse position on the canvas,
	// supporting all kinds of browsers.
	if (e.offsetX) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	} else if (e.layerX) {
		mouseX = e.layerX;
		mouseY = e.layerY;
	}
	// Set the active vertex's position and redraw the canvas.
	if (activeVertex != -1) {
		vertex_pos[activeVertex][0] = mouseX;
		vertex_pos[activeVertex][1] = mouseY;
		redraw(cxt);
	}
}

window.onload = function() {
	canvas = document.getElementById("myCanvas");
	// Set the size of the canvas.
	canvas.width = canvasSize.maxX;
	canvas.height = canvasSize.maxY;
	cxt = canvas.getContext("2d");
	// 将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
	cxt.translate(0.5, 0.5);
	circleRadius = 10;
	activeVertex = -1;
	canvas.addEventListener("mousedown", onMouseDown);
	canvas.addEventListener("mouseup", onMouseUp);
	canvas.addEventListener("mousemove", onMouseMove);
	redraw(cxt);
}