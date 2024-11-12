jQuery(document).ready(function ($) {
  $(this).find(':submit').removeAttr("disabled");
  SAIC = {
    ajaxurl: SAIC_WP.ajaxurl,
    nonce: SAIC_WP.saicNonce,
    textCounter: SAIC_WP.textCounter,
    textCounterNum: (SAIC_WP.textCounterNum !== '') ? SAIC_WP.textCounterNum : 300,
    jpages: SAIC_WP.jpages,
    numPerPage: (SAIC_WP.jPagesNum !== '') ? SAIC_WP.jPagesNum : 10,
    widthWrap: (SAIC_WP.widthWrap !== '') ? SAIC_WP.widthWrap : '',
    autoLoad: SAIC_WP.autoLoad,
    thanksComment: SAIC_WP.thanksComment,
    thanksReplyComment: SAIC_WP.thanksReplyComment,
    duplicateComment: SAIC_WP.duplicateComment,
    insertImage: SAIC_WP.insertImage,
    insertVideo: SAIC_WP.insertVideo,
    insertLink: SAIC_WP.insertLink,
    accept: SAIC_WP.accept,
    cancel: SAIC_WP.cancel,
    reply: SAIC_WP.reply,
    checkVideo: SAIC_WP.checkVideo,
    textWriteComment: SAIC_WP.textWriteComment,
    classPopularComment: SAIC_WP.classPopularComment,
  };

  //Remove duplicate comment box
  jQuery('.saic-wrap-comments').each(function (index, element) {
    var ids = jQuery('[id=\'' + this.id + '\']');
    if (ids.length > 1) {
      ids.slice(1).closest('.saic-wrapper').remove();
    }
  });

  //Remove id from input hidden comment_parent and comment_post_ID. Para prevenir duplicados
  jQuery('.saic-container-form [name="comment_parent"], .saic-container-form [name="comment_post_ID"]').each(function (index, input) {
    $(input).removeAttr('id');
  });


  // Textarea Counter Plugin
  if (typeof jQuery.fn.textareaCount == 'function' && SAIC.textCounter == 'true') {
    $('.saic-textarea').each(function () {
      var textCount = {
        'maxCharacterSize': SAIC.textCounterNum,
        'originalStyle': 'saic-counter-info',
        'warningStyle': 'saic-counter-warn',
        'warningNumber': 20,
        'displayFormat': '#left'
      };
      $(this).textareaCount(textCount);
    });
  }

  // PlaceHolder Plugin
  if (typeof jQuery.fn.placeholder == 'function') {
    $('.saic-wrap-form input, .saic-wrap-form textarea, #saic-modal input, #saic-modal textarea').placeholder();
  }
  // Autosize Plugin
  if (typeof autosize == 'function') {
    autosize($('textarea.saic-textarea'));
  }

  //Actualizamos alturas de los videos
  $('.saic-wrapper').each(function () {
    rezizeBoxComments_SAIC($(this));
    restoreIframeHeight($(this));
  });
  $(window).resize(function () {
    $('.saic-wrapper').each(function () {
      rezizeBoxComments_SAIC($(this));
      restoreIframeHeight($(this));
    });
  });

  // OBTENER COMENTARIOS
  $('body').on('click', '.saic-link', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_SAIC($(this).data('info'));
    var post_id = linkVars.post_id;
    var num_comments = linkVars.comments;
    var num_get_comments = linkVars.get;
    var order_comments = linkVars.order;
    $("#saic-wrap-commnent-" + post_id).slideToggle(200);
    var $container_comment = $('#saic-container-comment-' + post_id);
    if ($container_comment.length && $container_comment.html().length === 0) {
      getComments_SAIC(post_id, num_comments, num_get_comments, order_comments);
    }
    return false;
  });
  // CARGAR COMENTARIOS AUTOMÁTICAMENTE

  if ($('.saic-link').length) {
    $('.saic-link.auto-load-true').each(function () {
      $(this).click();
    });
  }

  //Mostrar - Ocultar Enlaces de Responder, Editar
  $('body').on('mouseover mouseout', 'li.saic-item-comment', function (event) {
    event.stopPropagation();
    if (event.type === 'mouseover') {
      $(this).find('.saic-comment-actions:first').show();
    } else {
      $(this).find('.saic-comment-actions').hide();
    }
  });

  //Cancelar acciones
  $('body').find('.saic-container-form').keyup(function (tecla) {
    post_id = $(this).find('form').attr('id').replace('commentform-', '');
    if (tecla.which == 27) {
      cancelCommentAction_SAIC(post_id);
    }
  });

  //Mostrar - Ocultar Enlaces de Responder, Editar
  $('body').on('click', 'input.saic-cancel-btn', function (event) {
    event.stopPropagation();
    post_id = $(this).closest('form').attr('id').replace('commentform-', '');
    cancelCommentAction_SAIC(post_id);
  });

  // RESPONDER COMENTARIOS
  $('body').on('click', '.saic-reply-link', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_SAIC($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    //Restauramos cualquier acción
    cancelCommentAction_SAIC(post_id);
    var form = $('#commentform-' + post_id);
    form.find('[name="comment_parent"]').val(comment_id);//input oculto con referencia al padre
    form.find('.saic-textarea').val('').attr('placeholder', SAIC_WP.reply + '. ESC (' + SAIC_WP.cancel + ')').focus();
    form.find('input[name="submit"]').addClass('saic-reply-action');
    $('#commentform-' + post_id).find('input.saic-cancel-btn').show();
    //scroll
    scrollThis_SAIC(form);

    return false;
  });

  //EDITAR COMENTARIOS
  $('body').on('click', '.saic-edit-link', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_SAIC($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    //Restauramos cualquier acción
    cancelCommentAction_SAIC(post_id);
    var form = $('#commentform-' + post_id);
    form.find('[name="comment_parent"]').val(comment_id);//input oculto con referencia al padre
    form.find('.saic-textarea').val('').focus();
    form.find('input[name="submit"]').addClass('saic-edit-action');
    //scroll
    scrollThis_SAIC(form);
    getCommentText_SAIC(post_id, comment_id);
  });

  //ELIMINAR COMENTARIOS
  $('body').on('click', '.saic-delete-link', function (e) {
    e.preventDefault();
    var linkVars = getUrlVars_SAIC($(this).attr('href'));
    var comment_id = linkVars.comment_id;
    var post_id = linkVars.post_id;
    if (confirm(SAIC_WP.textMsgDeleteComment)) {
      deleteComment_SAIC(post_id, comment_id);
    }
  });

  $('input, textarea').focus(function (event) {
    $(this).removeClass('saic-error');
    $(this).siblings('.saic-error-info').hide();
  });

  var captchaValues;
  // CAPTCHA
  if ($('.saic-captcha').length) {
    captchaValues = captcha_SAIC(9);
    $('.saic-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
  }

  // ENVIAR COMENTARIO
  $('body').on('submit', '.saic-container-form form', function (event) {
    event.preventDefault();
    $(this).find(':submit').attr("disabled", "disabled");
    $('input, textarea').removeClass('saic-error');
    var formID = $(this).attr('id');
    var post_id = formID.replace('commentform-', '');
    var form = $('#commentform-' + post_id);
    var link_show_comments = $('#saic-link-' + post_id);
    var linkVars = getUrlVars_SAIC(link_show_comments.data('info'));
    var num_comments = linkVars.comments;
    var form_ok = true;

    // VALIDAR COMENTARIO
    var $content = form.find('textarea').val().replace(/\s+/g, ' ');
    //Si el comentario tiene menos de 2 caracteres no se enviará
    if ($content.length < 2) {
      form.find('.saic-textarea').addClass('saic-error');
      form.find('.saic-error-info-text').show();
      setTimeout(function () {
        form.find('.saic-error-info-text').fadeOut(500);
      }, 2500);
      $(this).find(':submit').removeAttr('disabled');
      return false;
    }
    else {
      // VALIDAR CAMPOS DE TEXTO
      if ($(this).find('input#author').length) {
        var $author = $(this).find('input#author');
        var $authorVal = $author.val().replace(/\s+/g, ' ');
        var $authorRegEx = /^[^?&%$=\/]{1,30}$/i;

        if ($authorVal == ' ' || !$authorRegEx.test($authorVal)) {
          $author.addClass('saic-error');
          form.find('.saic-error-info-name').show();
          setTimeout(function () {
            form.find('.saic-error-info-name').fadeOut(500);
          }, 3000);
          form_ok = false;
        }
      }
      if ($(this).find('input#email').length) {
        var $emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i;
        var $email = $(this).find('input#email');
        var $emailVal = $email.val().replace(/\s+/g, '');
        $email.val($emailVal);

        if (!$emailRegEx.test($emailVal)) {
          $email.addClass('saic-error');
          form.find('.saic-error-info-email').show();
          setTimeout(function () {
            form.find('.saic-error-info-email').fadeOut(500);
          }, 3000);
          form_ok = false;
        }
      }
      if (!form_ok) {
        $(this).find(':submit').removeAttr('disabled');
        return false;
      }

      // VALIDAR CAPTCHA
      if ($('.saic-captcha').length) {
        var captcha = $('#saic-captcha-value-' + post_id);
        form_ok = true;
        var num1;
        var num2;
        if(typeof captchaValues == "undefined" ){
          var numbers = $('.saic-captcha-text').text().replace(/\s+/g, "").split("=")[0];
          num1 = parseInt(numbers.split("+")[0]);
          num2 = parseInt(numbers.split("+")[1]);
        } else {
          num1 = captchaValues.n1;
          num2 = captchaValues.n2;
        }
        if (captcha.val() != (num1 + num2)) {
          form_ok = false;
          captcha.addClass('saic-error');
        }
        captchaValues = captcha_SAIC(9);
        $('.saic-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
        captcha.val('');
      }

      //Si el formulario está validado
      if (form_ok === true) {
        //Si no existe campo lo creamos
        if (!form.find('input[name="comment_press"]').length) {
          form.find('input[name="submit"]').after('<input type="hidden" name="comment_press" value="true">');
        }
        comment_id = form.find('[name="comment_parent"]').val();
        //Insertamos un nuevo comentario
        if (form.find('input[name="submit"]').hasClass('saic-edit-action')) {
          editComment_SAIC(post_id, comment_id);
        }
        else if (form.find('input[name="submit"]').hasClass('saic-reply-action')) {
          insertCommentReply_SAIC(post_id, comment_id, num_comments);
        }
        else {
          insertComment_SAIC(post_id, num_comments);
        }
        cancelCommentAction_SAIC(post_id);
      }
      $(this).find(':submit').removeAttr('disabled');
    }
    return false;
  });//end submit



  $('body').delegate('a.saic-load-more-comments', 'click', function (e) {
    e.preventDefault();
    $(this).parent().find('li.saic-item-comment').fadeIn("slow");
    $(this).remove();
  });

  $('body').delegate('.saic-media-btns a', 'click', function (e) {
    e.preventDefault();
    var post_id = $(this).attr('href').split('=')[1].replace('&action', '');
    var $action = $(this).attr('href').split('=')[2];
    $('body').append('<div id="saic-overlay"></div>');
    $('body').append('<div id="saic-modal"></div>');
    $modalHtml = '<div id="saic-modal-wrap"><span id="saic-modal-close"></span><div id="saic-modal-header"><h3 id="saic-modal-title">Título</h3></div><div id="saic-modal-content"><p>Hola</p></div><div id="saic-modal-footer"><a id="saic-modal-ok-' + post_id + '" class="saic-modal-ok saic-modal-btn" href="#">' + SAIC.accept + '</a><a class="saic-modal-cancel saic-modal-btn" href="#">' + SAIC.cancel + '</a></div></div>';
    $("#saic-modal").append($modalHtml).fadeIn(250);

    switch ($action) {
      case 'url':
        $('#saic-modal').removeClass().addClass('saic-modal-url');
        $('#saic-modal-title').html(SAIC.insertLink);
        $('#saic-modal-content').html('<input type="text" id="saic-modal-url-link" class="saic-modal-input" placeholder="' + SAIC_WP.textUrlLink + '"/><input type="text" id="saic-modal-text-link" class="saic-modal-input" placeholder="' + SAIC_WP.textToDisplay + '"/>');
        break;

      case 'image':
        $('#saic-modal').removeClass().addClass('saic-modal-image');
        $('#saic-modal-title').html(SAIC.insertImage);
        $('#saic-modal-content').html('<input type="text" id="saic-modal-url-image" class="saic-modal-input" placeholder="' + SAIC_WP.textUrlImage + '"/><div id="saic-modal-preview"></div>');
        break;

      case 'video':
        $('#saic-modal').removeClass().addClass('saic-modal-video');
        $('#saic-modal-title').html(SAIC.insertVideo);
        $('#saic-modal-content').html('<input type="text" id="saic-modal-url-video" class="saic-modal-input" placeholder="' + SAIC_WP.textUrlVideo + '"/><div id="saic-modal-preview"></div>');
        $('#saic-modal-footer').prepend('<a id="saic-modal-verifique-video" class="saic-modal-verifique saic-modal-btn" href="#">' + SAIC.checkVideo + '</a>');
        break;
    }
  });//
  //acción Ok
  $('body').delegate('.saic-modal-ok', 'click', function (e) {
    e.preventDefault();
    $('#saic-modal input, #saic-modal textarea').removeClass('saic-error');
    var $action = $('#saic-modal').attr('class');
    var post_id = $(this).attr('id').replace('saic-modal-ok-', '');
    switch ($action) {
      case 'saic-modal-url':
        processUrl_SAIC(post_id);
        break;
      case 'saic-modal-image':
        processImage_SAIC(post_id);
        break;
      case 'saic-modal-video':
        processVideo_SAIC(post_id);
        break;
    }
    autosize.update($('.saic-textarea'));
    closeModal_SAIC();
    return false;
  });
  //eliminamos errores
  $('body').delegate('#saic-modal input, #saic-modal textarea', 'focus', function (e) {
    $(this).removeClass('saic-error');
  });

  //vista previa de imagen
  $('body').delegate('#saic-modal-url-image', 'change', function (e) {
    setTimeout(function () {
      $('#saic-modal-preview').html('<img src="' + $('#saic-modal-url-image').val() + '" />');
    }, 200);
  });

  //vista previa de video
  $('body').delegate('#saic-modal-verifique-video', 'click', function (e) {
    e.preventDefault();
    var $urlVideo = $('#saic-modal-url-video');
    var $urlVideoVal = $urlVideo.val().replace(/\s+/g, '');
    $urlVideo.removeClass('saic-error');
    $(this).attr('id', '');//desactivamos el enlace

    if ($urlVideoVal.length < 1) {
      $urlVideo.addClass('saic-error');
      $('.saic-modal-video').find('a.saic-modal-verifique').attr('id', 'saic-modal-verifique-video');//activamos el enlace
      return false;
    }

    var data = 'url_video=' + $urlVideoVal;
    $.ajax({
      url: SAIC.ajaxurl,
      data: data + '&action=verificar_video_SAIC',
      type: "POST",
      dataType: "html",
      beforeSend: function () {
        $('#saic-modal-preview').html('<div class="saic-loading saic-loading-2"></div>');
      },
      success: function (data) {
        if (data != 'error') {
          $('#saic-modal-preview').html(data);
        } else {
          $('#saic-modal-preview').html('<p class="saic-modal-error">Invalid video url</p>');
        }
      },
      error: function (xhr) {
        $('#saic-modal-preview').html('<p class="saic-modal-error">Failed to process, try again</p>');
      },
      complete: function (jqXHR, textStatus) {
        $('.saic-modal-video').find('a.saic-modal-verifique').attr('id', 'saic-modal-verifique-video');//activamos el enlace
      }
    });//end ajax
  });

  //acción cancelar
  $('body').delegate('#saic-modal-close, .saic-modal-cancel', 'click', function (e) {
    e.preventDefault();
    closeModal_SAIC();
    return false;
  });

  // LIKE COMMENTS
  $('body').delegate('a.saic-rating-link', 'click', function (e) {
    e.preventDefault();
    var comment_id = $(this).attr('href').split('=')[1].replace('&method', '');
    var $method = $(this).attr('href').split('=')[2];
    commentRating_SAIC(comment_id, $method);
    return false;
  });

});//end ready

function getComments_SAIC(post_id, num_comments, num_get_comments, order_comments) {
  var $ = jQuery;
  var status = $('#saic-comment-status-' + post_id);
  var $container_comments = $("ul#saic-container-comment-" + post_id);
  if (num_comments > 0) {
    jQuery.ajax({
      type: "POST",
      dataType: "html",// tipo de información que se espera de respuesta
      url: SAIC.ajaxurl,
      data: {
        action: 'get_comments',
        post_id: post_id,
        get: num_get_comments,
        order: order_comments,
        nonce: SAIC.nonce
      },
      beforeSend: function () {
        status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
      },
      success: function (data) {
        status.removeClass('saic-loading').html('').hide();
        $container_comments.html(data);
        highlightPopularComments_SAIC(post_id, $container_comments);
        $container_comments.show();//Mostramos los Comentarios
        //Insertamos Paginación de Comentarios
        jPages_SAIC(post_id, SAIC.numPerPage);
        toggleMoreComments($container_comments);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        clog('ajax error');
        clog('jqXHR');
        clog(jqXHR);
        clog('errorThrown');
        clog(errorThrown);
      },
      complete: function (jqXHR, textStatus) {
      }
    });//end jQuery.ajax
  }//end if
  return false;
}//end function


function highlightPopularComments_SAIC(post_id, $container_comments) {
  var $ = jQuery;
  var order = $container_comments.data('order');
  if (order == 'likes' && $container_comments.hasClass('saic-multiple-comments saic-has-likes')) {
    var top_likes = $container_comments.find('>.saic-item-comment').eq(0).data('likes');
    var temp = false;
    $container_comments.find('>.saic-item-comment').each(function (index, comment) {
      if (!temp && $(comment).data('likes') == top_likes) {
        $(comment).addClass(SAIC.classPopularComment);
        temp = true;
      }
    });
  }
}

function jQFormSerializeArrToJson(formSerializeArr) {
  var jsonObj = {};
  jQuery.map(formSerializeArr, function (n, i) {
    jsonObj[n.name] = n.value;
  });

  return jsonObj;
}

function insertComment_SAIC(post_id, num_comments) {
  var $ = jQuery;
  var link_show_comments = $('#saic-link-' + post_id);
  var comment_form = $('#commentform-' + post_id);
  var status = $('#saic-comment-status-' + post_id);
  var form_data = comment_form.serialize();//obtenemos los datos

  $.ajax({
    type: 'post',
    method: 'post',
    url: comment_form.attr('action'),
    data: form_data,
    dataType: "html",
    beforeSend: function () {
      status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
    },
    success: function (data, textStatus) {
      cc('success data', data)
      status.removeClass('saic-loading').html('');
      if (data != "error") {
        status.html('<p class="saic-ajax-success">' + SAIC.thanksComment + '</p>');
        if (link_show_comments.find('span').length) {
          num_comments = String(parseInt(num_comments, 10) + 1);
          link_show_comments.find('span').html(num_comments);
        }
      }
      else {
        status.html('<p class="saic-ajax-error">Error processing your form</p>');
      }
      //Agregamos el nuevo comentario a la lista
      $('ul#saic-container-comment-' + post_id).prepend(data).show();
      //Actualizamos el Paginador
      jPages_SAIC(post_id, SAIC.numPerPage, true);
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      status.removeClass('saic-loading').html('<p class="saic-ajax-error" >' + SAIC.duplicateComment + '</p>');
    },
    complete: function (jqXHR, textStatus) {
      setTimeout(function () {
        status.removeClass('saic-loading').fadeOut(600);
      }, 2500);
    }
  });//end ajax
  return false;
}

function insertCommentReply_SAIC(post_id, comment_id, num_comments) {
  var $ = jQuery;
  var link_show_comments = $('#saic-link-' + post_id);
  var comment_form = $('#commentform-' + post_id);
  var status = $('#saic-comment-status-' + post_id);
  var item_comment = $('#saic-item-comment-' + comment_id);
  var form_data = comment_form.serialize();//obtenemos los datos

  $.ajax({
    type: 'post',
    method: 'post',
    url: comment_form.attr('action'),
    data: form_data,
    beforeSend: function () {
      status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
    },
    success: function (data, textStatus) {
      cc('success data', data)
      status.removeClass('saic-loading').html('');
      if (data != "error") {
        status.html('<p class="saic-ajax-success">' + SAIC.thanksReplyComment + '</p>');
        if (link_show_comments.find('span').length) {
          num_comments = parseInt(num_comments, 10) + 1;
          link_show_comments.find('span').html(num_comments);
        }
        if (!item_comment.find('ul').length) {
          item_comment.append('<ul class="children"></ul>');
        }
        //Agregamos el nuevo comentario a la lista
        item_comment.find('ul').append(data);

        //scroll
        setTimeout(function () {
          scrollThis_SAIC(item_comment.find('ul li').last());
        }, 1000);
      }
      else {
        status.html('<p class="saic-ajax-error">Error in processing your form.</p>');
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      status.html('<p class="saic-ajax-error" >' + SAIC.duplicateComment + '</p>');
    },
    complete: function (jqXHR, textStatus) {
      setTimeout(function () {
        status.removeClass('saic-loading').fadeOut(600);
      }, 2500);
    }
  });//end ajax
  return false;

}

function editComment_SAIC(post_id, comment_id) {
  var $ = jQuery;
  var form = $("#commentform-" + post_id);
  var status = $('#saic-comment-status-' + post_id);
  jQuery.ajax({
    type: "POST",
    //dataType: "html",
    url: SAIC.ajaxurl,
    data: {
      action: 'edit_comment_saic',
      post_id: post_id,
      comment_id: comment_id,
      comment_content: form.find('.saic-textarea').val(),
      nonce: SAIC.nonce
    },
    beforeSend: function () {
      status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
    },
    success: function (result) {
      status.removeClass('saic-loading').html('');
      var data = jQuery.parseJSON(result);
      if (data.ok === true) {
        $('#saic-comment-' + comment_id).find('.saic-comment-text').html(data.comment_text);
        //scroll
        setTimeout(function () {
          scrollThis_SAIC($('#saic-comment-' + comment_id));
        }, 1000);
      }
      else {
        console.log("Errors: " + data.error);
      }
    },//end success
    complete: function (jqXHR, textStatus) {
      setTimeout(function () {
        status.removeClass('saic-loading').fadeOut(600);
      }, 2500);
    }
  });//end jQuery.ajax
  return false;
}

function getCommentText_SAIC(post_id, comment_id) {
  var $ = jQuery;
  var form = $("#commentform-" + post_id);
  var status = $('#saic-comment-status-' + post_id);
  jQuery.ajax({
    type: "POST",
    dataType: "html",
    url: SAIC.ajaxurl,
    data: {
      action: 'get_comment_text_saic',
      post_id: post_id,
      comment_id: comment_id,
      nonce: SAIC.nonce
    },
    beforeSend: function () {
      //status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
    },
    success: function (data) {
      //status.removeClass('saic-loading').html('');
      if (data !== 'saic-error') {
        $('#saic-textarea-' + post_id).val(data);
        autosize.update($('#saic-textarea-' + post_id));
        //$('#commentform-'+post_id).find('input[name="submit"]').hide();
        $('#commentform-' + post_id).find('input.saic-cancel-btn').show();
      }
      else {

      }
    },//end success
    complete: function (jqXHR, textStatus) {
      //setTimeout(function(){
      //status.removeClass('saic-loading').hide();
      //},2500);
    }
  });//end jQuery.ajax
  return false;
}//end function


function deleteComment_SAIC(post_id, comment_id) {
  var $ = jQuery;
  jQuery.ajax({
    type: "POST",
    dataType: "html",
    url: SAIC.ajaxurl,
    data: {
      action: 'delete_comment_saic',
      post_id: post_id,
      comment_id: comment_id,
      nonce: SAIC.nonce
    },
    beforeSend: function () {
    },
    success: function (data) {
      if (data === 'ok') {
        $('#saic-item-comment-' + comment_id).remove();
      }
    }//end success
  });//end jQuery.ajax
  return false;
}//end function

//MOSTRAR/OCULTAR MÁS COMENTARIOS
function toggleMoreComments($container_comments) {
  var $ = jQuery;
  //console.log("======================= toggleMoreComments ", $container_comments.attr('id'));
  var liComments = $container_comments.find('>li.depth-1.saic-item-comment');
  liComments.each(function (index, element) {
    var ulChildren = $(this).find('> ul.children');
    if (ulChildren.length && ulChildren.find('li').length > 3) {
      ulChildren.find('li:gt(2)').css('display', 'none');
      ulChildren.append('<a href="#" class="saic-load-more-comments">' + SAIC_WP.textLoadMore + '</a>');
    }
  });
}

function processUrl_SAIC(post_id) {
  var $ = jQuery;
  var $ok = true;
  var $urlField = $('#saic-modal-url-link');
  var $textField = $('#saic-modal-text-link');
  if ($urlField.val().length < 1) {
    $ok = false;
    $urlField.addClass('saic-error');
  }
  if ($textField.val().length < 1) {
    $ok = false;
    $textField.addClass('saic-error');
  }
  if ($ok) {
    var $urlVal = $urlField.val().replace(/https?:\/\//gi, '');
    var link_show_comments = '<a href="http://' + $urlVal + '" title="' + $textField.val() + '" rel="nofollow" target="_blank">' + $textField.val() + '</a>';
    insertInTextArea_SAIC(post_id, link_show_comments);
  }
  return false;
}

function processImage_SAIC(post_id) {
  var $ = jQuery;
  var $ok = true;
  var $urlField = $('#saic-modal-url-image');
  if ($urlField.val().length < 1) {
    $ok = false;
    $urlField.addClass('saic-error');
  }
  if ($ok) {
    var $urlVal = $urlField.val();
    var $image = '<img src="' + $urlVal + '" />';
    insertInTextArea_SAIC(post_id, $image);
  }
  return false;
}

function processVideo_SAIC(post_id) {
  var $ = jQuery;
  var $ok = true;
  var $urlField = $('#saic-modal-url-video');
  if (!$('#saic-modal-preview').find('iframe').length) {
    $ok = false;
    $('#saic-modal-preview').html('<p class="saic-modal-error">Please check the video url</p>');
  }
  if ($ok) {
    var $video = '<p>' + $('#saic-modal-preview').find('input[type="hidden"]').val() + '</p>';
    insertInTextArea_SAIC(post_id, $video);
  }
  return false;
}

function closeModal_SAIC() {
  var $ = jQuery;
  $('#saic-overlay, #saic-modal').remove();
  return false;
}

function jPages_SAIC(post_id, $numPerPage, $destroy) {
  //Si existe el plugin jPages y está activado
  if (typeof jQuery.fn.jPages == 'function' && SAIC.jpages == 'true') {
    var $idList = 'saic-container-comment-' + post_id;
    var $holder = 'div.saic-holder-' + post_id;
    var num_comments = jQuery('#' + $idList + ' > li').length;
    if (num_comments > $numPerPage) {
      if ($destroy) {
        jQuery('#' + $idList).children().removeClass('animated jp-hidden');
      }
      jQuery($holder).show().jPages({
        containerID: $idList,
        previous: SAIC_WP.textNavPrev,
        next: SAIC_WP.textNavNext,
        perPage: parseInt($numPerPage, 10),
        minHeight: false,
        keyBrowse: true,
        direction: "forward",
        animation: "fadeIn",
      });
    }//end if
  }//end if
  return false;
}

function captcha_SAIC($max) {
  if (!$max) $max = 5;
  return {
    n1: Math.floor(Math.random() * $max + 1),
    n2: Math.floor(Math.random() * $max + 1),
  };
}

function scrollThis_SAIC($this) {
  var $ = jQuery;
  if ($this.length) {
    var $position = $this.offset().top;
    var newPosition = findPosition_SAIC($this);
    var $scrollThis = Math.abs(newPosition - 200);
    $('html,body').animate({ scrollTop: $scrollThis }, 'slow');
  }
  return false;
}

function findPosition_SAIC($el) {
  var node = $el.get(0);
  var curtop = 0;
  var curtopscroll = 0;
  if (node.offsetParent) {
    do {
      curtop += node.offsetTop;
      curtopscroll += node.offsetParent ? node.offsetParent.scrollTop : 0;
    } while (node = node.offsetParent);
    return curtop;
  }
  return 0;
}

function getUrlVars_SAIC(url) {
  var query = url.substring(url.indexOf('?') + 1);
  var parts = query.split("&");
  var params = {};
  for (var i = 0; i < parts.length; i++) {
    var pair = parts[i].split("=");
    params[pair[0]] = pair[1];
  }
  return params;
}

function cancelCommentAction_SAIC(post_id) {
  var $ = jQuery;
  $('form#commentform-' + post_id).find('[name="comment_parent"]').val('0');
  $('form#commentform-' + post_id).find('.saic-textarea').val('').attr('placeholder', SAIC.textWriteComment);
  $('form#commentform-' + post_id).find('input[name="submit"]').removeClass();
  $('form#commentform-' + post_id).find('input.saic-cancel-btn').hide();
  autosize.update($('#saic-textarea-' + post_id));
  $('input, textarea').removeClass('saic-error');
  //captchaValues = captcha_SAIC(9);
  //$('.saic-captcha-text').html(captchaValues.n1 + ' &#43; ' + captchaValues.n2 + ' = ');
}

function restoreIframeHeight(wrapper) {
  var widthWrapper = SAIC.widthWrap ? parseInt(SAIC.widthWrap, 10) : wrapper.outerWidth();
  // if(widthWrapper >= 321 ) {
  // 	wrapper.find('iframe').attr('height','250px');
  // } else {
  // 	wrapper.find('iframe').attr('height','160px');
  // }
}

function rezizeBoxComments_SAIC(wrapper) {
  var widthWrapper = SAIC.widthWrap ? parseInt(SAIC.widthWrap, 10) : wrapper.outerWidth();
  if (widthWrapper <= 480) {
    wrapper.addClass('saic-full');
  } else {
    wrapper.removeClass('saic-full');
  }
}

function insertInTextArea_SAIC(post_id, $value) {
  //Get textArea HTML control
  var $fieldID = document.getElementById('saic-textarea-' + post_id);

  //IE
  if (document.selection) {
    $fieldID.focus();
    var sel = document.selection.createRange();
    sel.text = $value;
    return;
  }
  //Firefox, chrome, mozilla
  else if ($fieldID.selectionStart || $fieldID.selectionStart == '0') {
    var startPos = $fieldID.selectionStart;
    var endPos = $fieldID.selectionEnd;
    var scrollTop = $fieldID.scrollTop;
    $fieldID.value = $fieldID.value.substring(0, startPos) + $value + $fieldID.value.substring(endPos, $fieldID.value.length);
    $fieldID.focus();
    $fieldID.selectionStart = startPos + $value.length;
    $fieldID.selectionEnd = startPos + $value.length;
    $fieldID.scrollTop = scrollTop;
  }
  else {
    $fieldID.value += textArea.value;
    $fieldID.focus();
  }
}

function commentRating_SAIC(comment_id, $method) {
  var $ = jQuery;
  var $ratingCount = $('#saic-comment-' + comment_id).find('.saic-rating-count');
  var $currentLikes = $ratingCount.text();
  jQuery.ajax({
    type: 'POST',
    url: SAIC.ajaxurl,
    data: {
      action: 'comment_rating',
      comment_id: comment_id,
      method: $method,
      nonce: SAIC.nonce
    },
    beforeSend: function () {
      $ratingCount.html('').addClass('saico-loading');
    },
    success: function (result) {
      var data = $.parseJSON(result);
      if (data.success === true) {
        $ratingCount.html(data.likes).attr('title', data.likes + ' ' + SAIC_WP.textLikes);
        if (data.likes < 0) {
          $ratingCount.removeClass().addClass('saic-rating-count saic-rating-negative');
        }
        else if (data.likes > 0) {
          $ratingCount.removeClass().addClass('saic-rating-count saic-rating-positive');
        }
        else {
          $ratingCount.removeClass().addClass('saic-rating-count saic-rating-neutral');
        }
      } else {
        $ratingCount.html($currentLikes);
      }
    },
    error: function (xhr) {
      $ratingCount.html($currentLikes);
    },
    complete: function (data) {
      $ratingCount.removeClass('saico-loading');
    }//end success

  });//end jQuery.ajax
}

function clog(msg) {
  console.log(msg);
}

function cc(msg, msg2) {
  console.log(msg, msg2);
}


