function openNavbar() {
  $('.navbar').css({
    'transform': 'scale(1)',
    'bottom': '8%',
  })
}
function closeNavbar() {
  $('.navbar').css({
    'transform': 'scale(0)',
    'bottom': '0%',
  })
}
function checkScrollDirection(stOrig, stNew) {
  if( stNew > stOrig) {
    return 1
  } else {
    return 0
  }
}
function navTrack(pos, btn, left = 0, right = 0) {
  $('.navTracker').css({
    'left': pos,
  });
  if (left == 1) {
    $('.navTracker').css({
      'border-radius': '10px 0px 0px 10px',
    })
  } else if (right == 1) {
    $('.navTracker').css({
      'border-radius': '0px 10px 10px 0px',
    })
  } else {
    $('.navTracker').css({
      'border-radius': '0px',
    })
  }
  $('.navbarElement').removeClass('navSelected');
  $(btn).addClass('navSelected');
}
function navToPage(page, home = 0, extra = 0) {
  if (home == 1) {
    $('html,body').animate({
      scrollTop : 0
    },500,"swing");
  } else if (extra == 1){
    $('html,body').animate({
      scrollTop : $(page).offset().top + 180
    },500,"swing");
  } else {
    $('html,body').animate({
      scrollTop : $(page).offset().top
    },500,"swing");
  }
}
function offsetPage(page) {
  return $(page).offset().top;
}

$(document).ready(function() {
  $('.page').css({
    'top': $(window).height(),
  });
  var scrollTopOrig = 0;
  let documentHeight = $('.contactPage').offset().top - $('.landingPage').height() + 100; // + 270 for end scroll
  $(document).scroll(function(){
    var scrollTopNew = $(document).scrollTop();
    var percentageScroll = ((scrollTopNew - $('.landingPage').height() + 100) / documentHeight)*100;
    if(scrollTopNew >= $('.aboutPage').offset().top/2 - 100) {
      openNavbar();
      $('.header').css('opacity', '1');
    } else {
      closeNavbar();
      $('.header').css('opacity', '0');
    }
    $('.scrollTracker').css('width', percentageScroll + "%");
    scrollTopOrig = scrollTopNew;

    if (scrollTopNew <= offsetPage('.aboutPage')/2 + 200) {
      navTrack('0', '.navbarHome', 1);
    } else if (scrollTopNew <= (offsetPage('.educationPage') - 200)) {
      navTrack('20%', '.navbarAbout');
    } else if (scrollTopNew <= (offsetPage('.workPage') - 150)) {
      navTrack('40%', '.navbarEdu');
    } else if (scrollTopNew <= (offsetPage('.contactPage') - 150)) {
      navTrack('60%', '.navbarWork');
    } else {
      navTrack('80%', '.navbarContact', 0, 1);
    }

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

  $('.navbarHome').click(function(){
    navToPage('.landingPage', 1);
  })
  $('.navbarAbout, .learnBtn').click(function(){
    navToPage('.aboutPage');
  })
  $('.navbarWork').click(function(){
    navToPage('.workPage');
  })
  $('.navbarEdu').click(function(){
    navToPage('.educationPage');
  })
  $('.navbarContact').click(function(){
    navToPage('.contactPage');
  })
  $('.contactLandBtn, .headerBtn').click(function(){
    navToPage('.contactPage', 0, 1);
  })

})
