$("#oauth").live("pagecreate",function(event){
	oa_setBackButton();
});

$("#oauth").live("pageshow",function(event){
	oa_Oauth();
});

$("#oauth").live('pagebeforehide',function(event, ui){
	
});

function oa_Oauth(){
	$("#oa-w-i").attr("src","https://api.weibo.com/oauth2/authorize?client_id=2314081617&display=mobile&response_type=code&redirect_uri=http://littlebearnews.sinaapp.com/callback.php");
	$("#oa-w-i").unbind().load(function(){
		$("#oa-cover").hide();
		var iframeDiv = $(this).contents().find("div[result]");
		if(iframeDiv.attr("result") == "true"){
			var weibo_uid = iframeDiv.attr("uid");
			window.localStorage.setItem("weibo-uid", weibo_uid);
			history.back();
		}
	});
}

function oa_setBackButton(){
	$("#oa-h-bb").click(function(e) {
        history.back();
		return false;
    });
}