// Gaussian Blur jQuery plugin | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This plugin provides a gaussian() method for DOM elements. It uses the element's position as the center and can be parameterized by the blur width (the 'c' parameter in the Gaussian function,
// http://en.wikipedia.org/wiki/Gaussian_function). Numerical integration is performed to make sure that the area under the curve is roughly one; thus, the limit as c -> 0 is the original
// element.

// Elements may be blurred directionally in one or two dimensions. For the two-dimensional case, the blur is convolved across each directional vector. Since each integral will be one, the
// integral of the convolution will also be one.

// By the way, the continuous Gaussian function used here is not quite optimal. A better one is the discrete Gaussian function based on the complex-valued Bessel function. However, the continuous
// Gaussian is easier to implement so I'm using that instead. It's only a web UI, after all :)

(function ($) {
  var gaussian_function  = function (c, x)     {return Math.exp (-(x * x) / (2.0 * c * c))},
      linear_sequence    = function (x0, d, n) {var xs = []; for (var i = 0; i < n; ++i) xs.push (x0 + i * d); return xs},
      centered_sequence  = function (d, n)     {return linear_sequence (-d * (n - 1) / 2.0, d, n)},
      gaussian_sequence  = function (c, n)     {return $.map (centered_sequence (c * 6.0 / n, n), function (x) {return gaussian_function (c, x)})},
      normalized         = function (xs)       {var total = 0; $.each (xs, function (i, x) {total += x}); return $.map (xs, function (x) {return x / total})};

//   The do_gaussian_blur() function.
//   This function creates and returns a new array of elements, each a clone of e, and scales their opacity and offsets them by appropriate distances. dx and dy mark the extremities of the
//   transformation (which is symmetric around the original element), and n specifies how many copies to create. The Gaussian distribution is automatically scaled such that three standard
//   deviations are accounted for.

  var do_gaussian_blur = function (e, n, dx, dy) {
    var position  = $(e).position(),
        opacity   = $(e).css('opacity'),
        positions = $.map (centered_sequence (1.0 / n, n), function (t) {return {left: position.left + t * dx, top: position.top + t * dy}}),
        opacities = normalized (gaussian_sequence (3.0, n)),
        parent    = $(e).parent(),
        elements  = $();

    $.each (positions, function (i, p) {elements = elements.add ($(e).clone (false).attr ('id', '').addClass ('gaussian-clone').appendTo (parent).
                                                                        css ({position: 'absolute', opacity: opacity * opacities[i], visibility: 'visible', left: p.left, top: p.top}))});
    return elements};

//   The unblur() function.
//   Removes all clones from the document and restores the visibility of the original element.

  var unblur = function () {$(this).data('gaussian-clones') ? $(this).css({visibility: 'visible'}).data('gaussian-clones').each (unblur) && unblur.call ($(this).removeData ('gaussian-clones'))
                                                            : $(this).filter('.gaussian-clone').remove()};

//   The gaussian() function.
//   This is the jQuery interface function. gaussian() replaces each matched element by an array of clones designed to create a blurring effect. The new elements will have the class
//   'gaussian-clone' in addition to any classes the original element had. The original element is not removed from the document, but hidden. Calling gaussian() on an already-blurred element will
//   blur each of the clones, allowing for multiple-vector convolution. For example:

//   | $('div').gaussian({dx: 5, n: 10}).           // Blur 10 pixels along x axis, using 10 copies (radius is 5px)

//   As a special case, you can pass in null as the options hash to unblur an element. This removes all clones from the document and restores the original to a visible state. It removes clones
//   from all subsequent blurring as well.

//   Options.
//     dx, dy: The horizontal and vertical components of the vector to blur with. Distance matters; the distance of the vector <dx, dy> is the distance of the 1 -> 0 opacity fade.
//             By default, dx = 0 and dy = 0.
//     n:      The number of clones to use.
//             By default, n = 5.

  $.fn.gaussian = function (options) {
    return $(this).each (options === null ? unblur
                                          : function (i, e) {$(e).data('gaussian-clones') ? $(e).data('gaussian-clones').each (function () {$(this).gaussian (options)})
                                                                                          : $(e).data('gaussian-clones', do_gaussian_blur (e, options.n || 5, options.dx || 0, options.dy || 0)).
                                                                                                  css({visibility: 'hidden'})})};

//   The gaussians() function.
//   Returns the elements that are used to represent the blurred element. This is basically the clones, plus any clones of theirs. This function doesn't take any options, and it doesn't include
//   the element on which it was called.

  $.fn.gaussians = function () {var collection = $(); this.each(function () {var xs = $(this).data('gaussian-clones') || [];
                                                                             for (var i = 0, l = xs.length; i < l; ++i) collection = collection.add(xs[i]).add($(xs[i]).gaussians())});
                                return collection};

//   The motionblur() function.
//   This function moves the element, blurring it as it is moving. When the animation finishes the blur is removed. It takes two positional options, 'left' and 'top', which specify the position
//   the element should move to. It also optionally takes an 'n' to provide to the gaussian() function (by default this is 8) and a 'sharpness' that determines what fraction of the distance is
//   used to blur. By default elements have a sharpness of 10. Other optional parameters are 'speed', which is passed into jQuery's animate() function, 'easing', which is also passed into
//   animate(), and 'callback', which is invoked after the animation and unblurring are complete.

//   All positions are relative to the offset parent, not to the document.

  $.fn.motionblur = function (options) {
    return $(this).each (function () {var p = $(this).position(), dx = options.left - p.left, dy = options.top - p.top;
                                      $(this).gaussian({dx: dx / (options.sharpness || 10), dy: dy / (options.sharpness || 10), n: options.n || 8}).gaussians().add(this).
                                                   css({position: 'absolute'}).
                                               animate({left: (dx >= 0 ? '+=' : '-=') + Math.abs(dx), top: (dy > 0 ? '+=' : '-=') + Math.abs(dy)},
                                                       options.speed || $.fx.speeds._default, options.easing || 'swing', function () {
                                                                                                                           $(this).gaussian(null).css({left: options.left, top: options.top});
                                                                                                                           options.callback && options.callback.call(this)})})};
}) (jQuery);

// Generated by SDoc 