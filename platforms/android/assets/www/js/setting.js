$("#setting").live("pagecreate",function(event){
	se_setScroll();
	se_setClick();
	se_setBackButton();
	$(window).bind("resize",function(e){
		se_oScroll.refresh();
		se_lbScroll.refresh();
	});
});

$("#setting").live("pageshow",function(event){
	
	se_setAllValue();
	setTimeout(function(){
		$("#se-option").css("left",0);
		se_oScroll.refresh();
	},500);
	document.addEventListener("backbutton", se_SetPhoneBack, false);
});

$("#setting").live('pagebeforehide',function(event, ui){
	document.removeEventListener("backbutton", se_SetPhoneBack, false);
});

var se_oScroll,se_lbScroll;		//定义两个滚动iScroll变量


function se_SetPhoneBack(){
	if($("#se-dialog").is(":visible")){
		$("#se-dialog").hide();
		$("#se-d-textdialog").hide();
		$("#se-d-listdialog").hide();
		return;
	}else{
		history.back();
		return false;
	}
}

function se_setScroll(){
	se_oScroll = new iScroll('se-option',{
		hideScrollbar:true,
		bounce:false,
	});
	se_lbScroll = new iScroll('se-d-lds',{
		bounce:false,
		hideScrollbar:true
	});
}

function se_setBackButton(){
	$("#se-h-bb").click(function(e) {
        history.back();
		return false;
    });
}

function se_setAllValue(){
	var allitems = window.localStorage.getItem("AllItemsOfTheCeiling");
	var oneitems = window.localStorage.getItem("OneItemsOfTheCeiling");
	var refreshTime = window.localStorage.getItem("RefreshTime");
	var offline = window.localStorage.getItem("OfflineBrowsing");
	var showImages = window.localStorage.getItem("ShowImages");
	var ShowFull = window.localStorage.getItem("ShowFull");
	var city = window.localStorage.getItem("city");
	if(allitems == null){
		allitems = "500";
	}
	$("#se-o-allitems .se-o-rt").text(allitems);
	$("#se-o-allitems").attr("item-value",allitems);
	
	if(oneitems == null){
		oneitems = "50";
	}
	$("#se-o-oneitems .se-o-rt").text(oneitems);
	$("#se-o-oneitems").attr("item-value",oneitems);
	
	if(refreshTime == null){
		refreshTime = "5";
	}
	$("#se-o-refreshtime .se-o-rt").text(refreshTime + "分钟");
	$("#se-o-refreshtime").attr("item-value",refreshTime);
	
	if(offline == null){
		offline = "true";
	}
	$("#se-o-offline .se-o-turefalse").removeClass("se-o-true");
	$("#se-o-offline .se-o-turefalse").removeClass("se-o-false");
	$("#se-o-offline .se-o-turefalse").toggleClass("se-o-" + offline);
	$("#se-o-offline").attr("item-value",offline);
	
	if(showImages == null){
		showImages = "true";
	}
	$("#se-o-showimages .se-o-turefalse").removeClass("se-o-true");
	$("#se-o-showimages .se-o-turefalse").removeClass("se-o-false");
	$("#se-o-showimages .se-o-turefalse").toggleClass("se-o-" + showImages);
	$("#se-o-showimages").attr("item-value",showImages);
	
	if(ShowFull == null){
		ShowFull = "true";
	}
	$("#se-o-showfull .se-o-turefalse").removeClass("se-o-true");
	$("#se-o-showfull .se-o-turefalse").removeClass("se-o-false");
	$("#se-o-showfull .se-o-turefalse").toggleClass("se-o-" + ShowFull);
	$("#se-o-showfull").attr("item-value",ShowFull);
	
	if(city == null){
		city = "";
	}
	$("#se-o-city .se-o-tinput").text(city);
	$("#se-o-city").attr("item-value",city);
	
	
	
}

function se_shouwListDialog(showdate,jqueryItem){
	$("#se-d-listdialog").attr("item-value",showdate.StorageDate);
	$("#se-d-ldtitle").text(showdate.title);
	var li = "";
	for(x in showdate.items){
		li = li + "<li item-date='"+showdate.items[x].date+"' class='se-d-liselected'>"+showdate.items[x].view+"</li>";
	}
	var ldul = $("#se-d-lds ul");
	ldul.empty();
	ldul.append($(li));
	ldul.children("li[item-date="+showdate.defaultitem+"]").toggleClass("se-d-liselected");
	ldul.children("li[item-date="+showdate.defaultitem+"]").toggleClass("se-d-linoselected");
	ldul.children("li").click(function(e) {
		ldul.children("li[item-date="+showdate.defaultitem+"]").toggleClass("se-d-liselected");
		ldul.children("li[item-date="+showdate.defaultitem+"]").toggleClass("se-d-linoselected");
		$(this).toggleClass("se-d-liselected")
		$(this).toggleClass("se-d-linoselected");
		window.localStorage.setItem(showdate.StorageDate, $(this).attr("item-date"));
		jqueryItem.attr("item-value",$(this).attr("item-date"));
		jqueryItem.find(".se-o-rt").text($(this).text());
		$("#se-dialog").hide();
		$("#se-d-listdialog").hide();
    });
	$("#se-dialog").show();
	$("#se-d-listdialog").show();
	se_lbScroll.refresh();
	se_lbScroll.scrollTo(0, 0, 0, false);
}

function se_shouwTextDialog(showdate,jqueryItem){
	$("#se-d-tdtitle").text(showdate.title);
	$("#se-d-tdinput").val(showdate.text);
	$("#se-d-tdhint").text(showdate.hint);
	$("#se-d-tdconfirm").unbind().click(function(e) {
        window.localStorage.setItem(showdate.StorageDate, $("#se-d-tdinput").val());
		jqueryItem.find(".se-o-tinput").text($("#se-d-tdinput").val());
		$("#se-dialog").hide();
		$("#se-d-textdialog").hide();
		return false;
    });
	$("#se-d-tdcancel").unbind().click(function(e) {
		$("#se-dialog").hide();
		$("#se-d-textdialog").hide();
		return false;
    });
	$("#se-dialog").show();
	$("#se-d-textdialog").show();
}

function setTrueOrFalse(storageDate,jqueryItem){
	var newDate;
	if(jqueryItem.attr("item-value") == "true"){
		newDate = "false";
	}else{
		newDate = "true";
	}
	window.localStorage.setItem(storageDate, newDate);
	jqueryItem.attr("item-value",newDate);
	jqueryItem.find(".se-o-turefalse").toggleClass("se-o-true");
	jqueryItem.find(".se-o-turefalse").toggleClass("se-o-false");
}

function se_setClick(){
	$("#se-o-allitems").click(function(e) {
        var date = {
			title:"所有条目上限",
			items:[{view:"300",date:"300"},{view:"500",date:"500"},{view:"1000",date:"1000"},{view:"2000",date:"2000"},{view:"3000",date:"3000"},{view:"4000",date:"4000"},{view:"5000",date:"5000"}],
			defaultitem:$(this).attr("item-value"),
			StorageDate:"AllItemsOfTheCeiling"
		}
		se_shouwListDialog(date,$(this));
    });
	
	$("#se-o-oneitems").click(function(e) {
        var date = {
			title:"单频道条目上限",
			items:[{view:"30",date:"30"},{view:"50",date:"50"},{view:"100",date:"100"},{view:"200",date:"200"},{view:"300",date:"300"}],
			defaultitem:$(this).attr("item-value"),
			StorageDate:"OneItemsOfTheCeiling"
		}
		se_shouwListDialog(date,$(this));
    });
	
	$("#se-o-refreshtime").click(function(e) {
        var date = {
			title:"刷新间隔",
			items:[{view:"1分钟",date:"1"},{view:"3分钟",date:"3"},{view:"5分钟",date:"5"},{view:"10分钟",date:"10"},{view:"30分钟",date:"30"},{view:"60分钟",date:"60"}],
			defaultitem:$(this).attr("item-value"),
			StorageDate:"RefreshTime"
		}
		se_shouwListDialog(date,$(this));
    });
	
	$("#se-o-offline").click(function(e) {
        setTrueOrFalse("OfflineBrowsing",$(this));
    });
	
	$("#se-o-showimages").click(function(e) {
        setTrueOrFalse("ShowImages",$(this));
    });
	
	$("#se-o-showfull").click(function(e) {
        setTrueOrFalse("ShowFull",$(this));
    });
	
	$("#se-o-city").click(function(e) {
        var date = {
			title:"城市设置",
			hint:"输入城市名字，如：北京，广州",
			text:$(this).children(".se-o-tinput").text(),
			defaultitem:$(this).attr("item-value"),
			StorageDate:"city"
		}
		se_shouwTextDialog(date,$(this));
    });
}