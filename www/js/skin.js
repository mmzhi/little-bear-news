$("#skin").live("pagecreate",function(event){
	sk_setScroll();
	sk_setBackButton();
	$(window).bind("resize",function(e){
		sk_Scroll.refresh();
	});
});

$("#skin").live("pageshow",function(event){
	sk_SetThemes();
});

$("#skin").live('pagebeforehide',function(event, ui){
	
});

var sk_Scroll;

function sk_setScroll(){
	sk_Scroll = new iScroll('sk-setting',{
		hideScrollbar:true,
		bounce:false,
	});
}

function sk_setBackButton(){
	$("#sk-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

function sk_SetThemes(){
	$.ajax({
		url:"xml/theme.xml",
		type:"GET",
		dataType:"xml",
		timeout: 6000,
		cache:false,
		success: function(xml){
			var sk_list = $("#sk-s-w ul");
			sk_list.empty();
			$(xml).find("skin").each(function(index, element) {
				var li = "<li class='sk-s-li' css-name='" + $(this).children("css-name").text() + "'><div class='sk-s-bg noselect' style='" + $(this).children("preview").text() + "'><span class='sk-s-flower'><span class='sk-s-text'>" + $(this).children("skin-name").text() + "</span></span></div></li>"
				sk_list.append($(li));
			});
			sk_Scroll.refresh();
			var now_theme = window.localStorage.getItem("theme");
			if(now_theme == null){
				now_theme = "default";
			}
			$(".sk-s-li[css-name=" + now_theme + "] .sk-s-bg").removeClass("noselect").addClass("isselect");
			sk_setClick();
		}
	});
}

function sk_setClick(){
	$(".sk-s-li").click(function(e) {
        if($(this).children(".sk-s-bg").hasClass("isselect"))return;
		var new_theme = $(this).attr("css-name");
		$(".isselect").removeClass("isselect").addClass("noselect");
		$(this).children(".sk-s-bg").removeClass("noselect").addClass("isselect");
		$("#theme-skin").attr("href","css/theme/" + new_theme + ".css");
		window.localStorage.setItem("theme", new_theme);
    });
}

