// $(function () {
//   var Page = (function () {
//     var timer = null;

//     var $nav = $("#nav-dots > span"),
//       slitslider = $("#slider").slitslider({
//         onBeforeChange: function (slide, pos) {
//           $nav.removeClass("nav-dot-current");
//           $nav.eq(pos).addClass("nav-dot-current");
//         },
//       }),
//       init = function () {
//         initEvents();
//       },
//       initEvents = function () {
//         $nav.each(function (i) {
//           $(this).on("click", function (event) {
//             var $dot = $(this);

//             if (!slitslider.isActive()) {
//               $nav.removeClass("nav-dot-current");
//               $dot.addClass("nav-dot-current");
//             }

//             slitslider.jump(i + 1);
//             return false;
//           });
//         });
//       };

//     return { init: init };
//   })();

//   Page.init();
// });
$(function () {
  var Page = (function () {
    var timer = null;

    var $nav = $("#nav-dots > span"),
      slitslider = $("#slider").slitslider({
        onBeforeChange: function (slide, pos) {
          $nav.removeClass("nav-dot-current");
          $nav.eq(pos).addClass("nav-dot-current");
        },
      }),
      init = function () {
        initEvents();
        startAutoSlide();
      },
      initEvents = function () {
        $nav.each(function (i) {
          $(this).on("click", function (event) {
            var $dot = $(this);

            if (!slitslider.isActive()) {
              $nav.removeClass("nav-dot-current");
              $dot.addClass("nav-dot-current");
            }

            slitslider.jump(i + 1);
            return false;
          });
        });
      },
      startAutoSlide = function () {
        timer = setInterval(function () {
          slitslider.next();
        }, 5000); // Change slide every 10 seconds
      };

    return { init: init };
  })();

  Page.init();
});
