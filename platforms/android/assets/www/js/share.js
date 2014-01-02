$("#share").live("pagecreate",function(event){
	sh_setScroll();
	ch_SetClick();
	sh_setBackButton();
	$(window).bind("resize",function(e){
		sh_cScroll.refresh();
	});
});

$("#share").live("pageshow",function(event){
	document.addEventListener("backbutton", sh_SetPhoneBack, false);
	sh_cScroll.refresh();
	sh_title = window.sessionStorage.getItem('comment-title');
	sh_Longurl = window.sessionStorage.getItem('comment-url');
	sh_SetComment();
});

$("#share").live('pagebeforehide',function(event, ui){
	document.removeEventListener("backbutton", sh_SetPhoneBack, false);
});

var sh_title,sh_Longurl,sh_shorturl;
var sh_cScroll;

function sh_setScroll(){
	sh_cScroll = new iScroll('sh-comment',{
		hideScrollbar:true,
		bounce:false,
	});
}

function sh_SetPhoneBack(){
	if($("#sh-dialog").is(":visible")){
		$("#sh-dialog").hide();
		return;
	}else{
		history.back();
		return false;
	}
}

function sh_setBackButton(){
	$("#sh-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

function sh_SetComment(){
	showCover();
	var commentUrl = "http://littlebearnews.sinaapp.com/getcomment.php";
	var weiboUid = window.localStorage.getItem("weibo-uid");
	$.ajax({
		url:commentUrl,
		type:"GET",
		data:{
			uid:weiboUid,
			url:sh_Longurl
		},
		dataType:"xml",
		timeout:30000,
		cache:false,
		error: function(word){
			
		},
		success: function(word){
			$("#sh-cover").hide();
			if($(word).find("error").length > 0){
				$("#sh-open").show();
				return;
			}
			$("#sh-comment").show();
			$("#sh-h-comment").show();
			sh_shorturl = $(word).find("shorturl").text();
			var comments = $(word).find("comment");
			if($(word).find("comment").length == 0){
				$("#sh-c-w ul").empty().append("<li><span>还没有人评论过哦，快点来抢沙发吧！</span></li>");
				sh_cScroll.refresh();
			}else{
				var coul = $("#sh-c-w ul");
				var colist = "<li><span>最新评论：</span></li>";
				$(word).find("comment").each(function(index, element) {
                    colist = colist + "<li><div class='sh-c-name'>@" + $(this).attr("weiboname") + "：</div><div class='sh-c-text'>" + $(this).text() + "</div><div class='sh-c-time'>" + $(this).attr("commenttime") + "</div></li>";
                });
				coul.empty().append($(colist));
				sh_cScroll.refresh();
			}
			
		}
	});
}


function ch_SetClick(){
	$("#sh-open .sh-open-button").click(function(e) {
        $.mobile.changePage("#oauth", "none");
    });
	
	$("#sh-d-tdcancel").click(function(e) {
        $("#sh-dialog").hide();
    });
	
	$("#sh-h-comment button").click(function(e) {
        $("#sh-d-tdinput").val("-《" + sh_title + "》- " + sh_shorturl + " -");
		$("#sh-dialog").show();
    });
	
	$("#sh-d-tdinput").change(function(e) {
        var textLen = 140 - $(this).val().length;
		$("#sh-d-tdhint").text("还可以输入" + textLen + "个字");
    });
	
	$("#sh-d-tdconfirm").click(function(e) {
        var textLen = 140 - $("#sh-d-tdinput").val().length;
		if(textLen < 0){showToast("亲，超出字数啦！",$("#sh-toast"));return;}
		if(textLen == 140){showToast("亲，内容不能为空啦！",$("#sh-toast"));return;}
		sh_SendWeiBo();
		$("#sh-dialog").hide();
    });
}

function showCover(){
	$("#sh-cover").show();
	$("#sh-comment").hide();
	$("#sh-open").hide();
	$("#sh-h-comment").hide();
	
}



function sh_SendWeiBo(){
	var weiboUid = window.localStorage.getItem("weibo-uid");
	$.ajax({
		url:"http://littlebearnews.sinaapp.com/sendweibo.php",
		type:"get",
		data:{
			uid:weiboUid,
			url:sh_shorturl,
			weibo:$("#sh-d-tdinput").val()
		},
		dataType:"xml",
		timeout:30000,
		cache:false,
		error: function(word){
			
		},
		success: function(word){
			if($(word).find("error").length > 0){
				return;
			}
			var coul = $("#sh-c-w ul");
			var colist = "";
			$(word).find("comment").each(function(index, element) {
				colist = colist + "<li><div class='sh-c-name'>@" + $(this).attr("weiboname") + "：</div><div class='sh-c-text'>" + $(this).text() + "</div><div class='sh-c-time'>" + $(this).attr("commenttime") + "</div></li>";
			});
			$("#sh-c-w ul").children("li:first").children("span").text("最新评论：");
			coul.append($(colist));
			sh_cScroll.refresh();
		}
	});
}