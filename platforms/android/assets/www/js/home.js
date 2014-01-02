$("#home").live("pagecreate",function(event){
	document.addEventListener("deviceready", Ho_Initialize, false);
});

$("#home").live("pageshow",function(event){
	if(ho_cScroll != null && ho_iScroll != null && ho_mScroll != null){
		ho_cScroll.refresh();
		ho_iScroll.refresh();
		ho_mScroll.refresh();
	}
	if(window.sessionStorage.getItem('RefreshChannel') == "true"){
		window.sessionStorage.setItem('RefreshChannel',"false");
		ho_setChannelInDB(ho_RefreshChannel);
	}
	if(ho_allright == true){
		document.addEventListener("backbutton", ho_SetPhoneBack, false);
		document.addEventListener("menubutton", ho_SetPhoneMenu, false);
	}
});

$("#home").live('pagebeforehide',function(event, ui){
	document.removeEventListener("backbutton", ho_SetPhoneBack, false);
	document.removeEventListener("menubutton", ho_SetPhoneMenu, false);
});


function ValuesPlugin(){
	this.openapp = function(successCallback, failureCallback){
		return PhoneGap.exec(successCallback,failureCallback,"AppShelfPlugin","open",[]);
	}
}

function Ho_Initialize(){
	setTheme();
	ho_setScroll();
	ho_setChannelInDB(ho_InitializeChannel);
	ho_SetMainClick();
	ho_SetWeatherClick();
	ho_SetHistroyItems();
	if(window.localStorage.getItem("city") == null){
		ho_SetWeather();
	}else{
		ho_SetWeatherByGeolocation();
	}
	$(window).bind("resize",function(e){
		ho_cScroll.refresh();
		ho_iScroll.refresh();
		ho_mScroll.refresh();
	});
	document.addEventListener("backbutton", ho_SetPhoneBack, false);
	document.addEventListener("menubutton", ho_SetPhoneMenu, false);
	setTimeout("removeCache()", 30000);
	ho_allright = true;
}

function setTheme(){
	var now_theme = window.localStorage.getItem("theme");
	$("#theme-skin").attr("href","css/theme/" + now_theme + ".css");
}

var ho_cScroll,ho_iScroll,ho_mScroll;		//定义三个滚动iScroll变量
var ho_ChannelUrl;
var uuid_num = 0;
var ho_weather_tipnum = 1;
var ho_exitTime = false;
var ho_allright = false;
var ho_timeRefresh;

//初始化三个滚动iScroll变量
function ho_setScroll(){
	ho_cScroll = new iScroll('ho-c-w',{
		vScroll:false,
		hScroll:true,
		hScrollbar:false,
		bounce:false,
		onScrollMove: function(){
			if (this.x != 0){
				$("#ho-c-lb").show();
			}else{
				$("#ho-c-lb").hide();
			}
			if (this.x != this.maxScrollX && $("#ho-c-ws").width() > $("#ho-c-w").width()){
				$("#ho-c-rb").show();
			}else{
				$("#ho-c-rb").hide();
			}
		}
	});
	
	ho_iScroll = new iScroll('ho-items', {
		hideScrollbar: true,
		useTransition: true,
		topOffset: $("#ho-i-sp").height()+10,
		onRefresh: function () {
			if ($("#ho-i-sp").hasClass("loading")) {
				$("#ho-i-sp").attr("class","");
				$("#ho-i-sp").children(".ho-i-spl").html("下拉可以刷新");
			}
		},
		onScrollMove: function () {
			if (this.y > 5 && !$("#ho-i-sp").hasClass("flip") && !$("#ho-i-sp").hasClass("loading")) {
				$("#ho-i-sp").attr("class","flip");
				$("#ho-i-sp").children(".ho-i-spl").html("松开可以刷新");
				this.minScrollY = 0;
			} else if (this.y < 5 && $("#ho-i-sp").hasClass("flip") && !$("#ho-i-sp").hasClass("loading")) {
				$("#ho-i-sp").attr("class","");
				$("#ho-i-sp").children(".ho-i-spl").html("下拉可以刷新");
				this.minScrollY = -($("#ho-i-sp").height()+10);
			}
		},
		onScrollEnd: function () {
			if ($("#ho-i-sp").hasClass("flip")) {
				$("#ho-i-sp").attr("class","loading");
				$("#ho-i-sp").children(".ho-i-spl").html("加载中");
				ho_SetItemsByWEB(ho_ChannelUrl);
			}
		}
	});
	
	ho_mScroll = new iScroll('ho-morechannel',{
		bounce:false,
	});
}

function ho_SetPhoneBack(){
	if($("#ho-weather").is(":visible")){
		$("#ho-weather").hide();
		return;
	}
	if($("#ho-main").is(":visible")){
		$("#ho-main").hide();
		return;
	}
	if(ho_exitTime == false){
		ho_exitTime = true;
		showToast("再点击一次退出!",$("#ho-toast"));
		setTimeout(function(){ho_exitTime = false;}, 3000);
	}
	else{
		navigator.app.exitApp();
	}
}

function ho_SetPhoneMenu(){
	if($("#ho-weather").is(":visible")){
		return;
	}
	if($("#ho-main").is(":visible")){
		$("#ho-main").hide();
		return;
	}else{
		$("#ho-main").show();
	}
}


//初始化Channel栏
function ho_InitializeChannel(tx, results){
	ho_SetChannel(tx, results);
	channelSelect = $("#ho-c-wsl li:first a");
	$("#ho-c-wss").css("left",$("#ho-c-wsl li:first").offset().left-20).css("width",$("#ho-c-wsl li:first").width()+13);
	channelSelect.css("color","#EEE");
	ho_ChannelUrl = $("#ho-c-wsl li:first a").attr("item-href");
	if(ho_ChannelUrl != null){
		ho_setItemsInDB(ho_ChannelUrl,ho_SetItemsByDB);
	}
}

//更新Channel栏项目
function ho_SetChannel(tx, results){
	var h_channellist = $("#ho-c-wsl");
	h_channellist.empty();
	var len = results.rows.length;
	if(len != 0){
		for (var i=0; i<len; i++){
			if(results.rows.item(i).ishome == "true"){
				var $channel_li = $("<li><a item-href='"+results.rows.item(i).url+"'>" + results.rows.item(i).name + "</a></li>;");
				h_channellist.append($channel_li);
			}
		}
		ho_SetMoreChannel(results);
	}
	var $channel_li = $("<li><a>更多 </a></li>");
	h_channellist.append($channel_li);
	ho_cScroll.refresh();
	
	if (ho_cScroll.x != 0){
		$("#ho-c-lb").show();
	}else{
		$("#ho-c-lb").hide();
	}
	
	if (ho_cScroll.x != ho_cScroll.maxScrollX && $("#ho-c-ws").width() > $("#ho-c-w").width() ){
		$("#ho-c-rb").show();
	}else{
		$("#ho-c-rb").hide();
	}
	ho_SetChannelClick();
}

function ho_RefreshChannel(tx, results){
	ho_SetChannel(tx, results);
	$("#ho-c-rb").click();
}


//设置其他channel频道列表
function ho_SetMoreChannel(results){
	var mcList = $("#ho-mc-l");
	mcList.empty();
	var len = results.rows.length;
	for (var i=0; i<len; i++){
		if(results.rows.item(i).ishome == "false"){
			var $channel_li = $("<li chanell-url='"+results.rows.item(i).url+"'><span class='ho-mc-cn'>" + results.rows.item(i).name + "</span><span class='ho-mc-cr'>" + results.rows.item(i).remark + "</span></li>");
			mcList.append($channel_li);
		}
	}
	ho_SetMoreClick();
	ho_mScroll.refresh();
}

//从数据库后获取数据更新列表，完成后读取网络
function ho_SetItemsByDB(tx, results,url){
	ho_HistroyRefresh();
	var list = $("#ho-i-sl");
	list.empty();
	var len = results.rows.length;
	var saveFileArray = new Array();
	if(len != 0){
		for (var i=0; i<len; i++){
			var $li = $("<li item-uid='"+results.rows.item(i).uid+"'><div class='ho-i-stat'><div class='ho-i-stl'>" + results.rows.item(i).title + "</div><div class='ho-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>");
			list.append($li);
			saveFileArray.push({uid:results.rows.item(i).uid,url:results.rows.item(i).item_url});
		}
		if(window.localStorage.getItem("OfflineBrowsing") == "true")items_down(saveFileArray);
		$("#ho-cover").hide();
		ho_iScroll.refresh();
		ho_iScroll.scrollTo(0, 0, 0, false);
		ho_iScroll.refresh();
		ho_SetItemsClick();
	}
	ho_SetItemsByWEB(url);
}

//从网络读取数据，写入数据库
function ho_SetItemsByWEB(url){
	$.ajax({
		url:url,
		type:"GET",
		dataType:"xml",
		timeout:30000,
		cache:false,
		success: function(xml){
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				$(xml).find("channel").children("item").each(function(index, element) {
					var title = $(this).children("title").text();
					var rlink = $(this).children("link").text();
					var description = $(this).children("description").text();
					var pubDate = transitionDate($(this).children("pubDate").text());
					tx.executeSql("SELECT uid,title,pubDate FROM Items WHERE channel_url = '"+ url +"' AND item_url = '"+ rlink +"'", [], function(tx, results){
						var len = results.rows.length;
						if(len == 0){
							tx.executeSql("INSERT INTO Items (uid,channel_url,item_url,title,pubDate,description) VALUES ('"+getUid()+"', '"+ url +"', '"+ rlink +"', '"+ title +"', '"+ pubDate +"','"+ description +"')",[],function(){},errorCB);
						}
					}, errorCB);
				});
				tx.executeSql("DELETE FROM Items WHERE channel_url = '"+ url +"' AND pubDate < (SELECT pubDate FROM Items WHERE channel_url = '"+ url +"' ORDER BY pubDate DESC LIMIT "+ window.localStorage.getItem("OneItemsOfTheCeiling") +" , 1)");
				tx.executeSql("DELETE FROM Items WHERE pubDate < (SELECT pubDate FROM Items ORDER BY pubDate DESC LIMIT "+ window.localStorage.getItem("AllItemsOfTheCeiling") +" , 1)");
			}, errorCB,function(){
				ho_UpdateItemsFirst(url);
			});
		},error: function(){
			ho_iScroll.refresh();
			showToast("读取网络数据失败",$("#ho-toast"));
		}
	});
}

//从数据库获取最新的列表并更新
function ho_UpdateItemsFirst(url){
	if($("#ho-i-sl li").length == 0){
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#ho-i-sl");
				var len = results.rows.length;
				var saveFileArray = new Array();
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='ho-i-stat'><div class='ho-i-stl'>" + results.rows.item(i).title + "</div><div class='ho-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
						saveFileArray.push({uid:results.rows.item(i).uid,url:results.rows.item(i).item_url});
					}
					if(url == ho_ChannelUrl){
						if(window.localStorage.getItem("OfflineBrowsing") == "true")items_down(saveFileArray);
						list.empty();
						list.append($(lis));
						$("#ho-cover").hide();
						ho_iScroll.refresh();
						ho_iScroll.scrollTo(0, 0, 0, false);
						ho_iScroll.refresh();
						ho_SetItemsClick();
						ho_SetRefreshOfTime();
					}
				}else{
					ho_iScroll.refresh();
					ho_SetRefreshOfTime();
				}
			}, errorCB);
		}, errorCB);
	}else{
		var item_uid = $("#ho-i-sl li:first").attr("item-uid");
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' AND pubDate > (SELECT pubDate FROM Items WHERE uid="+item_uid+") ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#ho-i-sl");
				var len = results.rows.length;
				var saveFileArray = new Array();
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='ho-i-stat'><div class='ho-i-stl'>" + results.rows.item(i).title + "</div><div class='ho-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
						saveFileArray.push({uid:results.rows.item(i).uid,url:results.rows.item(i).item_url});
					}
					if(url == ho_ChannelUrl){
						if(window.localStorage.getItem("OfflineBrowsing") == "true")items_down(saveFileArray);
						list.prepend($(lis));
						$("#ho-cover").hide();
						ho_iScroll.refresh();
						ho_iScroll.scrollTo(0, 0, 0, false);
						ho_iScroll.refresh();
						ho_SetItemsClick();
						ho_SetRefreshOfTime();
					}
				}else{
					ho_iScroll.refresh();
					ho_SetRefreshOfTime();
				}
			}, errorCB);
		}, errorCB);
	}
	
}

function ho_SetRefreshOfTime(){
	clearTimeout(ho_timeRefresh);
	ho_timeRefresh = setTimeout(function(){
		if($("#home").is(":visible")){
			ho_SetItemsByWEB(ho_ChannelUrl);
		}
	},window.localStorage.getItem("RefreshTime")*60*1000)
}



//从数据库获取Channel列表
function ho_setChannelInDB(handler){
	var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
	db.transaction(function(tx){
		tx.executeSql("SELECT rank,ishome,name,remark,url FROM Channel ORDER BY rank ASC", [], handler, errorCB);
	}, errorCB);
}


//从数据库获取items列表
function ho_setItemsInDB(url,handler){
	var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
	db.transaction(function(tx){
		tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
			handler(tx, results, url);
		}, errorCB);
	}, errorCB);
}

//设置channel的点击事件
function ho_SetChannelClick(){
	$("#ho-c-wsl li:not(:last)").unbind().click(function(){
		$("#ho-c-wss").animate({left:$(this).offset().left-$("#ho-c-wsl").offset().left,width:$(this).width()+13},100);
		channelSelect.animate({color:"#333"},100);
		$(this).children("a").animate({color:"#EEE"},100);
		if($("#ho-morechannel").is(":visible")){
			$("#ho-items").show();
			$("#ho-morechannel").hide();
		}
		channelSelect = $(this).children("a");
		ho_ChannelUrl = $(this).children("a").attr("item-href");
		if(ho_ChannelUrl != null){
			ho_setItemsInDB(ho_ChannelUrl,ho_SetItemsByDB);
			$("#ho-cover").show();
		}
		return false;
	});
	$("#ho-c-wsl li:last").unbind().click(function(){
		$("#ho-c-wss").animate({left:$(this).offset().left-$("#ho-c-wsl").offset().left,width:$(this).width()+13},100);
		channelSelect.animate({color:"#333"},100);
		$(this).children("a").animate({color:"#EEE"},100);
		channelSelect = $(this).children("a");
		url = null;
		$("#ho-items").hide();
		$("#ho-morechannel").show();
		ho_mScroll.refresh();
		$("#ho-cover").hide();
		return false;
	});
	$("#ho-c-lb").unbind().click(function(){
		$("#ho-c-wss").animate({left:$("#ho-c-wsl li:first").offset().left-$("#ho-c-wsl").offset().left,width:$("#ho-c-wsl li:first").width()+13},100);
		channelSelect.animate({color:"#333"},100);
		$("#ho-c-wsl li:first").children("a").animate({color:"#EEE"},100);
		if($("#ho-morechannel").is(":visible")){
			$("#ho-items").show();
			$("#ho-morechannel").hide();
		}
		channelSelect = $("#ho-c-wsl li:first").children("a");
		ho_ChannelUrl = $("#ho-c-wsl li:first").children("a").attr("item-href");
		ho_cScroll.scrollToElement("li:nth-child(1)" ,0);
		if (ho_cScroll.x != ho_cScroll.maxScrollX && $("#ho-c-ws").width() > $("#ho-c-w").width()){
			$("#ho-c-rb").show();
		}else{
			$("#ho-c-rb").hide();
		}
		if(ho_ChannelUrl != null){
			ho_setItemsInDB(ho_ChannelUrl,ho_SetItemsByDB);
			$("#ho-cover").show();
		}
		return false;
	});
	$("#ho-c-rb").unbind().click(function(){
		$("#ho-c-wss").animate({left:$("#ho-c-wsl li:last").offset().left-$("#ho-c-wsl").offset().left,width:$("#ho-c-wsl li:last").width()+13},100);
		channelSelect.animate({color:"#333"},100);
		$("#ho-c-wsl li:last").children("a").animate({color:"#EEE"},100);
		channelSelect = $("#ho-c-wsl li:last").children("a");
		url = "";
		ho_cScroll.scrollToElement("li:last-child" ,0);
		if (ho_cScroll.x != 0){
			$("#ho-c-lb").show();
		}else{
			$("#ho-c-lb").hide();
		}
		$("#ho-items").hide();
		$("#ho-morechannel").show();
		ho_mScroll.refresh();
		$("#ho-cover").hide();
		return false;
	});
}

function ho_SetHistroyItems(){
	$("#ho-i-sm").click(function(e) {
        if($(this).attr("click-type") == "false")return;
		if($("#ho-i-sl li").length == 0)return;
		$("#ho-i-sm").text("加载中……");
		$("#ho-i-sm").attr("click-type","false");
		var last_uid = $("#ho-i-sl li:last").attr("item-uid");
		var url = ho_ChannelUrl;
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' AND pubDate < (SELECT pubDate FROM Items WHERE uid="+last_uid+") ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#ho-i-sl");
				var len = results.rows.length;
				var saveFileArray = new Array();
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='ho-i-stat'><div class='ho-i-stl'>" + results.rows.item(i).title + "</div><div class='ho-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
						saveFileArray.push({uid:results.rows.item(i).uid,url:results.rows.item(i).item_url});
					}
					if(url == ho_ChannelUrl && $("#ho-i-sm").attr("click-type") == "false"){
						if(window.localStorage.getItem("OfflineBrowsing") == "true")items_down(saveFileArray);
						list.append($(lis));
						ho_iScroll.refresh();
						ho_SetItemsClick();
						ho_HistroyRefresh();
					}
				}else{
					showToast("没有更久的条目了",$("#ho-toast"));
					ho_HistroyRefresh();
				}
			}, errorCB);
		}, errorCB);
    });
}

function ho_HistroyRefresh(){
	$("#ho-i-sm").text("点击查看后面的条目");
	$("#ho-i-sm").attr("click-type","true");
}


//设置items栏点击事件
function ho_SetItemsClick(){
	$(".ho-i-stat").unbind().click(function(e) {
		var uid = $(this).parent().attr("item-uid");
		window.sessionStorage.setItem('refreContent',"true");
		window.sessionStorage.setItem('ContentUid',uid);
		$.mobile.changePage("#content", "none");
	});
}

function ho_SetMoreClick(){
	$("#ho-mc-l li").unbind().click(function(e) {
		var new_url = $(this).attr("chanell-url");
		window.sessionStorage.setItem('RefreshItemsList',"true");
		window.sessionStorage.setItem('ItemsListUrl',new_url);
		$.mobile.changePage("#itemslist", "itemslist");
	});
}



//设置main栏的点击事件
function ho_SetMainClick(){
	$("#ho-h-tile").unbind().click(function(){
		$("#ho-main").show();
	});
	$("#ho-main").unbind().click(function(){
		$("#ho-main").hide();
	});
	$(".c-m-item").live("vmousedown" ,function(e) {
		$(this).css("background","#FC6");
	});
	$(".c-m-item").live("vmouseup" ,function(e) {
		$(this).css("background","none");
	});
	
	$("#ho-m-setup").click(function(e) {
        $.mobile.changePage("#setting", "none");
    });
	
	$("#ho-m-manage").click(function(e) {
        $.mobile.changePage("#channelset", "none");
    });
	
	$("#ho-m-skin").click(function(e) {
        $.mobile.changePage("#skin", "none");
    });
	
	$("#ho-m-more").click(function(e) {
        var valuesplugin = new ValuesPlugin();
		valuesplugin.openapp(function(){
			
		},function(){
			
		});
    });
}


//获取天气信息方法
function ho_SetWeather(){
	ho_SetWeather(null,null);
}

//获取天气信息方法
function ho_SetWeather(longitude,latitude){
	var weather_url="http://littlebearnews.sinaapp.com/weather.php"
	var weather_date;
	if(longitude != null && latitude != null){
		weather_date = {
			longitude:longitude,
			latitude:latitude,
			city:window.localStorage.getItem("city")
		}
	}else{
		weather_date = {
			city:window.localStorage.getItem("city")
		}
	}
	
	
	$.ajax({
		url:weather_url,
		type:"GET",
		data:weather_date,
		dataType:"XML",
		timeout:30000,
		cache:false,
		success: function(xml){
			$("#ho-w-refresh").text("刷新");
			if($(xml).find("Weather").length == 0){
				showToast("没有当地城市天气信息",$("#ho-toast"));
				return;
			}
			var nowDate = new Date();
			var nowHours = nowDate.getHours();
			var nowAPM,nowCSSAPM;
			if(nowHours >= 18 || nowHours < 6){
				nowAPM = "2";
				nowCSSAPM = "ye";
			}else{
				nowAPM = "1";
				nowCSSAPM = "bai";
			}
			var css_weather_name = getWeatherEN($(xml).find("Weather").children("status" + nowAPM).text());
			$("#ho-h-wimg").attr("class","we-" + css_weather_name + "-small");
			var now_day = checkTensDigit(nowDate.getDate());
			var now_month = checkTensDigit(nowDate.getMonth() + 1);
			$("#ho-w-monthone").attr("class","ho-w-num" + now_month.substr(0,1));
			$("#ho-w-monthtwo").attr("class","ho-w-num" + now_month.substr(1,1));
			$("#ho-w-dateone").attr("class","ho-w-num" + now_day.substr(0,1));
			$("#ho-w-datetwo").attr("class","ho-w-num" + now_day.substr(1,1));
			$("#ho-w-imgbig").attr("class","we-" + nowCSSAPM + "-" + css_weather_name + "-big");
			$("#ho-w-cityname").text($(xml).find("Weather").children("city").text());
			window.localStorage.setItem("city", $(xml).find("Weather").children("city").text());
			$("#ho-w-weathtext").text($(xml).find("Weather").children("status" + nowAPM).text()+" "+ $(xml).find("Weather").children("temperature" + nowAPM).text() + "℃");
			$("#ho-w-sfx").text($(xml).find("Weather").children("direction" + nowAPM).text()+" "+$(xml).find("Weather").children("power" + nowAPM).text());
			$("#ho-w-szwx").text($(xml).find("Weather").children("zwx_l").text()+"，"+$(xml).find("Weather").children("zwx_s").text());
			$("#ho-w-swr").text($(xml).find("Weather").children("pollution_l").text()+"，"+$(xml).find("Weather").children("pollution_s").text());
			$("#ho-w-stg").text($(xml).find("Weather").children("ssd_l").text()+"，"+$(xml).find("Weather").children("ssd_s").text());
			$("#ho-w-scy").text($(xml).find("Weather").children("chy_shuoming").text());
			$("#ho-w-sgm").text($(xml).find("Weather").children("gm_s").text());
			$("#ho-w-syd").text($(xml).find("Weather").children("yd_l").text()+"，"+$(xml).find("Weather").children("yd_s").text());
			$("#ho-w-skt").text($(xml).find("Weather").children("ktk_l").text()+"，"+$(xml).find("Weather").children("ktk_s").text());
			$("#ho-w-sxc").text($(xml).find("Weather").children("xcz_s").text());
		},
		error: function(xml){
			showToast("读取天气失败，请检查网络",$("#ho-toast"));
			$("#ho-w-refresh").text("刷新");
		}
	});
}


//从地理位置服务中获取坐标调用天气获取方法
function ho_SetWeatherByGeolocation(){
	$("#ho-w-refresh").text("正在刷新……");
	navigator.geolocation.getCurrentPosition(function(position){
		ho_SetWeather(position.coords.longitude,position.coords.latitude);
	}, function(){
		ho_SetWeather();
	},{timeout: 60000});
}


//显示提示信息方法
function showToast(text,pageToast){
	if(pageToast.is(":visible")){
		pageToast.children("span").hide();
		pageToast.hide();
	}
	pageToast.children("span").html(text);
	pageToast.show();
	pageToast.children("span").show(200);
	setTimeout(function () {
		pageToast.children("span").hide(200,function(){
			pageToast.hide();
		});
	}, 3000);
}


//设置天气点击方法
function ho_SetWeatherClick(){
	$("#ho-h-w").click(function(e) {
		$("#ho-w-tips").css("left","0");
		$("#ho-w-round5").css("left","0");
		ho_weather_tipnum =1;
        $("#ho-weather").show();
    });
	$("#ho-weather").click(function(e) {
        $("#ho-weather").hide();
    });
	$("#ho-w-refresh").click(function(e) {
		ho_SetWeatherByGeolocation();
        return false;
    });
	$("#ho-weather").live("swipeleft",function(event){
		if(ho_weather_tipnum<4){
			ho_weather_tipnum++;
			$("#ho-w-tips").css("left","-=280px");
			$("#ho-w-round5").animate({left:"+=30px"},300);
		}
	});
	$("#ho-weather").live("swiperight",function(event){
		if(ho_weather_tipnum>1){
			ho_weather_tipnum--;
			$("#ho-w-tips").css("left","+=280px");
			$("#ho-w-round5").animate({left:"-=30px"},300);
		}
	});
}

//转换日期
function transitionDate(timeString){
	var date = new Date(Date.parse(timeString.replace(/-/g,"/")));
	var year = date.getFullYear();
	var month = checkTensDigit(date.getMonth() + 1);
	var day = checkTensDigit(date.getDate());
	var hours = checkTensDigit(date.getHours());
	var minutes = checkTensDigit(date.getMinutes());
	var seconds = checkTensDigit(date.getSeconds());
	return Date.parse(timeString).toString('yyyy-MM-dd HH:mm:ss');
}


//个位数值类型转十位字符类型
function checkTensDigit(i){
	if(i<10){
		return "0"+i;
	}
	return String(i);
}


//获取uid
function getUid(){
	var uuid = new String(uuid_num++);
	while(uuid>10000){
		var uuid = new String(uuid_num++);
	}
	if(uuid == 10000){
		uuid_num = 0;
		var uuid = new String(uuid_num++);
	}
	while(uuid.length < 4){
		uuid = "0" + uuid;
	}
	var d=new Date();
	var time =  new String(d.getTime());
	uuid = time.concat(uuid);
	return uuid;
}


//识别天气文字，转换成可用英文
function getWeatherEN(name){
	var weatherCNtoEN = {
		晴:"qing",
		多云:"duoyun",
		阴:"yin",
		阵雨:"zhenyu",
		雷阵雨:"leizhenyu",
		雨夹雪:"yujiaxue",
		小雨:"xiaoyu",
		中雨:"zhongyu",
		大雨:"dayu",
		暴雨:"baoyu",
		大暴雨:"dabaoyu",
		特大暴雨:"tedabaoyu",
		阵雪:"zhenxue",
		小雪:"xiaoxue",
		中雪:"zhongxue",
		大雪:"daxue",
		暴雪:"baoxue",
		雾:"wu",
		冻雨:"dongyu",
		沙尘暴:"shachenbao",
		浮尘:"fuchen",
	}
	if(weatherCNtoEN[name] != null){
		return weatherCNtoEN[name];
	}
	if(name.indexOf("雷") != -1 && name.indexOf("冰") != -1){
		return "leizhenyubingbao";
	}
	if(name.indexOf("雨") != -1 && name.indexOf("冰") != -1){
		return "yujiaxue";
	}
	if(name.indexOf("雨") != -1 && name.indexOf("雪") != -1){
		return "yujiaxue";
	}
	if(name.indexOf("暴雪") != -1){
		return "baoxue";
	}
	if(name.indexOf("大雪") != -1){
		return "daxue";
	}
	if(name.indexOf("中雪") != -1){
		return "zhongxue";
	}
	if(name.indexOf("小雪") != -1){
		return "xiaoxue";
	}
	if(name.indexOf("暴雨") != -1){
		return "baoyu";
	}
	if(name.indexOf("大雨") != -1){
		return "dayu";
	}
	if(name.indexOf("中雨") != -1){
		return "zhongyu";
	}
	if(name.indexOf("小雨") != -1){
		return "xiaoyu";
	}
	if(name.indexOf("阴霾") != -1){
		return "fuchen";
	}
	if(name.indexOf("冰") != -1){
		return "yujiaxue";
	}
	if(name.indexOf("雪") != -1){
		return "xiaoxue";
	}
	if(name.indexOf("雨") != -1){
		return "xiaoyu";
	}
	if(name.indexOf("沙") != -1){
		return "shachenbao";
	}
	if(name.indexOf("尘") != -1){
		return "shachenbao";
	}
	if(name.indexOf("雾") != -1){
		return "wu";
	}
	if(name.indexOf("阴") != -1){
		return "yin";
	}
	if(name.indexOf("云") != -1){
		return "duoyun";
	}
	return "qing";
}


//离线缓存储存方法
function items_down(itemsArray){
	var downWirteContent = function(oneItem,dir){
		var fileurl = oneItem.url;
		var fileuid = oneItem.uid;
		//按照数组uid创建创建或获取文件
		dir.getFile(fileuid + ".cache", {create: true, exclusive: false}, function(itemfile){
			//创建文件成功后，读取文件长度，若不等于0则跳过网络读取
			itemfile.file(function(fileInfo){
				if(fileInfo.size == 0){
					//文件大小为0，创建文件写入对象
					itemfile.createWriter(function(writeObject){
						contentExtraction(fileurl,function(contentText){
							writeObject.write(contentText);
						},function(){
							
						});
					}, function(){
						
					});
				}
			}, function(){
			});
		}, function(){
			
		});
	}
	//获取系统根目录，SD卡在的情况，先获取SD卡，SD卡不在的情况获取手机
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
		//查找目录，如果没有则创建目录
		fileSystem.root.getDirectory("littlebear_cache", {create: true, exclusive: false}, function(dir){
			//遍历数组
			for(x in itemsArray){
				downWirteContent(itemsArray[x],dir);
			}
		}, function(){
			
		});
	}, function(){
		
	});
}


//正文提取方法
function contentExtraction(contenturl,successFunction, failFunction){
	$.ajax({
		url:contenturl,
		type:"GET",
		dataType:"html",
		timeout:60000,
		cache:false,
		error: function(word){
			failFunction();
		},
		success: function(word){
			word = word.replace(/<!DOCTYPE.*?>/gi,"");
			word = word.replace(/<!--.*?-->/gi,"");
			word = word.replace(/<meta.*?>/gi,"");
			word = word.replace(/<link.*?>/gi,"");
			word = word.replace(/<base.*?>/gi,"");
			word = word.replace(/[\r]/g,"");	 //替换换行 
			word = word.replace(/[\n]/g,"");	 //替换回车
			word = word.replace(/<input.*?>/gi,"");
			word = word.replace(/<head[^>]*>(.|\n)*?<\/head>/ig,"");
			word = word.replace(/<script[^>]*>(.|\n)*?<\/script>/ig,"");
			word = word.replace(/<style[^>]*>(.|\n)*?<\/style>/ig,"");
			word = word.replace(/<object[^>]*>(.|\n)*?<\/object>/ig,"");
			word = word.replace(/<li[^>]*>(.|\n)*?<\/li>/ig,"");
			word = word.replace(/<select[^>]*>(.|\n)*?<\/select>/ig,"");
			word = word.replace(/<iframe[^>]*>(.|\n)*?<\/iframe>/ig,"");
			word = word.replace(/<a\s+.*?>/gi,"");
			word = word.replace(/<\/a>/gi,"");
			
			word = word.replace(/<div[\s]class="rightbar-wrapper[^>]*>(.|\n)*?<\/div>/ig,"");

			
			var $mm = $(word);
			var maxText = 0;
			var maxTextDiv;
			$mm.find("div").each(function(index, element) {
				if($(this).text().replace(/\s+/g,'').replace(/\d/g,'').length > maxText){
					maxTextDiv = $(this);
					maxText = $(this).text().replace(/\s+/g,'').replace(/\d/g,'').length;
				}
			});
			$mm.each(function(index, element) {
				if($(this).text().replace(/\s+/g,'').replace(/\d/g,'').length > maxText){
					maxTextDiv = $(this);
					maxText = $(this).text().replace(/\s+/g,'').replace(/\d/g,'').length;
				}
			});
			var last = true;
			while(last){
				if( maxTextDiv.children("div").length != 0){
					var max_Text = 0;
					var max_TextDiv;
					var length_count = 0;
					maxTextDiv.children("div").each(function(index, element) {
						if($(this).text().replace(/\s+/g,'').replace(/\d/g,'').length > max_Text){
							max_TextDiv = $(this);
							max_Text = $(this).text().replace(/\s+/g,'').replace(/\d/g,'').length;
							length_count = length_count + $(this).text().replace(/\s+/g,'').replace(/\d/g,'').length;
						}
					});
					if(maxTextDiv.text().replace(/\s+/g,'').replace(/\d/g,'').length - length_count > length_count){
						last = false;
					}else{
						maxTextDiv = max_TextDiv;
					}
				}else{
					last = false;
				}
			}
			successFunction(maxTextDiv.html());
		}
	});
}


function removeCache(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
		//查找目录，如果没有则创建目录
		fileSystem.root.getDirectory("littlebear_cache", {create: true, exclusive: false}, function(dir){
			var directoryReader = dir.createReader();
			directoryReader.readEntries(function(entries){
				var i;
				var d=new Date();
				var time = d.getTime();
				for(i=0;i< entries.length;i++) {
					if(entries[i].isFile){
						var filename = entries[i].name;
						var filetime = filename.substr(0,filename.length-10);
						if((time - filetime)>172800000){
							entries[i].remove(function(){}, function(){});
						}
					}
				}
			},function(){});
		}, function(){
			
		});
	}, function(){
		
	});
	setTimeout("removeCache()", 3600000);
}


function errorCB(err) {
	console.log("Error processing SQL: "+err.code);
}