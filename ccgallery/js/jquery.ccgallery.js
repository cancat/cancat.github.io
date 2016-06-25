/* CCGallery - HTML5 Multimedia Gallery - 4.1.1
 * Copyright 2012, Nilok Bose
 * http://codecanyon.net/user/cosmocoder
*/

jQuery(function($){

	var $ccgallery        = $('#ccgallery'),
		$thumbGallery     = $('#thumbGallery'),
		$thumbList        = $('#thumbGallery').find('ul'),
		$coverList        = $('#itemList'),
		$coverflowGallery = $('#coverflowGallery'),
		$coverContainer   = $('#coverContainer'),
		msie              = navigator.appName.toLowerCase().indexOf('microsoft') != -1,
		ie9js             = msie && parseFloat(navigator.appVersion.split('MSIE')[1], 10) < 9 && IE7.recalc ? true : false,
		ccAutoplay        = $ccgallery.data('autoplay') === true ? true : false,
		ccLoop            = $ccgallery.data('loop') === true ? true : false,
		storeVolume       = $ccgallery.data('storeVolume') === true ? true : false,
		newWindowLinks    = $ccgallery.data('newWindowLinks') === true ? true : false;

	function init(url) {
		// First check if mobile devices are to be detected and if yes serve them an alternate xml file
		if( $ccgallery.data('mobile') === true ) {
			$.ajax({
				type: 'GET',
				url: 'includes/mobile.php',
				dataType: 'text',
				success: function(data) {
					if( data === 'true') {
						xmlFile = 'config-mobile.xml';
					}
					getConfig(url);
				}
			});
		}
		else {
			getConfig(url);
		}
	}



	// function to retrieve gallery details from the appropriate xml file
	function getConfig(url) {
		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'xml',
			success: function(data){
				ccgalleryCreate( $(data) );
			}
		});
	}



	/***************** function to create the gallery html structure **********************/
	function ccgalleryCreate( $galleryConfig ) {

		var $files        = $galleryConfig.find('file'),
			$coverPics    = $files.find('cover'),
			$thumbs       = $files.find('thumb'),
			$titles       = $files.find('title'),
			$descriptions = $files.find('description'),
			itemnum       = $files.length,
			loadCounter   = 0;


		// generate html for the gallery
		var thumbli = '', imagelist = '', coverli = '';

		for( var i = 0; i < itemnum; i++ ) {
			// determine the categories to which an item belongs and then construct an object in string format
			var $category = $files.eq(i).find('category'),
				categories = '{"category": false}';

			if( $category.length !== 0 ) {
				categories = '{';
				$category.each(function(){
					categories += '"' + $(this).text() + '"' + ': true,';
				});
				categories = categories.substr(0, categories.length - 1);   // removing the comma from the last item
				categories += '}';
			}


			// Fill up the Thumbnail section
			thumbli += '<li data-id="'+ (i+1) +'" data-type="'+ $files.eq(i).attr('type') +'" data-categories=\''+ categories +'\'>';
			thumbli += '<img class="thumb" src="'+ $thumbs.eq(i).text() +'" alt="" />';
			thumbli += '<div class="details">';
			thumbli += '<h2>'+ $titles.eq(i).text() +'</h2>';
			thumbli += '<p class="description">'+ $descriptions.eq(i).text() +'</p>';
			thumbli += '</div>';
			thumbli += '</li>';


			// Fill up the the Coverflow section
			imagelist += '<img src="'+ $coverPics.eq(i).text() +'" alt="" />';

			coverli += '<li data-id="'+ (i+1) +'" data-type="'+ $files.eq(i).attr('type') +'" data-categories=\''+ categories +'\'>';
			coverli += '<span class="details">';
			coverli += '<h2>'+ $titles.eq(i).text() +'</h2>';
			coverli += '<p class="description">'+ $descriptions.eq(i).text() +'</p>';
			coverli += '</span>';
			coverli += '</li>';
		}

		$thumbList.html( thumbli );
		$coverContainer.html( imagelist );
		$coverList.html( coverli );

		//code to remove conflict between ie9.js and css3pie on hover and on click for IE
		if( ie9js ) {
			$coverList.on('mouseleave click', 'li', function(e){
				$(this).removeClass('ie7_class7');
			});

			$thumbList.on('mouseleave', 'li', function(e){
				$(this).removeClass('ie7_class4');
			});
		}


		//find which view mode should be shown first
		var startmode;
		if( $('#gocoverflow').hasClass('active') ) {
			startmode = 'coverflow';
		}
		else {
			startmode = 'thumbnails';

			//fix for IE so that it can get coverflow image dimensions
			if( msie ) {
				$ccgallery.find('section').css({ position: 'absolute', top: '0', left: '0' });
				$coverflowGallery.css({ display: 'block', opacity: '0' });
			}
		}




		//check whether all images have been loaded and then fade in the gallery in the chosen view mode
		$ccgallery.find('img').load(function(){
			loadCounter++;
			if( loadCounter === 2*itemnum ) {
				$ccgallery.css({ height: 'auto', background: 'none' });

				if( startmode === 'coverflow' ) {
					$coverContainer.parent().fadeIn(600);
				}
				else {
					$thumbGallery.fadeIn(600);

					if( msie ) {  // continuing the IE fix for coverflow images
						$ccgallery.find('section').css( 'position', 'static');
						$coverflowGallery.css({ display: 'none', opacity: '1' });
					}
				}

				ccgallerySetup( itemnum, $files );
			}
		});

	}  //end ccgalleryCreate()



	/******************** function to setup all the workings of the gallery **************************/
	function ccgallerySetup( itemnum, $files ) {

		// action to take when clicking on toolbar buttons
		var $thumbListClone = $thumbList.clone(),
			$coverListClone = $coverList.clone(),
			sortSpeed       = 100;  // sorting animation speed set to low value on page load (to quickly display a particular category), will be changed later


		// Fix for IE9 in windows 7 where ordered list items that are hidden and then shown, are all numbered as zero.
		// The fix is to create an empty div after the ordered list and set its innerHTML to a space, after the list items are shown
		if( msie && parseFloat(navigator.appVersion.split('MSIE')[1], 10) == 9 ) {
			var $olfix = $('<div id="olfix"/>').insertAfter($coverList);
		}

		$ccgallery.find('menu').on('click', 'a.navbuttons', function(){
			var $this     = $(this),
				thisindex = $this.index(),
				sections  = $('section.displayStyle'),
				type      = $this.data('type'),
				category  = $this.data('category');

			$this.addClass('active').siblings().removeClass('active');

			if($this.parent().is('#sortButtons')) {   //code to sort the items
				var thumbFilteredData, coverFilteredData;

				// sort by file type, i.e photo, audio or video
				if( type ) {
					if( type === 'all' ) {
						thumbFilteredData = $thumbListClone.find('li');
						coverFilteredData = $coverListClone.find('li');
					}
					else {
						thumbFilteredData = $thumbListClone.find('li[data-type='+ type +']');
						coverFilteredData = $coverListClone.find('li[data-type='+ type +']');
					}
				}
				// sort by custom categories
				else if( category ) {
					thumbFilteredData = $thumbListClone.find('li').filter(function(){
						if( category in $(this).data('categories') ){
							return true;
						}
					});

					coverFilteredData = $coverListClone.find('li').filter(function(){
						if( category in $(this).data('categories') ) {
							return true;
						}
					});
				}


				$thumbList.quicksand(thumbFilteredData, {
					duration: sortSpeed,
					adjustHeight: 'auto',
					useScaling: false
				}, function(){
					$thumbList.css('height', 'auto');

					if( ie9js ) {   //reapply css styles when using IE9.js
						IE7.recalc();
					}
				});

				$coverList.quicksand(coverFilteredData, {
					duration: sortSpeed,
					adjustHeight: 'auto',
					useScaling: false
				}, function(){
					$coverList.css('height', 'auto');
					coverRearrange();

					if( ie9js ) {   //reapply css styles when using IE9.js
						IE7.recalc();
					}

					// IE9 fix for numbering in ordered list
					if( $olfix ) {
						$olfix[0].innerHTML = ' ';
					}
				});
			}
			else {   //code to display the items as thumbnails or in coverflow mode
				if( sections.eq(thisindex).is(':visible') ) {
					return false;
				}
				else {
					sections.filter(':visible').fadeOut(600, function(){
						sections.eq(thisindex).fadeIn(600);
					});
				}
			}
		});


		// find which category of items should be displayed on page load then set the sorting animation speed
		$('#sortButtons').find('a.active').not('[data-type="all"]').trigger('click');
		sortSpeed = 800;

		// handle overlay opening when clicking on thumbnails in #thumbGallery
		var thumbIndex;  // this tracks which thumbnail is clicked
		$thumbList.on('click', 'img.thumb', function(){
			var $thisparent = $(this).parent(),
				thisindex   = $thisparent.data('id') - 1,
				type        = $thisparent.data('type'),
				link        = $files.eq(thisindex).find('link').text(),
				sources     = $files.eq(thisindex).find('source'),
				mode        = 'thumb';

			thumbIndex = $thumbList.find('img.thumb').index(this);

			if( link ) {
				if( newWindowLinks ) {
					window.open(link, '_blank');
				}
				else {
					window.location.href = link;
				}
			}
			else {
				overlayCreate( mode, type, sources, $thisparent.find('h2')[0].innerHTML, $thisparent.find('p')[0].innerHTML );
			}
		});



		/******************** Coverflow Code **************************/
		var $items        = $coverContainer.find('img'),
			$cwrapper     = $('<div class="cwrapper"/>').appendTo($coverContainer).hide(),
			$cfade        = $('<canvas class="fade"/>').appendTo($coverContainer),
			$coverTitle   = $('<p id="coverTitle"/>').appendTo($coverContainer).css('z-index', 2*itemnum),
			width         = $coverContainer.width(),
			height        = 0,
			largeH,
			startItem     = $ccgallery.data('coverStartItem'),
			coverflowFade = $ccgallery.data('coverflowFade') === false ? false : true,
			noReflection  = $ccgallery.data('noReflection') === true ? true : false,
			galleryBg     = $ccgallery.data('background'),
			index         = startItem !== undefined ? parseInt(startItem) - 1 : itemnum % 2 === 0 ? itemnum/2 - 1 : (itemnum + 1)/2 - 1,
			bgcolor       = galleryBg ? getRGB(galleryBg) : getRGB( $('body').css('background-color') ),
			activeItemId,
			canvasYes     = document.createElement('canvas').getContext ? true : false,
			css3d         = Modernizr.csstransforms3d,
			$win          = $(window);

		// get width of #coverContainer if starting mode is Thumbnails
		if( $coverflowGallery.is(':hidden') ) {
			$coverflowGallery.css({ display: 'block', visibility: 'hidden'});
			width = $coverContainer.width();
			$coverflowGallery.css({ display: 'none', visibility: 'visible'});
		}


		//set the height of #coverContainer by calculating the height of the largest coverpic
		for(var i = 0; i < itemnum; i++) {
			if(height < $items.eq(i)[0].height) {
				height = $items.eq(i)[0].height;
				largeH = height;
			}
		}

		if( canvasYes ) {
			height = noReflection ? height : (1.5*height) | 0;  // equivalent to Math.floor(1.5*height)
			$coverContainer.height( height );
		}
		else {
			$coverContainer.height( height + 20 );  // extra 20px height for item titles
		}


		var coverCanvas    = [],
			coverCtx       = [],
			coverWidth     = [],
			coverHeight    = [],
			covers         = [],
			coverMaxWidth  = [],
			coverMaxOffset = [],
			coverClick     = [],
			startItemWidth = $items[index].width,
			animObj        = [],
			coverHtml      = [],
			clickHtml      = [];

		// if css 3d transform supported add class to coverflow container
		css3d && $coverContainer.addClass('css3d');

		function setupCoverflow() {
			coverHtml = [];
			clickHtml = [];

			if( canvasYes ) {
				var i = itemnum, z, left, cwidth, cleft, imageIndex, transformVal, css3dobj;

				while(i--) {
					imageIndex               = $coverList.find('li').eq(i).data('id') - 1;
					coverWidth[i]            = $items[imageIndex].width;
					coverHeight[i]           = $items[imageIndex].height;
					coverCanvas[i]           = $('<canvas class="cover"/>').data('index', i);
					coverHtml[i]             = coverCanvas[i][0];
					coverCtx[i]              = coverCanvas[i][0].getContext('2d');
					coverCanvas[i][0].width  = coverWidth[i];
					coverCanvas[i][0].height = noReflection  ? coverHeight[i] : (1.5*coverHeight[i]) | 0;  // equivalent to Math.floor(1.5*coverHeight[i])

					covers[i] = new Plane(coverWidth[i], coverCanvas[i][0].height, 600, coverCtx[i], '#666', bgcolor, $items[imageIndex], noReflection);  // the height of the plane takes into account the reflected height also

					if(i < index) {
						z = i;

						if( css3d ) {
							covers[i].render();
							left = width/2 - startItemWidth/2 - coverCanvas[i][0].width + (i - index + 1)*60;
							transformVal = 'translate3d('+left+'px,0,-100px) rotateY(60deg)';
						}
						else {
							covers[i].rotation.y = Math.PI/4;
							covers[i].position.z = 100;
							covers[i].render();
							coverMaxWidth[i]     = covers[i].maxwidth;
							coverMaxOffset[i]    = covers[i].maxoffset;
							cwidth               = coverMaxWidth[i];
							left                 =  width/2 - coverCanvas[i][0].width/2 - startItemWidth/2 - coverMaxWidth[i]/2 + (i - index + 1)*40 + coverMaxOffset[i]/2;
							cleft                = width/2 - cwidth/2 - startItemWidth/2 - cwidth/2 + (i - index + 1)*40;
						}
					}

					else if(i > index) {
						z = itemnum - 2 - i;

						if( css3d ) {
							covers[i].render();
							left = width/2 + startItemWidth/2 + (i - index - 1)*60;
							transformVal = 'translate3d('+left+'px,0,-100px) rotateY(-60deg)';
						}
						else {
							covers[i].rotation.y = -Math.PI/4;
							covers[i].position.z = 100;
							covers[i].render();
							coverMaxWidth[i]     = covers[i].maxwidth;
							coverMaxOffset[i]    = covers[i].maxoffset;
							cwidth               = coverMaxWidth[i];
							left                 = width/2 - coverCanvas[i][0].width/2 + startItemWidth/2 + coverMaxWidth[i]/2 + (i - index - 1)*40 - coverMaxOffset[i]/2;
							cleft                = width/2 + startItemWidth/2 + (i - index - 1)*40;
						}
					}

					else if(i === index) {
						z = i;

						if( css3d ) {
							covers[i].render();
							transformVal = 'translate3d('+(width/2 - startItemWidth/2)+'px, 0, 0) rotateY(0deg)';
						}
						else {
							covers[i].rotation.y = Math.PI/4;
							covers[i].position.z = 100;
							covers[i].render();
							coverMaxWidth[i]     = covers[i].maxwidth;
							coverMaxOffset[i]    = covers[i].maxoffset;
							covers[i].rotation.y = 0;
							covers[i].position.z = 0;
							covers[i].render();
						}
						left   = width/2 - startItemWidth/2;
						cwidth = startItemWidth;
						cleft  = width/2 - cwidth/2;
					}


					coverClick[i] = $('<a class="coverclick"/>').data('index', i);
					clickHtml[i]  = coverClick[i][0];

					if( css3d ) {
						css3dobj = { '-moz-transform': transformVal, '-webkit-transform': transformVal, '-o-transform': transformVal, '-ms-transform': transformVal, 'transform': transformVal };
						coverCanvas[i].css({ zIndex: z, top: largeH - coverHeight[i], bottom: 'auto' }).css(css3dobj);
						coverClick[i].css({ width: coverWidth[i],
											height: coverCanvas[i][0].height,
											top: largeH - coverHeight[i],
											bottom: 'auto',
											zIndex: itemnum + 2 + z,
										})
									.css(css3dobj);
					}
					else {
						coverCanvas[i].css({ zIndex: z, left: left, top: largeH - coverHeight[i], bottom: 'auto' });
						animObj[i] = {posZ: covers[i].position.z, rotY: covers[i].rotation.y, cover: covers[i]};
						coverClick[i].css({ left: cleft,
					                    top: largeH - coverHeight[i],
										bottom: 'auto',
										zIndex: itemnum + 2 + z,
										width: cwidth,
										height: coverCanvas[i][0].height
									});
					}
				}

				$cwrapper.append(coverHtml);
				$coverContainer.append(clickHtml);
			}
			else {  // coverflow code for older browsers
				var i = itemnum, left, z, imageIndex;

				while(i--) {
					imageIndex       = $coverList.find('li').eq(i).data('id') - 1;
					coverWidth[i]    = $items.eq(imageIndex)[0].width;
					coverHeight[i]   = $items.eq(imageIndex)[0].height;
					coverCanvas[i]   = $('<div class="cover"/>').data('index', i).append( $items.eq(imageIndex).clone() );
					coverHtml[i]     = coverCanvas[i][0];
					coverMaxWidth[i] = Math.round( 0.7*coverWidth[i] );  // 70% of original width

					if( i < index ) {
						left = width/2 - startItemWidth/2 - coverMaxWidth[i] + (i - index)*40;
						z = i;
						coverCanvas[i].width( coverMaxWidth[i] );
						coverCanvas[i].height( Math.round( coverMaxWidth[i]*coverHeight[i]/coverWidth[i] ) );
					}
					else if( i > index ) {
						left = width/2 + startItemWidth/2 + (i - index)*40;
						z = itemnum - 1 - i;
						coverCanvas[i].width( coverMaxWidth[i] );
						coverCanvas[i].height( Math.round( coverMaxWidth[i]*coverHeight[i]/coverWidth[i] ) );
					}
					else if( i === index ) {
						left = width/2 - startItemWidth/2;
						z = i;
						coverCanvas[i].width( coverWidth[i] );
						coverCanvas[i].height( coverHeight[i] );
					}

					coverCanvas[i].css({ left: left, zIndex: z });

					coverClick[i] = $('<a class="coverclick"/>').data('index', i);
					clickHtml[i] = coverClick[i][0];
					coverClick[i].css({ left: left, bottom: 0, top: 'auto', zIndex: itemnum + 2 + z, width: coverCanvas[i].width(), height: coverCanvas[i].height() });
				}

				// set the position of #coverTitle for older browsers
				$cwrapper.append(coverHtml).height( height );
				$coverContainer.append(clickHtml);
				$coverTitle.css('bottom', '0px');
			}
		}


		setupCoverflow();


		//add a gradient overlay over the covers that make them fade out at the edge
		function coverfade() {
			if( canvasYes && coverflowFade ) {
				$cfade.css({ position: 'absolute', bottom: '0', left: '0', zIndex: itemnum + 1 });
				$cfade[0].width = width;
				$cfade[0].height = height;

				var cfadeCtx = $cfade[0].getContext('2d'),
					fadeGradient = cfadeCtx.createLinearGradient(0, 0, width, 0);

				fadeGradient.addColorStop(0, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 1.0)');
				fadeGradient.addColorStop(0.35, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 0.0)');
				fadeGradient.addColorStop(0.65, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 0.0)');
				fadeGradient.addColorStop(1, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 1.0)');
				cfadeCtx.fillStyle = fadeGradient;
				cfadeCtx.rect(0, 0, width, height);
				cfadeCtx.fill();
			}
		}

		coverfade();



		//hide the source images
		$items.hide();

		//fade in the covers
		$cwrapper.fadeIn(600);

		//highlight the active item in the coverflow list
		activeItemId = $coverList.find('li').eq(index).addClass('active').data('id');
		coverClick[index].addClass('active');

		//display the title of active item in the coverflow
		$coverTitle[0].innerHTML = $files.eq(index).find('title').text();


		//set up scroll bar
		var $scrollTrack = $('#scrollbar-track'),
			$scrollHandle = $scrollTrack.find('.ui-slider-handle'),
			$helper = $scrollHandle.wrap('<div class="ui-handle-helper-parent"/>').parent();

		$scrollTrack.slider({
			animate: true,
			max: itemnum - 1,
			min: 0,
			value: index,
			slide: function(ev, ui) {
				flowanimate(ui.value);
			}
		});

		$helper.width( $scrollTrack.width() - $scrollHandle.width() );


		//scroll to next or previous cover on clicking next/prev buttons
		$('#next').click(function(){
			$scrollTrack.slider('value', index+1);
			flowanimate(index+1);
		});

		$('#prev').click(function(){
			$scrollTrack.slider('value', index-1);
			flowanimate(index-1);
		});


		//scroll covers on pressing LEFT, RIGHT keys, open the overlay when pressing ENTER and close overlay on pressing ESC
		$(document).keydown(function(e){
			var key = e.keyCode || e.charCode;
			if(key === 39) {  // right key
				if( $overlay.is(':visible') || $thumbGallery.is(':visible') ) {
					return;
				}

				$scrollTrack.slider('value', index+1);
				flowanimate(index+1);
			}
			else if(key === 37) {  // left key
				if( $overlay.is(':visible') || $thumbGallery.is(':visible') ) {
					return;
				}

				$scrollTrack.slider('value', index-1);
				flowanimate(index-1);
			}
			else if(key === 13) {  // enter key
				if( $overlay.is(':visible') || $thumbGallery.is(':visible') ) {
					return;
				}

				$coverList.find('li.active').trigger('click');
			}
			else if(key === 27) { // esc key
				$close.trigger('click');
			}
		});


		//scroll covers on clicking a cover and also handle overlay opening
		$coverContainer.on('click', 'a.coverclick', function(){
			var $this = $(this),
				thisindex = $this.data('index');

			if( $this.hasClass('active') ) {
				$coverList.find('li').eq(thisindex).trigger('click');
			}
			else {
				if( thisindex !== index ) {
					$scrollTrack.slider('value', thisindex);
					flowanimate( thisindex );
				}
			}
		});


		//scroll covers using mouse wheel
		$coverContainer.mousewheel(function(e, delta) {
			delta = -Math.round(delta);

			if( delta !== 0 ) {
				$scrollTrack.slider('value', index + delta);
				flowanimate( index + delta );
			}
		});


		// scroll covers using touch swipe
		if( 'ontouchstart' in window ) {
			var touchStartPos, touchEndPos;
			$coverContainer.on('touchstart', function(e){
				var touch = e.originalEvent.targetTouches[0];
				touchStartPos = touch.pageX;
			})
			.on('touchmove', function(e){
				e.preventDefault();
				touchEndPos = e.originalEvent.targetTouches[0].pageX;
			})
			.on('touchend', function(){
				if( !touchEndPos ) {  // this ensures tap/clicks are not processed
					return;
				}

				var distance = touchEndPos - touchStartPos,
					steps = Math.round( distance/100 ),
					newindex = index - steps;

				if( index - steps < 0 ) {
					newindex = 0;
				}
				else if( index - steps >= itemnum ) {
					newindex = itemnum - 1;
				}

				$scrollTrack.slider('value', newindex);
				flowanimate(newindex);

				touchEndPos = null;
			});
		}


		//disable scrolling of document while scrolling on coverfow container
		var coverHover = false;
		$coverContainer.hover(function(){
			coverHover = true;
		},function(){
			coverHover = false;
		});

		$(window).mousewheel(function(){
			if(coverHover) {
				return false;
			}
		});


		//scroll to the proper item in coverflow when clicking on the list and also handle overlay opening
		$coverList.on('click', 'li', function(){
			var $this = $(this),
				thisindex = $this.index(),
				fileindex = $this.data('id') - 1,
				mode = 'coverflow';

			if( $this.hasClass('active') ) {
				var link = $files.eq(fileindex).find('link').text();
				if( link ) {
					if( newWindowLinks ) {
						window.open(link, '_blank');
					}
					else {
						window.location.href = link;
					}
				}
				else {
					overlayCreate( mode, $this.data('type'), $files.eq(fileindex).find('source'), $this.find('h2')[0].innerHTML, $this.find('p')[0].innerHTML );
				}
			}
			else {
				if( thisindex !== index ) {
					$this.addClass('active').siblings().removeClass('active');
					$scrollTrack.slider('value', thisindex);
					flowanimate( thisindex );
				}
			}
		});


		//function to rearrange items in the coverflow and the list after being filtered
		function coverRearrange() {
			var $filteredItems = $coverList.find('li'),
				$newActiveItem = $filteredItems.filter('[data-id='+ activeItemId +']');

			if( $newActiveItem.length === 1 ) {
				$filteredItems.removeClass('active');
				$newActiveItem.addClass('active');
			}
			else if( $newActiveItem.length === 0 ) {
				$newActiveItem = $filteredItems.eq(0);
				$newActiveItem.addClass('active');
				activeItemId = $newActiveItem.data('id');
			}

			$cwrapper.empty();
			$coverContainer.find('a.coverclick').remove();

			index = $filteredItems.index($newActiveItem);
			itemnum = $filteredItems.length;
			startItemWidth = $items.eq(activeItemId - 1)[0].width;
			setupCoverflow();
			$cfade.css( 'z-index', itemnum + 1 );
			coverClick[index].addClass('active');
			$scrollTrack.slider('option', 'max', itemnum - 1);
			$scrollTrack.slider('option', 'value', index);
			$coverTitle[0].innerHTML = $files.eq(activeItemId - 1).find('title').text();
		}



		// on resizing browser window setup the coverlow section again
		$win.resize(function(){
			if( $coverContainer.is(':hidden') ) {
				$coverflowGallery.css({ position: 'absolute', top: 0, left: 0, display: 'block', opacity: 0 });
				width = $coverContainer.width();
				$coverflowGallery.css({ position: 'static', display: 'none', opacity: 1 });
			}
			else {
				width = $coverContainer.width();
			}

			$cwrapper.empty();
			$coverContainer.find('a.coverclick').remove();
			startItemWidth = $items.eq(activeItemId - 1)[0].width;
			setupCoverflow();
			coverfade();
			coverClick[index].addClass('active');
		});



		// Define the 'easeOuQuint' easing
		$.easing.easeOutQuint = function (x, t, b, c, d) {
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		};

		//function for coverflow animation
		function flowanimate(newindex) {
			if(newindex >= 0 && newindex < itemnum) {
				var i = itemnum;

				//highlight the new active item in the list
				activeItemId = $coverList.find('li').removeClass('active').eq(newindex).addClass('active').data('id');
				coverClick[index].removeClass('active');
				coverClick[newindex].addClass('active');

				//display the title of active item in the coverflow
				$coverTitle[0].innerHTML = $files.eq(activeItemId - 1).find('title').text();

				if( canvasYes ) {
					$.fx.interval = 25;  // set the animation fps to 40 for coverflow animation

					var z, left, cwidth, cleft, posZ, angle, transformVal, css3dobj;

					while(i--) {
						if(i < newindex) {
							z = i;
							if( css3d ) {
								left     = width/2 - coverWidth[newindex]/2 - coverCanvas[i][0].width + (i - newindex + 1)*60;
								transformVal = 'translate3d('+left+'px,0,-100px) rotateY(60deg)';
							}
							else {
								left   = width/2 - coverCanvas[i][0].width/2 - coverWidth[newindex]/2 - coverMaxWidth[i]/2 + (i - newindex + 1)*40 + coverMaxOffset[i]/2;
								cwidth = coverMaxWidth[i];
								cleft  = width/2 - cwidth/2 - coverWidth[newindex]/2 - cwidth/2 + (i - newindex + 1)*40;
								posZ   = 100;
								angle  = Math.PI/4;
							}
						}
						else if(i > newindex) {
							z = itemnum - 1 - i;
							if( css3d ) {
								left     = width/2 + coverWidth[newindex]/2 + (i - newindex - 1)*60;
								transformVal = 'translate3d('+left+'px,0,-100px) rotateY(-60deg)';
							}
							else {
								left   = width/2 - coverCanvas[i][0].width/2 + coverWidth[newindex]/2 + coverMaxWidth[i]/2 + (i - newindex - 1)*40 - coverMaxOffset[i]/2;
								cwidth = coverMaxWidth[i];
								cleft  = width/2 - cwidth/2 + coverWidth[newindex]/2 + cwidth/2 + (i - newindex - 1)*40;
								posZ   = 100;
								angle  = -Math.PI/4;
							}
						}
						else if(i === newindex) {
							z            = itemnum;
							left         = width/2 - coverWidth[newindex]/2;
							cwidth       = coverWidth[newindex];
							cleft        = width/2 - cwidth/2;
							posZ         = 0;
							angle        = 0;
							transformVal = 'translate3d('+left+'px,0,0) rotateY(0deg)';
						}

						coverCanvas[i].css('z-index',z);

						if( css3d ) {
							css3dobj = { '-moz-transform': transformVal, '-webkit-transform': transformVal, '-o-transform': transformVal, '-ms-transform': transformVal, 'transform': transformVal };
							coverCanvas[i].css(css3dobj);
							coverClick[i].css({ zIndex: itemnum + 2 + z}).css(css3dobj);
						}
						else {
							coverClick[i].css({ zIndex: itemnum + 2 + z, width: cwidth, left: cleft });
							coverCanvas[i].stop(true, true).animate({ left: left }, 1200, 'easeOutQuint');
							$(animObj[i]).stop();

							if( i === index || i === newindex ) {
								animObj[i] = {posZ: covers[i].position.z, rotY: covers[i].rotation.y, cover: covers[i]};
								$(animObj[i]).animate({ posZ: posZ, rotY: angle },
									{
										duration: 1200,
										easing: 'easeOutQuint',
										step: function(val, fx){
											if( fx.prop === 'posZ' ) {
												this.cover.position.z = val;
											}
											else {
												this.cover.rotation.y = val;
												this.cover.render();
											}
										}
									});
							}
							else {
								if( covers[i].position.z !== posZ || covers[i].rotation.y !== angle ) {
									covers[i].position.z = posZ;
									covers[i].rotation.y = angle;
									covers[i].render();
								}
							}
						}


					}  // end while()
				}
				else {
					var z, left, cwidth, cheight;

					while(i--) {
						if( i < newindex ) {
							left    = width/2 - coverWidth[newindex]/2 - coverMaxWidth[i] + (i - newindex)*40;
							z       = i;
							cwidth  = coverMaxWidth[i] ;
							cheight = Math.round( coverMaxWidth[i]*coverHeight[i]/coverWidth[i] );
						}
						else if( i > newindex ) {
							left    = width/2 + coverWidth[newindex]/2 + (i - newindex)*40;
							z       = itemnum - 1 - i;
							cwidth  = coverMaxWidth[i];
							cheight = Math.round( coverMaxWidth[i]*coverHeight[i]/coverWidth[i] );
						}
						else if( i === newindex ) {
							left    = width/2 - coverWidth[newindex]/2;
							z       = itemnum;
							cwidth  = coverWidth[i];
							cheight = coverHeight[i];
						}

						coverCanvas[i].css('zIndex', z);
						coverClick[i].css({ zIndex: itemnum + 2 + z, width: cwidth, height: cheight, left: left });

						coverCanvas[i].stop(true, true).animate({ left: left, width: cwidth, height: cheight }, 600);
					}
				}

				index = newindex;
			}

			// set the animations fps to 60 after the coverflow animation is complete
			$(animObj).promise().done(function(){
				$.fx.interval = 16;
			});
		}  // end flowanimate()


		/************* create overlay where large photo will be displayed or audio/video will be played ************/
		var $mask           = $('<div id="mask"/>').appendTo('body'),
			$overlayLoader  = $('<div id="overlayLoader"/>').appendTo('body'),
			$overlay        = $('<div id="overlay"/>').appendTo('body'),
			$overlayContent = $('<div id="overlayContent"/>').appendTo($overlay),
			$close          = $('<a id="close"/>').appendTo($overlay),
			$prevItem       = $('<a id="prev-item"/>').appendTo($overlay),
			$nextItem       = $('<a id="next-item"/>').appendTo($overlay),
			volume,
			meplayer;


		$overlayContent.html('<div class="details"><h2></h2><p></p></div>');
		var $otitle = $overlayContent.find('h2'),
			$odescription = $overlayContent.find('p');

		// function to insert overlay content
		function overlayCreate( mode, type, sources, title, description ) {
			$.data($overlay[0], 'mode', mode);

			$otitle[0].innerHTML = title;
			$odescription[0].innerHTML = description;

			var top = $win.scrollTop() + $win.height()/2;

			$mask.css('height', $(document).height()).fadeIn(400, function(){
				$overlayLoader.css( 'top', top ).show();

				if( type === 'photo' ) {
					//IE fix to force load image
					if( msie ) {
						$overlay.css({ visibility: 'hidden', display: 'block' });
						$overlayContent.css({ visibility: 'hidden', display: 'block' });
					}

					var $image = $('<img src="'+ sources.text() +'" alt="" />').appendTo($overlayContent);
					$image[0].onload = function(){
						resizeImage( $image[0] );

						if( msie ) {
							$overlay.css({ visibility: 'visible', display: 'none' });
							$overlayContent.css({ visibility: 'visible', display: 'none' });
						}

						overlayShow( $image[0].width, $image[0].height, top);
					};
				}
				else if( type === 'audio') {
					var audio = '<audio controls>',
						safariAudio = '<audio controls';

					for( var i = 0, len = sources.length; i < len; i++ ) {
						var filePath = sources.eq(i).text(),
							fileExt = filePath.split('.').pop();

						if( fileExt === 'ogg' ) {
							audio += '<source type="audio/ogg" src="'+ filePath +'" />';
						}
						else if( fileExt === 'mp3' ) {
							audio += '<source type="audio/mpeg" src="'+ filePath +'" />';
							safariAudio += 'type="audio/mpeg" src="'+ filePath +'"></audio>';
						}
					}

					audio += '</audio>';

					if( navigator.userAgent.match(/webkit/gi) !== null && navigator.userAgent.match(/chrome/gi) === null) {  // Safari (Windows) without Quicktime installed removes <source> tags. This is the fix
						$overlayContent.append(safariAudio);
					}
					else {
						$overlayContent.append(innerShiv(audio));
					}

					if( $win.width() <= 480 ) {
						overlayShow( $win.width() - 80, 30, top);
					}
					else {
						overlayShow( 400, 30, top);
					}

				}
				else if( type === 'video') {
					var videoWidth = 600, videoHeight = 338;

					if( $win.width() <= 680 ) {
						videoWidth = $win.width() - 80;
						videoHeight = videoWidth*(338/600);
					}


					if( sources.eq(0).text().indexOf('youtube') !== -1 ) {
						var vId = sources.eq(0).text().split('v=')[1],
						    ytAutoplay = ccAutoplay ? '&autoplay=1' : '',
							video = '<iframe width="'+ videoWidth +'" height="'+ videoHeight +'" src="http://www.youtube.com/embed/'+ vId +'?hd=1&rel=0'+ ytAutoplay +'" frameborder="0" allowfullscreen></iframe>';
							$overlayContent.append(video);
					}
					else if( sources.eq(0).text().indexOf('vimeo') !== -1) {
						var vId = sources.eq(0).text().split('/').pop(),
							vAutoplay = ccAutoplay ? '&autoplay=1' : '',
							video = '<iframe src="http://player.vimeo.com/video/'+ vId +'?'+ vAutoplay +'" width="'+ videoWidth +'" height="'+ videoHeight +'" frameborder="0" webkitAllowFullScreen allowFullScreen></iframe>';
							$overlayContent.append(video);
					}
					else {
						var video = '<video controls width="'+ videoWidth +'" height="'+ videoHeight +'">',
							safariVideo = '<video controls width="'+ videoWidth +'" height="'+ videoHeight +'"';

						for( var i = 0, len = sources.length; i < len; i++ ) {
							var filePath = sources.eq(i).text(),
							fileExt = filePath.split('.').pop();

							if( fileExt === 'mp4' ) {
								video += '<source type="video/mp4" src="'+ filePath +'" />';
								safariVideo += 'type="video/mp4" src="'+ filePath +'"></video>';
							}
							else if( fileExt === 'webm' ) {
								video += '<source type="video/webm" src="'+ filePath +'" />';
							}
							else if( fileExt === 'ogv' ) {
								video += '<source type="video/ogg" src="'+ filePath +'" />';
							}
						}

						video += '</video>';

						if(navigator.userAgent.match(/webkit/gi) !== null && navigator.userAgent.match(/chrome/gi) === null) {  // Same Safari fix
							$overlayContent.append(safariVideo);
						}
						else {
							$overlayContent.append(innerShiv(video));
						}
					}

					overlayShow( videoWidth, videoHeight, top);
				}
			});

		}


		// function to position overlay and then show it
		function overlayShow( ow, oh, top ) {
			$overlay.css({ display: 'block', visibility: 'hidden', width: ow });
			$overlayContent.show();

			var captionHeight = $overlay.find('div.details').height() + 20,
				marginTop = -(oh + captionHeight + 40)/2,
				marginLeft = -(ow + 40)/2,
				mode = $.data($overlay[0], 'mode'),
				itemIndex = mode === 'coverflow' ? index : thumbIndex;

			$overlayContent.hide();

			if( itemnum === 1 ) {
				$prevItem.hide();
				$nextItem.hide();
			}
			else if( itemIndex === 0 ) {
				$prevItem.hide();
				$nextItem.show();
			}
			else if( itemIndex === itemnum - 1 ) {
				$prevItem.show();
				$nextItem.hide();
			}
			else {
				$prevItem.show();
				$nextItem.show();
			}

			$overlayLoader.hide();
			$overlay.css({ display: 'none', visibility: 'visible', height: oh + captionHeight, top: top, marginTop: marginTop, marginLeft: marginLeft }).slideDown(600, function(){
				$overlayContent.fadeIn(400).find('audio,video').mediaelementplayer({
					audioWidth: ow,
					videoWidth: ow,
					videoHeight: oh,
					hideVolumeOnTouchDevices: false,
					startVolume: storeVolume && volume ? volume : 1.0,
					loop: ccLoop,
					enablePseudoStreaming: true,
					success: function(mediaElement, domObject) {
						meplayer = mediaElement;

						if( ie9js ) {   //reapply css styles when using IE9.js
							IE7.recalc();
						}

						if( ccAutoplay ) {  // if autoplay option is chosen
							mediaElement.play();
						}
					}
				});
			});
		}



		// navigate through items by clicking on next/prev buttons in the overlay
		$prevItem.click(function(){
			var mode = $.data($overlay[0], 'mode'),
				itemIndex = mode === 'coverflow' ? index : thumbIndex;

			if( itemIndex - 1 < 0 ) {
				return;
			}

			$overlayContent.hide().children().not('div.details').remove();
			$overlay.hide();
			if( msie && meplayer ) {
				meplayer.pause();
				meplayer = '';
			}

			if( mode === 'coverflow' ) {
				$scrollTrack.slider('value', index-1);
				flowanimate(index-1);
				$coverList.find('li').eq(index).trigger('click');
			}
			else {
				$thumbList.find('img.thumb').eq(thumbIndex-1).trigger('click');
			}

		});

		$nextItem.click(function(){
			var mode = $.data($overlay[0], 'mode'),
				itemIndex = mode === 'coverflow' ? index : thumbIndex;

			if( itemIndex + 1 === itemnum ) {
				return;
			}

			$overlayContent.hide().children().not('div.details').remove();
			$overlay.hide();
			if( msie && meplayer ) {
				meplayer.pause();
				meplayer = '';
			}

			if( mode === 'coverflow' ) {
				$scrollTrack.slider('value', index+1);
				flowanimate(index+1);
				$coverList.find('li').eq(index).trigger('click');
			}
			else {
				$thumbList.find('img.thumb').eq(thumbIndex+1).trigger('click');
			}
		});



		// code to close overlay
		$close.click(function(){
			$overlayContent.fadeOut(400, function(){
				$overlay.slideUp(600, function(){
					if( meplayer ) {
						volume = meplayer.volume;
						if( msie ) {
							meplayer.pause();
							meplayer = '';
						}
					}

					$overlayContent.children().not('div.details').remove();
					$mask.fadeOut(400);
				});
			});
		});


		// function to resize images if they are larger than browser window
		function resizeImage(img) {
			var maxw = $win.width() - 120,
				maxh = $win.height() - 220,
				maxr = maxw/maxh,
				imgr = img.width/img.height;

			if( img.width > maxw || img.height > maxh ) {
				if( imgr === maxr ) {
					img.width = maxw;
					img.height = maxh;
				}
				else {
					img.width = maxh*imgr;
					img.height = maxh;

					if(img.width > maxw) {
						img.width = maxw;
						img.height = maxw/imgr;
					}
				}
			}
		}


	}  //end ccgallerySetup()
	window.gallery = {
		init: init
	}
});  //end of document.ready()


//get rgb color value
function getRGB( color ) {
	var r, g, b;
	if( color.indexOf('#') === 0 ) {
		if(color.length === 4) {
			r = color.substring(1,4).substring(0,1);
			r = parseInt( r+r, 16);

			g = color.substring(1,4).substring(1,2);
			g = parseInt( g+g, 16);

			b = color.substring(1,4).substring(2,3);
			b = parseInt( b+b, 16);
		}
		else {
			r = parseInt( color.substring(1,7).substring(0,2), 16 );
			g = parseInt( color.substring(1,7).substring(2,4), 16 );
			b = parseInt( color.substring(1,7).substring(4,6), 16 );
		}
	}
	else if( color.indexOf('rgb') === 0 ) {
		r = color.split('(')[1].split(',')[0];
		g = color.split('(')[1].split(',')[1];
		b = color.split('(')[1].split(',')[2].split(')')[0];
	}
	else {
		r = '0';
		g = '0';
		b = '0';
	}

	return {
		r: r,
		g: g,
		b: b
	};
}


//define the Plane object
function Plane(width, height, focalLength, ctx, color, bgcolor, img, noReflection) {
	this.width       = width;
	this.height      = height;
	this.focalLength = focalLength;
	this.ctx         = ctx;
	this.color       = color;

	this.rotation = {
		x: 0,
		y: 0,
		z: 0,
		parent: this
	};

	this.position = {
		x : 0,
		y : 0,
		z : 0
	};

	this.canvas  = this.ctx.canvas;
	this.cWidth  = this.canvas.width;
	this.cHeight = this.canvas.height;
	this.centerx = this.cWidth/2;
	this.centery = this.cHeight/2;
	this.maxX    = 0; this.minX = 0; this.maxY = 0; this.minY = 0; this.maxwidth = 0; this.maxheight = 0; this.maxoffset = 0;


	//coordinates of the vertices
	this.vertexPoints = [
		make3DPoint(-this.width/2, this.height/2, 0),
		make3DPoint(this.width/2, this.height/2, 0), 
		make3DPoint(this.width/2, -this.height/2, 0),
		make3DPoint(-this.width/2, -this.height/2, 0)
	];


	//draw the image and its reflection on a dummy canvas, which will be treated as source image

	this.offctx = document.createElement('canvas').getContext('2d');
	this.offctx.canvas.width = this.width;
	this.offctx.canvas.height = this.height;
	this.offctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
	//this.offctx.save();

	//draw mirror image
	//this.offctx.restore();
	if( !noReflection ) {
		this.offctx.scale(1, -1);
		this.offctx.translate(0, -img.height);
		this.offctx.drawImage(img, 0, 0, img.width, img.height, 0, -img.height, img.width, img.height);
		//this.offctx.restore();

		//draw gradient
		this.offctx.scale(1, -1);
		var reflectHeight = 0.5*img.height,
			reflectGradient = this.offctx.createLinearGradient(0, 0, 0, reflectHeight);

		reflectGradient.addColorStop(0, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 0.5)');
		reflectGradient.addColorStop(1, 'rgba('+ bgcolor.r +','+ bgcolor.g +','+ bgcolor.b +', 1.0)');
		this.offctx.fillStyle = reflectGradient;
		this.offctx.rect(0, 0, img.width, reflectHeight);
		this.offctx.fill();
	}
}

//render the plane on the canvas
Plane.prototype.render = function() {
	var points = Transform3DTo2D(this.vertexPoints, this.rotation, this.position, this.focalLength, this.centerx, this.centery),
		dummyctx = document.createElement('canvas').getContext('2d');

	dummyctx.canvas.width = this.width;
	dummyctx.canvas.height = this.height;

	//refresh the canvas before drawing
	this.ctx.clearRect(this.minX, this.minY, this.maxwidth, this.maxheight);

	var ptarray = [ points[0], points[1], points[3], points[2] ];
	mapTexture(dummyctx, ptarray, this.offctx.canvas);
	this.ctx.drawImage(dummyctx.canvas, 0, 0);

	var Mathmax    = Math.max, Mathmin = Math.min, Mathabs = Math.abs;
	this.maxX      = (Mathmax(points[0].x, points[1].x, points[2].x, points[3].x) + 1) | 0;
	this.minX      = Mathmin(points[0].x, points[1].x, points[2].x, points[3].x) | 0;
	this.maxY      = (Mathmax(points[0].y, points[1].y, points[2].y, points[3].y) + 1) | 0;
	this.minY      = Mathmin(points[0].y, points[1].y, points[2].y, points[3].y) | 0;
	this.maxwidth  = this.maxX - this.minX;
	this.maxheight = this.maxY - this.minY;
	this.maxoffset = ((Mathabs( (points[0].x - 0) - (this.cWidth - points[1].x) )) + 0.5) | 0;
};


//function that returns a 3d point
function make3DPoint(x,y,z) {
	return {
		x : x,
		y : y,
		z : z
	};
}


//function that returns a 2d point
function make2DPoint(x,y) {
	return {
		x : x,
		y : y
	};
}


//function to transform 3d points into a 2d context
function Transform3DTo2D(points, axisRotations, position, focalLength, centerx, centery) {
	var TransformedPoints = [],
		Mathsin = Math.sin,
		Mathcos = Math.cos,
		sx = Mathsin(axisRotations.x),
		cx = Mathcos(axisRotations.x),
		sy = Mathsin(axisRotations.y),
		cy = Mathcos(axisRotations.y),
		sz = Mathsin(axisRotations.z),
		cz = Mathcos(axisRotations.z),
		x,y,z, xy,xz, yx,yz, zx,zy, scaleFactor;

	var i = points.length;

	while (i--) {
		x = points[i].x;
		y = points[i].y;
		z = points[i].z;

		xy = cx*y - sx*z;
		xz = sx*y + cx*z;

		yz = cy*xz + sy*x;
		yx = -sy*xz + cy*x;

		zx = cz*yx - sz*xy;
		zy = sz*yx + cz*xy;

		x = zx + position.x;
		y = zy + position.y;
		z = yz + position.z;

		scaleFactor = focalLength/(focalLength + z);
		x = x*scaleFactor + centerx;
		y = -(y*scaleFactor) + centery;
		
		TransformedPoints[i] = {x: x, y: y};
	}
	return TransformedPoints;
}




/*
 * Projective texturing using Canvas.
 * (c) Steven Wittens 2008
 * http://www.acko.net/
 */
 
/*
 * Modified by Nilok Bose, (c) 2011   
 * http://codecanyon.net/user/cosmocoder
 */


/**
 * Update the display to match a new point configuration.
 */
function mapTexture(ctx, points, img) {   
  var subdivisionLimit = 5,
	  patchSize = 28,
	  transform = getProjectiveTransform(points);
 
  var ptl = transform.transformProjectiveVector([0, 0, 1]),
	  ptr = transform.transformProjectiveVector([1, 0, 1]),
	  pbl = transform.transformProjectiveVector([0, 1, 1]),
	  pbr = transform.transformProjectiveVector([1, 1, 1]);

  
  ctx.save();  
  
  ctx.beginPath();
  ctx.moveTo(ptl[0], ptl[1]);
  ctx.lineTo(ptr[0], ptr[1]);
  ctx.lineTo(pbr[0], pbr[1]);
  ctx.lineTo(pbl[0], pbl[1]);
  ctx.closePath();
  ctx.clip();

  divide(0, 0, 1, 1, ptl, ptr, pbl, pbr, transform, subdivisionLimit, patchSize, ctx, img);  
 
  ctx.restore();
}

/**
 * Render a projective patch.
 */
function divide(u1, v1, u4, v4, p1, p2, p3, p4, transform, limit, patchSize, ctx, img) {
  var Mathabs = Math.abs,
	  Mathmax = Math.max,
	  Mathmin = Math.min,
	  Mathsqrt = Math.sqrt;
  
  
  if (limit) {    
    var d1 = [p2[0] + p3[0] - 2 * p1[0], p2[1] + p3[1] - 2 * p1[1]],
        d2 = [p2[0] + p3[0] - 2 * p4[0], p2[1] + p3[1] - 2 * p4[1]],
        d3 = [d1[0] + d2[0], d1[1] + d2[1]],
        r = Mathabs((d3[0] * d3[0] + d3[1] * d3[1]) / (d1[0] * d2[0] + d1[1] * d2[1]));
    
    d1 = [p2[0] - p1[0] + p4[0] - p3[0], p2[1] - p1[1] + p4[1] - p3[1]];
    d2 = [p3[0] - p1[0] + p4[0] - p2[0], p3[1] - p1[1] + p4[1] - p2[1]];
    var area = Mathabs(d1[0] * d2[1] - d1[1] * d2[0]);

   
    if ((u1 === 0 && u4 === 1) || ((.25 + r * 5) * area > (patchSize * patchSize))) {      
      var umid = (u1 + u4) / 2,
          vmid = (v1 + v4) / 2,
          pmid = transform.transformProjectiveVector([umid, vmid, 1]),
          pt = transform.transformProjectiveVector([umid, v1, 1]),
          pb = transform.transformProjectiveVector([umid, v4, 1]),
          pl = transform.transformProjectiveVector([u1, vmid, 1]),
          pr = transform.transformProjectiveVector([u4, vmid, 1]);
      
      --limit;
      divide(u1, v1, umid, vmid, p1, pt, pl, pmid, transform, limit, patchSize, ctx, img);
      divide(umid, v1, u4, vmid, pt, p2, pmid, pr, transform, limit, patchSize, ctx, img);
      divide(u1, vmid, umid, v4, pl, pmid, p3, pb, transform, limit, patchSize, ctx, img);
      divide(umid, vmid, u4, v4, pmid, pr, pb, p4, transform, limit, patchSize, ctx, img);
    
      return;
    }
  }
  
  ctx.save();
  
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.lineTo(p4[0], p4[1]);
  ctx.lineTo(p3[0], p3[1]);
  ctx.closePath();  
  
 
  var d12 = [p2[0] - p1[0], p2[1] - p1[1]],
      d24 = [p4[0] - p2[0], p4[1] - p2[1]],
      d43 = [p3[0] - p4[0], p3[1] - p4[1]],
      d31 = [p1[0] - p3[0], p1[1] - p3[1]];
  
   var a1 = Mathabs(d12[0] * d31[1] - d12[1] * d31[0]),
       a2 = Mathabs(d24[0] * d12[1] - d24[1] * d12[0]),
       a4 = Mathabs(d43[0] * d24[1] - d43[1] * d24[0]),
       a3 = Mathabs(d31[0] * d43[1] - d31[1] * d43[0]),
       amax = Mathmax(Mathmax(a1, a2), Mathmax(a3, a4)),
       dx = 0, dy = 0, padx = 0, pady = 0;  
  
  switch (amax) {
    case a1:
      ctx.transform(d12[0], d12[1], -d31[0], -d31[1], p1[0], p1[1]);      
      if (u4 !== 1) padx = 1.05 / Mathsqrt(d12[0] * d12[0] + d12[1] * d12[1]);
      if (v4 !== 1) pady = 1.05 / Mathsqrt(d31[0] * d31[0] + d31[1] * d31[1]);
      break;
    case a2:
      ctx.transform(d12[0], d12[1],  d24[0],  d24[1], p2[0], p2[1]);      
      if (u4 !== 1) padx = 1.05 / Mathsqrt(d12[0] * d12[0] + d12[1] * d12[1]);
      if (v4 !== 1) pady = 1.05 / Mathsqrt(d24[0] * d24[0] + d24[1] * d24[1]);
      dx = -1;
      break;
    case a4:
      ctx.transform(-d43[0], -d43[1], d24[0], d24[1], p4[0], p4[1]);     
      if (u4 !== 1) padx = 1.05 / Mathsqrt(d43[0] * d43[0] + d43[1] * d43[1]);
      if (v4 !== 1) pady = 1.05 / Mathsqrt(d24[0] * d24[0] + d24[1] * d24[1]);
      dx = -1;
      dy = -1;
      break;
    case a3:      
      ctx.transform(-d43[0], -d43[1], -d31[0], -d31[1], p3[0], p3[1]);
      if (u4 !== 1) padx = 1.05 / Mathsqrt(d43[0] * d43[0] + d43[1] * d43[1]);
      if (v4 !== 1) pady = 1.05 / Mathsqrt(d31[0] * d31[0] + d31[1] * d31[1]);
      dy = -1;
      break;
  }
  
  
  var du = (u4 - u1),
      dv = (v4 - v1),
      padu = padx * du,
      padv = pady * dv;
  
   
  var iw = img.width,
	  ih = img.height; 
  
  ctx.drawImage(
    img,
    u1 * iw,
    v1 * ih,
    Mathmin(u4 - u1 + padu, 1) * iw,
    Mathmin(v4 - v1 + padv, 1) * ih,
    dx, dy,
    1 + padx, 1 + pady
  );
  ctx.restore();
}


/**
 * Calculate a projective transform that maps [0,1]x[0,1] onto the given set of points.
 */
function getProjectiveTransform(points) {
  var eqMatrix = new Matrix(9, 8, [
    [ 1, 1, 1,   0, 0, 0, -points[3].x,-points[3].x,-points[3].x ], 
    [ 0, 1, 1,   0, 0, 0,  0,-points[2].x,-points[2].x ],
    [ 1, 0, 1,   0, 0, 0, -points[1].x, 0,-points[1].x ],
    [ 0, 0, 1,   0, 0, 0,  0, 0,-points[0].x ],

    [ 0, 0, 0,  -1,-1,-1,  points[3].y, points[3].y, points[3].y ],
    [ 0, 0, 0,   0,-1,-1,  0, points[2].y, points[2].y ],
    [ 0, 0, 0,  -1, 0,-1,  points[1].y, 0, points[1].y ],
    [ 0, 0, 0,   0, 0,-1,  0, 0, points[0].y ]

  ]);
  
  var kernel = eqMatrix.rowEchelon().values;
  var transform = new Matrix(3, 3, [
    [-kernel[0][8], -kernel[1][8], -kernel[2][8]],
    [-kernel[3][8], -kernel[4][8], -kernel[5][8]],
    [-kernel[6][8], -kernel[7][8],             1]
  ]);
  return transform;
}



/* 
 * Generic matrix class.
 * (c) Steven Wittens 2008
 * http://www.acko.net/
 */
 
/*
 * Modified by Nilok Bose, (c) 2011  
 * http://codecanyon.net/user/cosmocoder
 */

 
var Matrix = function (w, h, values) {
  this.w = w;
  this.h = h;
  this.values = values || Matrix.allocate(h);
};

Matrix.allocate = function (w, h) {
  var values = [],
	  i = h,
	  j = w;
	  
  while(i--) {
    values[i] = [];
    while(j--) {
      values[i][j] = 0;
    }
  } 
  return values; 
}

Matrix.cloneValues = function (values) {
  clone = [];
  for (var i = 0, len = values.length; i < len; ++i) {
    clone[i] = [].concat(values[i]);
  } 
  return clone; 
}

Matrix.prototype.transformProjectiveVector = function (operand) {
  var out = [];
  for (var y = 0; y < this.h; ++y) {
    out[y] = 0;
    for (var x = 0; x < this.w; ++x) {
      out[y] += this.values[y][x] * operand[x];
    }
  }
  var iz = 1 / (out[out.length - 1]);
  for (var y = 0; y < this.h; ++y) {
    out[y] *= iz;
  }
  return out;
}


Matrix.prototype.rowEchelon = function () {
  if (this.w <= this.h) {
    throw "Matrix rowEchelon size mismatch";
  }
  
  var temp = Matrix.cloneValues(this.values);

  // Do Gauss-Jordan algorithm.
  for (var yp = 0; yp < this.h; ++yp) {
    // Look up pivot value.
    var pivot = temp[yp][yp];
    while (pivot == 0) {
      // If pivot is zero, find non-zero pivot below.
      for (var ys = yp + 1; ys < this.h; ++ys) {
        if (temp[ys][yp] != 0) {
          // Swap rows.
          var tmpRow = temp[ys];
          temp[ys] = temp[yp];
          temp[yp] = tmpRow;
          break;
        }
      }
      if (ys == this.h) {
        // No suitable pivot found. Abort.
        return new Matrix(this.w, this.h, temp);
      }
      else {
        pivot = temp[yp][yp];        
      }
    };
    // Normalize this row.
    var scale = 1 / pivot;
    for (var x = yp; x < this.w; ++x) {
      temp[yp][x] *= scale;
    }
    // Subtract this row from all other rows (scaled).
    for (var y = 0; y < this.h; ++y) {
      if (y == yp) continue;
      var factor = temp[y][yp];
      temp[y][yp] = 0;
      for (var x = yp + 1; x < this.w; ++x) {
        temp[y][x] -= factor * temp[yp][x];
      }
    }
  }  

  return new Matrix(this.w, this.h, temp);
}