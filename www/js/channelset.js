$("#channelset").live("pagecreate",function(event){
	ch_setScroll();
	ch_setBackButton();
	ch_SetAddClick();
	ch_SetToolClick();
	ch_SetLiClick();
	$(window).bind("resize",function(e){
		ch_Scroll.refresh();
	});
});

$("#channelset").live("pageshow",function(event){
	document.addEventListener("backbutton", ch_SetPhoneBack, false);
	$("#ch-cover").show();
	ch_SetAllList();
});

$("#channelset").live('pagebeforehide',function(event, ui){
	document.removeEventListener("backbutton", ch_SetPhoneBack, false);
});


var ch_Scroll,ch_toolitem,ch_dbIsRun=false;


function ch_setScroll(){
	ch_Scroll = new iScroll('ch-list',{
		hideScrollbar:true,
		bounce:false,
	});
}

function ch_SetPhoneBack(){
	if($("#ch-dialog").is(":visible")){
		$("#ch-dialog").hide();
		return;
	}
	if($("#ch-tool").is(":visible")){
		$(".ch-w-libg").css("background","none");
        $("#ch-tool").hide();
		return;
	}else{
		navigator.app.exitApp();
	}
}


function ch_setBackButton(){
	$("#ch-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

function ch_SetAllList(){
	var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
	db.transaction(function(tx){
		tx.executeSql("SELECT uid,rank,ishome,name,remark,url FROM Channel ORDER BY rank ASC", [], function(tx, results){
				var ch_top_channellist = $("#ch-w-sl");
				var ch_down_channellist = $("#ch-w-sml");
				ch_top_channellist.empty();
				ch_down_channellist.empty();
				var len = results.rows.length;
				if(len != 0){
					for (var i=0; i<len; i++){
						var $channel_li = $("<li chanell-url='"+results.rows.item(i).url+"' chanell-uid='"+results.rows.item(i).uid+"'><div class='ch-w-libg'><span class='ch-w-oscn'>" + results.rows.item(i).name + "</span><span class='ch-w-oscr'>" + results.rows.item(i).remark + "</span></div></li>");
						if(results.rows.item(i).ishome == "true"){
							ch_top_channellist.append($channel_li);
						}else{
							ch_down_channellist.append($channel_li);
						}
					}
				}
				ch_Scroll.refresh();
				ch_Scroll.scrollTo(0, 0, 0);
				$("#ch-cover").hide();
		}, function(){
			
		});
	}, errorCB);
}


function ch_SetAddClick(){
	$("#ch-h-add button").click(function(e) {
        $("#ch-d-addurl input").val("");
		$("#ch-d-addurl input").removeAttr("disabled");
		$("#ch-d-addname").hide();
		$("#ch-d-addremark").hide();
		$("#ch-d-addremark input").val("");
		$("#ch-d-addname input").val("");
		$("#ch-d-tdconfirm").attr("add-type","check");
		$("#ch-d-tdconfirm").html("检查");
		$("#ch-dialog").show();
		return false;
    });
	
	$("#ch-d-tdconfirm").click(function(e) {
        if($(this).attr("add-type") == "check"){
			if($("#ch-d-addurl input").val() == "" || $("#ch-d-addurl input").val() == "请输入名称"){
				showToast("亲，url地址不能为空哦！",$("#ch-toast"));
				return false;
			}
			$("#ch-d-addurl input").attr("disabled","true");
			$("#ch-d-tdconfirm").attr("add-type","checking");
			$("#ch-d-tdconfirm").html("检查中");
			ch_CheckRSS($("#ch-d-addurl input").val());
		}else if($(this).attr("add-type") == "add"){
			var nameInput = $("#ch-d-addname input").val();
			if(nameInput == "" || nameInput == "请输入名称"){
				showToast("亲，名称不能为空哦！",$("#ch-toast"));
				return false;
			}
			var remarkInput = $("#ch-d-addremark input").val();
			var urlInput = $("#ch-d-addurl input").val();
			$("#ch-dialog").hide();
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("SELECT uid,url FROM Channel WHERE url = '"+ urlInput +"'", [], function(tx, results){
					var len = results.rows.length;
					if(len == 0){
						tx.executeSql("SELECT rank FROM Channel ORDER BY rank DESC LIMIT 0 , 1", [], function(tx, results){
							var rank = new Number(results.rows.item(0).rank) + 1;
							var new_uid = getUid();
							tx.executeSql("INSERT INTO Channel (uid, rank, ishome, name, remark, url) VALUES ('"+new_uid+"', '"+ rank +"', 'false', '"+ nameInput +"', '"+ remarkInput +"','"+ urlInput +"')",[],function(){
								showToast("添加新RSS源成功",$("#ch-toast"));
								$("#ch-w-sml").append($("<li chanell-url='"+urlInput+"' chanell-uid='"+new_uid+"'><div class='ch-w-libg'><span class='ch-w-oscn'>" + nameInput + "</span><span class='ch-w-oscr'>" + remarkInput + "</span></div></li>"));
								ch_Scroll.refresh();
								window.sessionStorage.setItem('RefreshChannel',"true");
							},errorCB);
						}, errorCB);
					}else{
						showToast("添加失败，RSS地址已存在。",$("#ch-toast"));
					}
				}, errorCB);
			}, errorCB,function(){
				
			});
		}
    });
	
	$("#ch-d-tdcancel").click(function(e) {
		$("#ch-dialog").hide();
	});
}

function ch_CheckRSS(rss_url){
	var new_rss_url;
	if(rss_url.substr(0,7).toLowerCase() != "http://" && rss_url.substr(0,8).toLowerCase() != "https://"){
		new_rss_url = "http://" + rss_url;
	}else{
		new_rss_url = rss_url;
	}
	$.ajax({
		url:new_rss_url,
		type:"GET",
		dataType:"xml",
		timeout:30000,
		cache:false,
		error: function(xml){
			if(rss_url == $("#ch-d-addurl input").val()){
				$("#ch-d-addurl input").removeAttr("disabled");
				$("#ch-d-tdconfirm").attr("add-type","check");
				$("#ch-d-tdconfirm").html("检查");
				showToast("网络错误或网址无效",$("#ch-toast"));
			}
		},
		success: function(xml){
			if($(xml).find("channel").length == 0){
				if(rss_url == $("#ch-d-addurl input").val()){
					$("#ch-d-addurl input").removeAttr("disabled");
					$("#ch-d-tdconfirm").attr("add-type","check");
					$("#ch-d-tdconfirm").html("检查");
					showToast("不是有效的RSS地址",$("#ch-toast"));
					return false;
				}
			}else{
				if(rss_url == $("#ch-d-addurl input").val()){
					$("#ch-d-addurl input").val(new_rss_url);
					$("#ch-d-addremark input").val($(xml).find("channel").children("title").text());
					$("#ch-d-addname").show();
					$("#ch-d-addremark").show();
					$("#ch-d-tdconfirm").attr("add-type","add");
					$("#ch-d-tdconfirm").html("添加");
				}
			}
			
		},
	});
}


function ch_SetToolClick(){
	$("#ch-t-imgtop").click(function(e) {
		if(ch_dbIsRun == true)return false;
        if(ch_toolitem.parent().attr("id") == "ch-w-sl"){
			showToast("已经是主菜单的频道了！",$("#ch-toast"));
		}else{
			ch_dbIsRun = true;
			var me_uid = ch_toolitem.attr("chanell-uid");
			var you_uid = $("#ch-w-sl li:last").attr("chanell-uid");
			if(me_uid == null || you_uid==null){ch_dbIsRun = false;return false;}
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("UPDATE Channel SET rank = rank + 1 WHERE rank > (SELECT rank FROM Channel WHERE uid = '" + you_uid + "') AND rank < (SELECT rank FROM Channel WHERE uid = '" + me_uid + "')");
				tx.executeSql("UPDATE Channel SET ishome = 'true', rank = (SELECT rank FROM Channel WHERE uid = '" + you_uid + "') + 1 WHERE rank = (SELECT rank FROM Channel WHERE uid = '" + me_uid + "')");
			}, errorCB,function(){
				var del = ch_toolitem.remove();
				$("#ch-w-sl").append(del);
				window.sessionStorage.setItem('RefreshChannel',"true");
				ch_dbIsRun = false;
			});
			
		}
		return false;
    });
	
	$("#ch-t-imgup").click(function(e) {
		if(ch_dbIsRun == true)return false;
        if(ch_toolitem.prev().length == 0){
			showToast("已经是本栏的最顶端！",$("#ch-toast"));
		}else{
			ch_dbIsRun = true;
			var me_uid = ch_toolitem.attr("chanell-uid");
			var you_uid = ch_toolitem.prev().attr("chanell-uid");
			if(me_uid == null || you_uid==null){ch_dbIsRun = false;return false;}
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("UPDATE Channel SET rank = rank + 1 WHERE uid = '" + you_uid + "'");
				tx.executeSql("UPDATE Channel SET rank = rank - 1 WHERE uid = '" + me_uid + "'");
			}, errorCB,function(){
				var add = ch_toolitem.prev();
				var del = ch_toolitem.remove();
				add.before(del);
				window.sessionStorage.setItem('RefreshChannel',"true");
				ch_dbIsRun = false;
			});
		}
		return false;
    });
	
	$("#ch-t-imgdel").click(function(e) {
		if(ch_dbIsRun == true)return false;
        if(ch_toolitem.parent().children().length == 1 && ch_toolitem.parent().attr("id") == "ch-w-sl"){
			showToast("至少保留一个主频道！",$("#ch-toast"));
		}else{
			ch_dbIsRun = true;
			var me_uid = ch_toolitem.attr("chanell-uid");
			var me_url = ch_toolitem.attr("chanell-url");
			if(me_uid == null || me_url==null){ch_dbIsRun = false;return false;}
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("UPDATE Channel SET rank = rank - 1 WHERE rank > (SELECT rank FROM Channel WHERE uid = '" + me_uid + "')");
				tx.executeSql("DELETE FROM Channel WHERE uid='"+ me_uid +"'");
				tx.executeSql("DELETE FROM Items WHERE channel_url = '"+ me_url +"'");
			}, errorCB,function(){
				var del = ch_toolitem.remove();
				$("#ch-tool").hide();
				ch_Scroll.refresh();
				window.sessionStorage.setItem('RefreshChannel',"true");
				ch_dbIsRun = false;
			});
		}
		return false;
    });
	
	$("#ch-t-imgdown").click(function(e) {
		if(ch_dbIsRun == true)return false;
        if(ch_toolitem.next().length == 0){
			showToast("已经是本栏的最底端！",$("#ch-toast"));
		}else{
			ch_dbIsRun = true;
			var me_uid = ch_toolitem.attr("chanell-uid");
			var you_uid = ch_toolitem.next().attr("chanell-uid");
			if(me_uid == null || you_uid==null){ch_dbIsRun = false;return false;}
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("UPDATE Channel SET rank = rank + 1 WHERE uid = '" + me_uid + "'");
				tx.executeSql("UPDATE Channel SET rank = rank - 1 WHERE uid = '" + you_uid + "'");
			}, errorCB,function(){
				var add = ch_toolitem.next();
				var del = ch_toolitem.remove();
				add.after(del);
				window.sessionStorage.setItem('RefreshChannel',"true");
				ch_dbIsRun = false;
			});
		}
		return false;
    });
	
	$("#ch-t-imgbottom").click(function(e) {
		if(ch_dbIsRun == true)return false;
        if(ch_toolitem.parent().attr("id") == "ch-w-sml"){
			showToast("已经是其他菜单的频道了！",$("#ch-toast"));
		}else if(ch_toolitem.parent().children().length == 1 && ch_toolitem.parent().attr("id") == "ch-w-sl"){
			showToast("至少保留一个主频道！",$("#ch-toast"));
		}else{
			ch_dbIsRun = true;
			var me_uid = ch_toolitem.attr("chanell-uid");
			var you_uid = $("#ch-w-sl li:last").attr("chanell-uid");
			if(me_uid == null || you_uid==null){ch_dbIsRun = false;return false;}
			var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
			db.transaction(function(tx){
				tx.executeSql("UPDATE Channel SET rank = rank - 1 WHERE rank > (SELECT rank FROM Channel WHERE uid = '" + me_uid + "') AND rank <= (SELECT rank FROM Channel WHERE uid = '" + you_uid + "')");
				tx.executeSql("UPDATE Channel SET ishome = 'false', rank = (SELECT rank FROM Channel WHERE uid = '" + you_uid + "') WHERE rank = (SELECT rank FROM Channel WHERE uid = '" + me_uid + "')");
			}, errorCB,function(){
				var del = ch_toolitem.remove();
				$("#ch-w-sml").prepend(del);
				window.sessionStorage.setItem('RefreshChannel',"true");
				ch_dbIsRun = false;
			});
		}
		return false;
    });
	
	$("#ch-tool").click(function(e) {
		ch_toolitem.children(".ch-w-libg").css("background","none");
        $("#ch-tool").hide();
    });
}

function ch_SetLiClick(){
	$("#ch-w-sl li").live("taphold",function(){
		ch_toolitem = $(this);
		$(this).children(".ch-w-libg").css("background","#F90");
		$("#ch-tool").show();
	});
	
	$("#ch-w-sml li").live("taphold",function(){
		$(this).children(".ch-w-libg").css("background","#F90");
		ch_toolitem = $(this);
		$("#ch-tool").show();
	});
}