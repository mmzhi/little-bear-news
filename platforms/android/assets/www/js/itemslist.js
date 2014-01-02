$("#itemslist").live("pagecreate",function(event){
	it_setBackButton();
	it_setScroll();
	it_SetHistroyItems();
	$(window).bind("resize",function(e){
		it_iScroll.refresh();
	});
});

$("#itemslist").live("pageshow",function(event){
	it_iScroll.refresh();
	if(window.sessionStorage.getItem('RefreshItemsList') == "true"){
		window.sessionStorage.setItem('RefreshItemsList',"false");
		it_ChannelUrl = window.sessionStorage.getItem('ItemsListUrl');
		it_setItemsInDB(it_ChannelUrl,it_SetItemsByDB);
		$("#it-cover").show();
	}	
});

$("#itemslist").live('pagebeforehide',function(event, ui){
	
});


var it_iScroll,it_ChannelUrl;
var it_timeRefresh;

function it_setScroll(){
	it_iScroll = new iScroll('it-items', {
		hideScrollbar: true,
		useTransition: true,
		topOffset: $("#it-i-sp").height()+10,
		onRefresh: function () {
			if ($("#it-i-sp").hasClass("loading")) {
				$("#it-i-sp").attr("class","");
				$("#it-i-sp").children(".it-i-spl").html("下拉可以刷新");
			}
		},
		onScrollMove: function () {
			if (this.y > 5 && !$("#it-i-sp").hasClass("flip") && !$("#it-i-sp").hasClass("loading")) {
				$("#it-i-sp").attr("class","flip");
				$("#it-i-sp").children(".it-i-spl").html("松开可以刷新");
				this.minScrollY = 0;
			} else if (this.y < 5 && $("#it-i-sp").hasClass("flip") && !$("#it-i-sp").hasClass("loading")) {
				$("#it-i-sp").attr("class","");
				$("#it-i-sp").children(".it-i-spl").html("下拉可以刷新");
				this.minScrollY = -($("#it-i-sp").height()+10);
			}
		},
		onScrollEnd: function () {
			if ($("#it-i-sp").hasClass("flip")) {
				$("#it-i-sp").attr("class","loading");
				$("#it-i-sp").children(".it-i-spl").html("加载中");
				it_SetItemsByWEB(it_ChannelUrl);
			}
		}
	});
}




function it_setBackButton(){
	$("#it-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

//从数据库后获取数据更新列表，完成后读取网络
function it_SetItemsByDB(tx, results,url){
	it_HistroyRefresh();
	var list = $("#it-i-sl");
	list.empty();
	var len = results.rows.length;
	if(len != 0){
		for (var i=0; i<len; i++){
			var $li = $("<li item-uid='"+results.rows.item(i).uid+"'><div class='it-i-stat'><div class='it-i-stl'>" + results.rows.item(i).title + "</div><div class='it-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>");
			list.append($li);
		}
		$("#it-cover").hide();
		it_iScroll.refresh();
		it_iScroll.scrollTo(0, 0, 0, false);
		it_iScroll.refresh();
		it_SetItemsClick();
	}
	it_SetItemsByWEB(url);
}

//从网络读取数据，写入数据库
function it_SetItemsByWEB(url){
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
				it_UpdateItemsFirst(url);
			});
		},error: function(){
			it_iScroll.refresh();
			showToast("读取网络数据失败",$("#it-toast"));
		}
	});
}

//从数据库获取最新的列表并更新
function it_UpdateItemsFirst(url){
	if($("#it-i-sl li").length == 0){
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#it-i-sl");
				var len = results.rows.length;
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='it-i-stat'><div class='it-i-stl'>" + results.rows.item(i).title + "</div><div class='it-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
					}
					if(url == it_ChannelUrl){
						list.empty();
						list.append($(lis));
						$("#it-cover").hide();
						it_iScroll.refresh();
						it_iScroll.scrollTo(0, 0, 0, false);
						it_iScroll.refresh();
						it_SetItemsClick();
						it_SetRefreshOfTime();
					}
				}else{
					it_iScroll.refresh();
					it_SetRefreshOfTime();
				}
			}, errorCB);
		}, errorCB);
	}else{
		var item_uid = $("#it-i-sl li:first").attr("item-uid");
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' AND pubDate > (SELECT pubDate FROM Items WHERE uid="+item_uid+") ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#it-i-sl");
				var len = results.rows.length;
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='it-i-stat'><div class='it-i-stl'>" + results.rows.item(i).title + "</div><div class='it-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
					}
					if(url == it_ChannelUrl){
						list.prepend($(lis));
						$("#it-cover").hide();
						it_iScroll.refresh();
						it_iScroll.scrollTo(0, 0, 0, false);
						it_iScroll.refresh();
						it_SetItemsClick();
						it_SetRefreshOfTime();
					}
				}else{
					it_iScroll.refresh();
					it_SetRefreshOfTime();
				}
			}, errorCB);
		}, errorCB);
	}
	
}

//从数据库获取items列表
function it_setItemsInDB(url,handler){
	var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
	db.transaction(function(tx){
		tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
			handler(tx, results, url);
		}, errorCB);
	}, errorCB);
}

//设置items栏点击事件
function it_SetItemsClick(){
	$(".it-i-stat").unbind().click(function(e) {
		var uid = $(this).parent().attr("item-uid");
		window.sessionStorage.setItem('refreContent',"true");
		window.sessionStorage.setItem('ContentUid',uid);
		$.mobile.changePage("#content", "none");
	});
}

function it_SetHistroyItems(){
	$("#it-i-sm").click(function(e) {
        if($(this).attr("click-type") == "false")return;
		if($("#it-i-sl li").length == 0)return;
		$("#it-i-sm").text("加载中……");
		$("#it-i-sm").attr("click-type","false");
		var last_uid = $("#it-i-sl li:last").attr("item-uid");
		var url = it_ChannelUrl;
		var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
		db.transaction(function(tx){
			tx.executeSql("SELECT uid,title,pubDate,item_url FROM Items WHERE channel_url = '"+ url +"' AND pubDate < (SELECT pubDate FROM Items WHERE uid="+last_uid+") ORDER BY pubDate DESC LIMIT 0 , 20", [], function(tx, results){
				var list = $("#it-i-sl");
				var len = results.rows.length;
				if(len != 0){
					var lis;
					for (var i=0; i<len; i++){
						lis = lis + "<li item-uid='"+results.rows.item(i).uid+"'><div class='it-i-stat'><div class='it-i-stl'>" + results.rows.item(i).title + "</div><div class='it-i-sti'>"+ results.rows.item(i).pubDate +"</div></div></li>";
					}
					if(url == it_ChannelUrl && $("#it-i-sm").attr("click-type") == "false"){
						list.append($(lis));
						it_iScroll.refresh();
						it_SetItemsClick();
						it_HistroyRefresh();
					}
				}else{
					showToast("没有更久的条目了",$("#it-toast"));
					it_HistroyRefresh();
				}
			}, errorCB);
		}, errorCB);
    });
}

function it_HistroyRefresh(){
	$("#it-i-sm").text("点击查看后面的条目");
	$("#it-i-sm").attr("click-type","true");
}


function it_SetRefreshOfTime(){
	clearTimeout(it_timeRefresh);
	it_timeRefresh = setTimeout(function(){
		if($("#itemslist").is(":visible")){
			it_SetItemsByWEB(it_ChannelUrl);
		}
	},window.localStorage.getItem("RefreshTime")*60*1000)
}