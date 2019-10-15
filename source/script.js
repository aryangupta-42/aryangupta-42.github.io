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
function closeLoader() {
  $('.bodyOverlay').css({
    'opacity': '0',
  });
  const scrollY = $('body').css('top');
  $('body').css({
    'position': 'absolute',
    'top': '',
  })
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
  $('.workLoaderDetailContainer').scrollTop(0);
  $('.workLoaderContainer').css({
    'opacity': '0',
    'transform': 'translateY(20px)',
  })
  setTimeout(function(){
    $('.bodyOverlay').css({
      'display': 'none',
    })
  }, 200)
  $('.workLoaderImg').find('img').attr('src', "");
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

function appear(element) {
  $(element).css({
    'opacity': '1',
    'transform': 'translateY(0)',
  })
}

$(document).ready(function() {
  // $('html, body').scrollTop(100);
  setTimeout(function() {

  })
  var a = 0, alen = 110, k=0;
  function loadAnim() {
    if( a<=  100) {
      k = a;
    }
    $('.loadingPageBack').css('width', a + '%');
    $('.loadingPageBack').css('left', (50 - k/2) + '%');
    a++;
    if( a < alen ){
        setTimeout( loadAnim, 15);
    }
  }
  loadAnim();

  setTimeout(function() {
    $('.loadingPage2').css({
      'opacity': '0',
      'transform': 'translateY(-60px)',
    });
    setTimeout(function() {
      $('.loadingPage2').css('display', 'none');
    }, 305);
    setTimeout(function() {
      appear('.meImg');
    }, 400)

    var titleString = "Hi, I'm Aryan Gupta";
    var displayTitleString = [];

    var subTitleString = "Designer | Developer";
    var displaySubTitleString = [];

    var i = 0, ilen = titleString.length;
    function nameAnimate() {
        displayTitleString.push(titleString[i]);
        $('.detName').html(displayTitleString);
        i++;
        if( i < ilen ){
            setTimeout( nameAnimate, 100 );
        }
    }
    nameAnimate();
    setTimeout(function() {
      var j = 0, jlen = subTitleString.length;
      function subAnim() {
        displaySubTitleString.push(subTitleString[j]);
        $('.detCaption').html(displaySubTitleString);
        j++;
        if( j < jlen ){
          setTimeout( subAnim, 50 );
        }
      }
      subAnim();
      setTimeout(function() {
        appear('.learnBtn');
      }, 50*jlen);
    }, 102*ilen);
  }, 20*alen + 800)



  $('.page').css({
    'top': $(window).height(),
  });

  var scrollTopOrig = 0;
  let documentHeight = $('.contactPage').offset().top - $('.landingPage').height() + 100; // + 270 for end scroll
  $(document).scroll(function(){

    var scrollTopNew = $(document).scrollTop();
    var percentageScroll = ((scrollTopNew - $('.landingPage').height() + 55) / documentHeight)*100;
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
    $('.workLoaderDetailContainer').scrollTop(0);
    $('body').css({
      'position': 'fixed',
      'top': '-' + $(window).scrollTop() + 'px',
    });
    // alert($(window).scrollTop())
  	let title = $(this).find('.workTitle').html();
  	let startMonth = $(this).find('.workDurationStartMonth').html();
  	let startYear = $(this).find('.workDurationStartYear').html();
  	let endMonth = $(this).find('.workDurationEndMonth').html();
  	let endYear = $(this).find('.workDurationEndYear').html();
  	let description = $(this).find('.workDescription').html();
    let imgNum = $(this).find('.workImagesContainer').find('img').length;
    let imgArr = [];
    var i;
    for (i=0; i < imgNum; i++) {
      imgArr.push($(this).find('.workImagesContainer').find('img:eq(' + i + ')').attr('src'));
    }
    $('.workLoaderImg img').click(function() {
      var url = $(this).attr('src');
      window.open(url, '_blank');
    })
    // alert(imgArr[2].attr('src'));
    var imgTracker = 0;
  	$('.bodyOverlay').css({
  		'display': 'flex',
  	})
    setTimeout(function(){
      $('.bodyOverlay').css({
        'opacity': '1',
      });
      $('.workLoaderContainer').css({
        'opacity': '1',
        'transform': 'translateY(0)',
      })
    }, 1)
    $('.workLoader').css('height', ($('.workLoaderContainer').height()*100)/100 + 'px');
  	$('.workLoaderTitle').html(title);
  	$('.workLoaderStartMonth').html(startMonth);
  	$('.workLoaderStartYear').html(startYear);
  	$('.workLoaderEndMonth').html(endMonth);
  	$('.workLoaderEndYear').html(endYear);
  	$('.workLoaderDescription').html(description);
    $('.workLoaderImg').find('img').attr('src', imgArr[imgTracker]);
    $('.arrowLeft').click(function(){
      imgTracker = ((((imgTracker - 1) % imgNum) + imgNum) % imgNum) ;
      $('.workLoaderImg').find('img').attr('src', imgArr[imgTracker]);
    })
    $('.arrowRight').click(function(){
      imgTracker = (imgTracker + 1) % imgNum;
      $('.workLoaderImg').find('img').attr('src', imgArr[imgTracker]);
    })
  })
  $('.workLoaderCloser').click(function(){
    closeLoader();
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
  $('.contactLandBtn').click(function(){
    navToPage('.contactPage', 0, 1);
  })

})
