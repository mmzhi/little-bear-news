$("#content").live("pagecreate",function(event){
	co_setScroll();
	co_setBackButton();
	co_setClick();
	co_SetMainClick();
	$(window).bind("resize",function(e){
		co_Scroll.refresh();
	});
});

$("#content").live("pageshow",function(event){
	document.addEventListener("menubutton", co_SetPhoneMenu, false);
	document.addEventListener("backbutton", co_SetPhoneBack, false);
	co_Scroll.refresh();
	if(window.sessionStorage.getItem('refreContent') == "true"){
		window.sessionStorage.setItem('refreContent',"false");
		window.setTimeout(co_SetItemInfo(window.sessionStorage.getItem('ContentUid')),0);
	}
});

$("#content").live('pagebeforehide',function(event, ui){
	document.removeEventListener("menubutton", co_SetPhoneMenu, false);
	document.removeEventListener("backbutton", co_SetPhoneBack, false);
});

var co_uid,co_url,co_title,co_mode="full";
var co_Scroll;

function co_setScroll(){
	co_Scroll = new iScroll('co-content',{
		hideScrollbar:true,
		bounce:false,
	});
}

function co_SetPhoneMenu(){
	if($("#co-main").is(":visible")){
		$("#co-main").hide();
		return;
	}else{
		$("#co-main").show();
	}
}

function co_SetPhoneBack(){
	if($("#co-main").is(":visible")){
		$("#co-main").hide();
		return;
	}else{
		history.back();
		return false;
	}
}


function co_setBackButton(){
	$("#co-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

function co_SetItemInfo(uid){
	console.log("Test UID"+uid);
	co_showCover();
	$("#co-co-title").text("");
	$("#co-co-date").text("");
	$("#co-co-description").text("");
	$("#co-co-full").html("");
	var db = window.openDatabase("Database", "1.0", "LittleBear", 4*1024*1024);
	db.transaction(function(tx){
		tx.executeSql("SELECT uid,title,pubDate,item_url,description FROM Items WHERE uid = '"+ uid +"'", [], function(tx, results){
			var len = results.rows.length;
			if(len != 0){
				$("#co-co-title").text(results.rows.item(0).title);
				$("#co-co-date").text(results.rows.item(0).pubDate);
				$("#co-co-description").text(results.rows.item(0).description);
				co_uid = results.rows.item(0).uid;
				co_url = results.rows.item(0).item_url;
				co_title = results.rows.item(0).title;
				if(window.localStorage.getItem("ShowFull") == "false"){
					co_ShowDescription();
				}else{
					item_read(co_uid,co_url,co_setFullText,co_getFullInWeb);
				}
			}
		}, errorCB);
	}, errorCB);
}

function co_ShowDescription(){
	co_mode="description";
	$("#co-h-changemode button").text("源网页");
	$("#co-co-full").hide();
	$("#co-co-middle").show();
	$("#co-co-description").show();
	$("#co-cover").hide();
	co_Scroll.refresh();
	co_Scroll.scrollTo(0, 0, 0, false);
}

function co_ShowFull(){
	co_mode="full";
	$("#co-h-changemode button").text("摘要");
	$("#co-co-description").hide();
	$("#co-co-middle").show();
	$("#co-co-full").show();
	$("#co-cover").hide();
	co_Scroll.refresh();
	co_Scroll.scrollTo(0, 0, 0, false);
}

function co_showCover(){
	$("#co-co-description").hide();
	$("#co-co-full").hide();
	$("#co-co-middle").hide();
	$("#co-cover").show();
}

function co_setClick(){
	$("#co-h-changemode button").click(function(e) {
        if(co_mode=="full"){
			co_ShowDescription();
		}else{
			if($("#co-co-full").html() == ""){
				co_showCover();
				item_read(co_uid,co_url,co_setFullText,co_getFullInWeb);
			}else{
				co_ShowFull();
			}
		}
    });
}

function co_setFullText(itemurl,conText){
	if(itemurl == co_url){
		if(window.localStorage.getItem("ShowImages") == "false")conText = conText.replace(/<img.*?>/gi,"");
		$("#co-co-full").html(conText);
		$("#co-co-full").find("*").removeAttr("style");
		$("#co-co-full").find("*").removeAttr("width");
		$("#co-co-full").find("img").css("max-width","260px");
		co_ShowFull();
	}
}


function item_read(itemuid,itemurl,setFunction,failFunction){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
		//查找目录，如果没有则创建目录
		fileSystem.root.getDirectory("littlebear_cache", {create: true, exclusive: false}, function(dir){
			dir.getFile(itemuid + ".cache", {create: false}, function(itemfile){
				itemfile.file(function(fileInfo){
					var reader = new FileReader();
					reader.onloadend = function(evt) {
						setFunction(itemurl,evt.target.result); 
					}; 
					reader.readAsText(fileInfo);
				}, function(){
					failFunction(itemuid,itemurl,setFunction,function(){});
				});
			},function(){
				failFunction(itemuid,itemurl,setFunction,function(){});
			});
		}, function(){
			failFunction(itemuid,itemurl,setFunction,function(){});
		});
	}, function(){
		failFunction(itemuid,itemurl,setFunction,function(){});
	});
}


function co_getFullInWeb(itemuid,itemurl,successFunction, failFunction){
	console.log("Hello");
	console.log(itemurl);
	contentExtraction(itemurl,function(successText){
		console.log("Hello World");
		item_save(itemuid,successText);
		successFunction(itemurl,successText);
	}, failFunction);
}


function item_save(itemuid,contentText){
	//获取系统根目录，SD卡在的情况，先获取SD卡，SD卡不在的情况获取手机
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
		//查找目录，如果没有则创建目录
		fileSystem.root.getDirectory("littlebear_cache", {create: true, exclusive: false}, function(dir){
			dir.getFile(itemuid + ".cache", {create: true, exclusive: false}, function(itemfile){
				//创建文件成功后，读取文件长度，若不等于0则跳过网络读取
				itemfile.file(function(fileInfo){
					if(fileInfo.size == 0){
						//文件大小为0，创建文件写入对象
						itemfile.createWriter(function(writeObject){
							writeObject.write(contentText);
						}, function(){
							
						});
					}
				}, function(){
				});
			}, function(){
				
			});
		}, function(){
			
		});
	}, function(){
		
	});
}



function co_SetMainClick(){
	$("#co-h-tile").unbind().click(function(){
		$("#co-main").show();
	});
	$("#co-main").unbind().click(function(){
		$("#co-main").hide();
	});
	
	$("#co-m-share").click(function(e) {
		window.sessionStorage.setItem('comment-title',co_title);
		window.sessionStorage.setItem('comment-url',co_url);
        $.mobile.changePage("#share", "none");
    });
}