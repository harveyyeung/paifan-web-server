var MIN_WIDTH = 640;
var TARGET_WIDTH = 320;
var originalDataUrl = null;
var aspect = 1;
var px = 0, py = 0;
var dragging = false;
var downX = 0, downY = 0;
var imgWidth = 0, imgHeight = 0;
var maxAspect = 1;

function setImageLoaderWidth(minWidth, targetWidth) {
    MIN_WIDTH = minWidth || 640;
    TARGET_WIDTH = targetWidth || 320;

    var canvas = document.getElementById('tempCanvas');

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_WIDTH;
    canvas.style.width = TARGET_WIDTH;
    canvas.style.height = TARGET_WIDTH;

    $('#upload-file').val('');
    originalDataUrl = null;
}

function initImageLoader(minWidth, targetWidth) {
    MIN_WIDTH = minWidth || 640;
    TARGET_WIDTH = targetWidth || 320;

	$('#upload-file').on('change',function(){
		var reader = new FileReader();
		reader.onload = function(e) {
			var image = new Image();
			var dataUrl = e.target.result;
			image.onload = function() {
				if (image.complete) {
					if (image.width < MIN_WIDTH || image.height < MIN_WIDTH) {
						alert('图片的宽和高不能小于 ' + MIN_WIDTH + ' 像素。');
					} else {
						originalDataUrl = dataUrl;	
						imgWidth = image.width;
						imgHeight = image.height;
						px = 0;
						py = 0;
						maxAspect = Math.min(image.width, image.height) / TARGET_WIDTH;
                        aspect = maxAspect;
						drawPicture();
					}
				} else {
					Console.log('Error loading picture.');
				}
			}
			image.src = dataUrl;
		}
		reader.readAsDataURL(this.files[0]);
	});

	$('#tempCanvas').mousedown(function (e) {
		dragging = true;
		downX = e.pageX;
		downY = e.pageY;
	});

	$('#tempCanvas').mousemove(function (e) {
		if (!dragging) return;
		var dx = e.pageX - downX, dy = e.pageY - downY;
		if (Math.abs(dx) < 20 && Math.abs(dy) < 20)
			return;

		px -= dx * aspect;
		py -= dy * aspect;
		downX = e.pageX;
		downY = e.pageY;

		//console.log("d " + dx + ',' + dy);

		drawPicture();

	});

	$('#tempCanvas').mouseup(function (e) {
		dragging = false;
	});

	$('#tempCanvas').mouseleave(function (e) {
		dragging = false;
	});

    $('#tempCanvas').bind('wheel mousewheel',function (e) {
        e.preventDefault();
        
        if(e.originalEvent.wheelDelta / 120 > 0) {
            aspect=aspect-0.1;drawPicture()
        }
        else{
            aspect=aspect+0.1;drawPicture()
        }
    });
}

function drawPicture() {
	if (originalDataUrl == null)
		return;
	if (aspect < 0.1) aspect = 0.1;
	if (aspect > maxAspect) aspect = maxAspect;


	if (px < 0) px = 0;
	if (py < 0) py = 0;
	if (px + TARGET_WIDTH * aspect > imgWidth)
		px = imgWidth - TARGET_WIDTH * aspect;
	if (py + TARGET_WIDTH * aspect >imgHeight)
		py = imgHeight - TARGET_WIDTH * aspect;

	var canvas = document.getElementById('tempCanvas');
	var context = canvas.getContext('2d');
	var img = new Image();
	img.onload = function() {
		//console.log("p " + px + ',' + py);
		context.drawImage(img, px, py, TARGET_WIDTH * aspect, TARGET_WIDTH * aspect, 0, 0, TARGET_WIDTH, TARGET_WIDTH);
	}
	img.src = originalDataUrl;
}

function getImageLoaderImage() {
    var canvas = document.getElementById('tempCanvas');
    
    if (originalDataUrl == null) {
        return null;
    }

    var result = canvas.toDataURL('image/jpeg', 0.55);
    //alert(result.length);
    return result;
}