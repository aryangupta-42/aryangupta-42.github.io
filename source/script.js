$(document).ready(function() {
  $('.page').css({
    'top': $(window).height(),
  })
  $('.tile').click(function() {
  	let title = $(this).find('.workTitle').html();
  	let startMonth = $(this).find('.workDurationStartMonth').html();
  	let startYear = $(this).find('.workDurationStartYear').html();
  	let endMonth = $(this).find('.workDurationEndMonth').html();
  	let endYear = $(this).find('.workDurationEndYear').html();
  	let description = $(this).find('.workDescription').html();
    let imgNum = $(this).find('.workImagesContainer').find('div').length;
    let imgArr = [];
    var i;
    for (i=0; i < imgNum; i++) {
      imgArr.push($(this).find('.workImagesContainer').find('div:eq(' + i + ')').css('background-image'));
    }
    var imgTracker = 0;
  	$('.bodyOverlay').css({
  		'display': 'flex',
  	})
  	$('.workLoaderTitle').html(title);
  	$('.workLoaderStartMonth').html(startMonth);
  	$('.workLoaderStartYear').html(startYear);
  	$('.workLoaderEndMonth').html(endMonth);
  	$('.workLoaderEndYear').html(endYear);
  	$('.workLoaderDescription').html(description);
    $('.workLoaderImg').css('background-image', imgArr[imgTracker]);
    $('.arrowLeft').click(function(){
      imgTracker = ((((imgTracker - 1) % imgNum) + imgNum) % imgNum) ;
      $('.workLoaderImg').css('background-image', imgArr[imgTracker]);
    })
    $('.arrowRight').click(function(){
      imgTracker = (imgTracker + 1) % imgNum;
      $('.workLoaderImg').css('background-image', imgArr[imgTracker]);
    })
  })
  $('.workLoaderCloser').click(function(){
    $('.bodyOverlay').css({
      'display': 'none',
    })
  });
})
