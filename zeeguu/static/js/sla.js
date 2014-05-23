NOTHING_MORE_TO_STUDY="Nothing else to study here for today..."
function showStar(starred)
{
    if (starred) {
        $("#star").html('<i style="color:gold" class="icon-star"></i>');
    } else {
        $("#star").html('<i style="color:lightgray" class="icon-star-empty"></i>');
    }
}



$(function() {
    if (typeof chrome !== "undefined" && !chrome.app.isInstalled) {
        $("#install-extension").click(function() {
            chrome.webstore.install();
        });
    } else {
        $("#install-extension").prop("disabled", true).addClass("disabled");
    }

    $('input').focus(function() {
        $(this).popover('show');
    });


    $('input').blur(function() {
        $(this).popover('hide');
    });

    $("#login").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required:true,
                minlength: 4
            }
        },

        errorClass: "help-inline",
        errorElement: "span",
        highlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group').removeClass('success');
            $(element).parents('.control-group').addClass('error');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group').removeClass('error');
            $(element).parents('.control-group').addClass('success');
        }
    });

    $("#login input[type=submit]").click(function() {
        return $("form").valid();
    });

    $("#create_account").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required:true,
                minlength: 4
            },
            name: {
                required: true
            }
        },

        errorClass: "help-inline",
        errorElement: "span",
        highlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group').removeClass('success');
            $(element).parents('.control-group').addClass('error');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group').removeClass('error');
            $(element).parents('.control-group').addClass('success');
        }
    });

    $("#create_account input[type=submit]").click(function() {
        return $("form").valid();
    });


    // Language Gym
    if ($("#question").length === 0) {
        return;
    }

    $("#lang1, #lang2").select2().change(newQuestion);

    $("#direction").click(function() {
        reverse = !reverse;
        $(this).html('<i class="icon-long-arrow-' + (reverse ? "left" : "right") + '"></i>');
        newQuestion();
    });

    $("#star").click(
        function() {
            starred = !starred;
            showStar(starred);
            $.post("/gym/" + (starred? "starred_card" : "unstarred_card") + "/" + last_question.id);
        }
    );


    $("#answer").focus().keyup(function(e) {
        if (e.keyCode == 13) {  // Return key
            checkAnswer();
        }
    });

    $("#translate_answer").focus().keyup(function(e) {
        if (e.keyCode == 13) {  // Return key
            checkTranslateAnswer();
        }
    });

    if ($("#answer").length) {
        newQuestion();
    }
    if ($("#translate_answer").length) {
        console.log("----> setting up a new translate question...")
        newTranslateQuestion();
    }



});

var last_question = null;
var reverse = false;
var ready = false;
var starred = false;

function newQuestion() {
    var from_lang = $("#lang1").val(),
        to_lang = $("#lang2").val();
    if (reverse) {
        var swap = from_lang;
        from_lang = to_lang;
        to_lang = swap;
    }
    $("#question").html('<span class="loading">Loading...</span>');
    $.getJSON("/gym/question/" + from_lang + "/" + to_lang, function(data) {
        console.log(data);
        if (data == "NO CARDS") {
            $("#example").hide();
            $("#example_url").hide();
            $("#reason").hide();
            $("#rank").hide();
            $("#progress").hide();
            $("#answer").hide();
            $("#question").html('<span class="wrong">'+NOTHING_MORE_TO_STUDY+'</span>');
            return;
        }
        $("#question").html('<span>' + data.question + '</span>');
        $("#example").html('<span>' + data.example+ '</span>');
        $("#reason").html('<span>' + data.reason + '</span>');
        $("#rank").html('<span>Rank: ' + data.rank+ '</span>');
        $("#example_url").html('<span><a href="' + data.url + '">(source)</a></span>');
        $("#progress").html('<span>Progress: ' + data.position * 10+ '%</span>');
        showStar(data.starred);

        starred = data.starred;
        last_question = data;
        ready = true;
    });
}

//there is a bit too much duplication between this function and newQuestion...
function newTranslateQuestion() {
    var from_lang = $("#lang1").val(),
        to_lang = $("#lang2").val();
    if (reverse) {
        var swap = from_lang;
        from_lang = to_lang;
        to_lang = swap;
    }
    $("#question").html('<span class="loading">Loading...</span>');
    url = ["/gym/question_with_min_level", 3, from_lang, to_lang].join("/");
    $.getJSON(url, function(data) {
        console.log(data);
        if (data == "NO CARDS") {
//            ML: This is Ugly code...
            $("#example").hide();
            $("#star").hide();
            $("#example_url").hide();
            $("#reason").hide();
            $("#rank").hide();
            $("#progress").hide();
            $("#translate_answer").hide();
            $("#question").html('<span class="wrong">'+NOTHING_MORE_TO_STUDY+'</span>');
            return;
        }
        $("#question").html('<span>' + data.question + '</span>');
        $("#example").html('<span>' + data.example+ '</span>');
        $("#reason").html('<span>' + data.reason + '</span>');
        $("#rank").html('<span>' + data.rank+ '</span>');
        $("#example_url").html('<span><a href="' + data.url + '">(source)</a></span>');
        $("#progress").html('<span>Progress: ' + data.position * 10+ '%</span>');
        showStar(data.starred);

        starred = data.starred;
        last_question = data;
        ready = true;
    });
}

function checkAnswer() {
    if (!ready) {
        return;
    }

    //  test the correctness of the answer on the server side...
    url = ["/gym/test_answer", $("#answer").val(), last_question.answer, last_question.id ].join("/");
    $.post(url,
        function(data) {

            var back = flippant.flip(
                $("#question2").get(0),
                    '<div class="'+data.toLowerCase()+'">' +
                    last_question.question+ " " +
                    "<br/>" +
                    "=<br/>"+
                    last_question.answer + " " +
                    '</div>',
                "card",
                "card"
            );

            newQuestion();
            $("#answer").hide();
            window.setTimeout(function() {
                back.close();
                $("#answer").val("").show().focus();
            }, 3000);

            }
    );
}

function checkTranslateAnswer() {
    if (!ready) {
        return;
    }

    //  test the correctness of the answer on the server side...
    url = ["/gym/test_answer", $("#translate_answer").val(), last_question.answer, last_question.id ].join("/");
    $.post(url,
        function(data) {

//            var back = flippant.flip(
//                $("#question2").get(0),
//                '<span class="'+data.toLowerCase()+'">' + last_question.answer + '</span>',
//                "card",
//                "card"
//            );

            var back = flippant.flip(
                $("#question2").get(0),
                    '<div class="'+data.toLowerCase()+'">' +
                    last_question.question+ " " +
                    "<br/>" +
                    "=<br/>"+
                    last_question.answer + " " +
                    '</div>',
                "card",
                "card"
            );

            newTranslateQuestion();
            $("#translate_answer").prop("disabled", true);
            window.setTimeout(function() {
                back.close();
                $("#translate_answer").val("").prop("disabled", false).focus();
            }, 3000);

            }
    );
}


function deleteContribution(id) {
    console.log("deleting " + id);
    $.post("/gym/delete_contribution/"+id);
    $("#contribution"+id).fadeOut();
    return false;
}

function unstarContribution(id) {
    console.log("unstarring " + id)
    $.post("/gym/unstarred_word/" + id);
    $("#star"+id).html('<a href="javascript:void(0);" onclick="starContribution('+id+')"><i style="color:lightgray" class="icon-star-empty"></i></a>');
}

function starContribution(id) {
    console.log("starring " + id)
    $.post("/gym/starred_word/" + id);
    $("#star"+id).html('<a href="javascript:void(0);" onclick="unstarContribution('+id+')"><i style="color:gold" class="icon-star"></i></a>');
}




