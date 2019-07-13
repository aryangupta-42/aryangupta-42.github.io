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
  	$('.bodyOverlay').css({
  		'display': 'flex',
  	})
  	$('.workLoaderTitle').html(title);
  	$('.workLoaderStartMonth').html(startMonth);
  	$('.workLoaderStartYear').html(startYear);
  	$('.workLoaderEndMonth').html(endMonth);
  	$('.workLoaderEndYear').html(endYear);
  	$('.workLoaderDescription').html(description);
  })
})
