var uf_jq_initialize; // jqm initialize 함수
var uf_initialize_data; // data initialize 함수

var uf_regnumber;
var uf_chkregnumber;
var uf_listRefresh;
var uf_saveDBEmpList;
var uf_getEmpList;
var uf_getDeptList;
var uf_getPositionList;
var uf_setCheckboxEvent;
var uf_setPartCheckboxEvent;
var uf_setPartEmpList;
var uf_searchEmp;
var uf_setSearchResult;
var uf_setSearchPartResult;
var uf_setEmpPage;
var uf_showLoading;
var uf_setDeptList;
var uf_setJikwiList;

var gPhoneNum;
var gEmpLists; // 직원 목록
var gCurrentEmp = 0; // detail - 현재 선택된 직원 index

var gEmpPages = 0;  // 직원목록 전체 페이지
var gEmpCurPage = 0;  // 직원목록 현재 페이지
var gEmppartPages = 0;  // 세부 직원목록 전체 페이지
var gEmppartCurPage = 0;  // 세부 직원목록 현재 페이지
var gCntPage = 20; // 한페이지 표시숫자

var gEmpResults;
var gEmpPartResults;

var db;
var tName;
var tTelcomp;
var tTelcell;
var tId;

var gvUrl = "http://kabmobile.mighty-x.com:8080/Mighty/mobile/";
//var gvUrl = "http://www.kab.co.kr/kab/home/mobile/";


// jqm을 시작합니다. - phonegap load 후에 jqm 시작
uf_jq_initialize = function() {
	gvHandno = window.localStorage.getItem("handno");
	gvEmpno =  window.localStorage.getItem("empno");

alert(gvHandno + "/"+ gvEmpno + "/" + gvMac)

	if(gvHandno&&gvEmpno&&gvMac) {
		uf_showLoading("show");
		// 인증여부 체크
			$.ajax({
				type: "POST",
				url : gvUrl+"ChkLogin.jsp",
				data: { handno : gvHandno, empno : gvEmpno, mac : gvMac },
				dataType : "jsonp",
				jsonp : "callback",
				success : function(d){ 
					uf_showLoading("hide");

					if(d.result=="ok") {
						uf_initialize_data();
						$.mobile.changePage("#page_index");
					} else {
						// 등록된 전화번호가 없습니다.
						$.mobile.changePage("#page_login");
					}
				}
			});
	} else {
		$.mobile.changePage("#page_login");
	}
}

// 인증 후, 데이터 초기화
uf_initialize_data = function () {
	uf_showLoading("show");

	// alert('uf_jq_initialize start'+gvMac);
	// DB 생성
	db = window.openDatabase("kab_member", "1.0", "KAB Member DB", 1000000);
	db.transaction(populateDB, errorCB, successCB);


	// 직원목록 넣기
	uf_getEmpList();
	
	// 부서목록 넣기
	uf_getDeptList();

	// 직위목록 넣기
	uf_getPositionList();


	uf_showLoading("hide");


	// 직원조회 페이지 init
	$( "#page_emp" ).on( "pageinit", function(event){
  	//alert( 'This page was just enhanced by jQuery Mobile!' );
  	//alert('pageload');
  	
  	// search field - event
		//$( "#emp_search" ).keypress( function() {
		//	alert($(this).val());
		//});
		$( "#btn_search" ).click(function() {
			uf_searchEmp( $( "#emp_search" ).val() );
		});

  	$( "ul#emp_list" ).listview( "refresh" );
  	uf_setCheckboxEvent();

		// 무한 스크롤~
		$(window).scroll(function(){
			var tActivePage = $.mobile.activePage.attr("id");

			// 직원보기 화면만 스크롤 이벤트 처리
			if( tActivePage=="page_emp" || tActivePage=="page_emp_part" ) {
				if ($(window).scrollTop() == $(document).height() - $(window).height()) {
					uf_setEmpPage( (tActivePage=="page_emp"?"ul#emp_list":"ul#emp_list") );
				}
			}
		});
	});

	// 부서별 페이지 init
	$( "#page_dept" ).on( "pageinit", function(event){
  	$("#page_dept ul li a").on("click", function() {
  		var tId = $(this).attr("id");
 
  		uf_setPartEmpList(tId);
  	});
	});

	// 직위별 페이지 init
	$( "#page_position" ).on( "pageinit", function(event){
  	$("ul#listview_jikwi a").on("click", function() {
			var tId = $(this).attr("id");
  		
  		uf_setPartEmpList(tId);
  	});
	});

	// 직원상세 페이지 init
	$( "#page_emp_detail" ).on( "pageinit", function(event) {
		//gCurrentEmp = $(this).attr("id").replace("emp_detail_", "");

		uf_setEmpInfo();
	});

	// 어플 home
	$( "#page_index" ).on( "pageinit", function(event) {
		uf_initialize_data();
	});
	

}


//$(function() {
  //alert(device.platform + device.uuid);
	//$("#chk_phone_number").val(device.uuid);
	//if( $.cookie('uid') ) {
	//	$.mobile.changePage("#page_index");
	//}
	//alert( getCookie('uid') );



	/*

	$("#btn_chk_phone2").click( function() { alert(0)
		$.mobile.changePage( "#page_index" , { transition: "slideleft" });
	});


	$("#page_dept a,#page_position a").on("click", function(e) {
		if($(this).attr("id")=="part_1"||$(this).attr("id")=="position_1") {
			$.mobile.changePage("#page_emp_part", { transition: "slideleft" });
			uf_setPartEmpList();
		}
	});
	*/

//});



// 직원목록 가져오기 - server
uf_getEmpList = function() {
	$.ajax({
		//url : "http://ideanamu.dothome.co.kr/kab/staff600.php",
		//url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/emp.jsp",
		url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/GetEmpList.jsp",
		data : {empno:"99999", handno:"010-3745-9033", mac:"AB.CD.EF.GH"},
		dataType : "jsonp",
		jsonp : "callback",
		success : function(d){
			uf_showLoading("show");
			//alert(d[1].result)
			//var tData = $.parseJSON(d[0].datas);
			var tData = d[0].datas;
			// d.key;
			// alert(d.staff.length)
			//if(d.staff.length>0) {
			if(tData.length>0) {
				//alert(0);
				gEmpLists = tData;
				uf_saveDBEmpList();
			}
		}
	});
}

// 부서목록 가져오기 - server
uf_getDeptList = function() {
	$.ajax({
		type: "POST",
		//url : "http://kabmobile.mighty-x.com:8080/mighty/ajax.do",
		//url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/dept.jsp",
		
		url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/GetDeptList.jsp",
		//url : "dept.json",
		
		//data: "params="+_X.EncodeParam("XmlSelect" + _Param_Separate + "JSON" + _Param_Separate + "sm" + _Param_Separate + _X.IsNull("CodeEmp","") + _Param_Separate + _X.IsNull("CODE_EMP","") + _Param_Separate + _X.IsNull("%,%,%","") + _Param_Separate + _X.IsNull("all","") + _Param_Separate + _X.IsNull("˛","") + _Param_Separate + _X.IsNull("¸","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","")),
		data : {empno:"99999", handno:"010-3745-9033", mac:"AB.CD.EF.GH"},
		dataType : "jsonp",
		jsonp : "callback",
		success : function(d){
			//var tData = $.parseJSON(d[0].datas);
			var tData = d[0].datas;
			//uf_showLoading("show");

			if(tData.length>0) {
				uf_setDeptList(tData);
				//alert(tData.length);
			}
		}
	});
}

// 직위목록 가져오기 - server
uf_getPositionList = function() {
	$.ajax({
		type: "POST",
		//url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/jikwi.jsp",
		url : "http://kabmobile.mighty-x.com:8080/Mighty/mobile/GetJikwiList.jsp",
		//data: "params="+_X.EncodeParam("XmlSelect" + _Param_Separate + "JSON" + _Param_Separate + "sm" + _Param_Separate + _X.IsNull("CodeEmp","") + _Param_Separate + _X.IsNull("CODE_EMP","") + _Param_Separate + _X.IsNull("%,%,%","") + _Param_Separate + _X.IsNull("all","") + _Param_Separate + _X.IsNull("˛","") + _Param_Separate + _X.IsNull("¸","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","") + _Param_Separate + _X.IsNull("","")),
		data : {empno:"99999", handno:"010-3745-9033", mac:"AB.CD.EF.GH"},
		dataType : "jsonp",
		jsonp : "callback",
		success : function(d){
			//var tData = $.parseJSON(d[0].datas);
			var tData = d[0].datas;
			//uf_showLoading("show");

			if(tData.length>0) {
				uf_setJikwiList(tData);
				//alert(tData.length);
			}
		}
	});
}

// 직원목록 검색 - local
uf_searchEmp = function(aVal) {
	uf_showLoading("show");
	db.transaction(function(tx) {
		tx.executeSql('select * from MEMBER where name like "%'+aVal+'%" ', [], uf_setSearchResult, errorCB);
		//alert('select * from MEMBER where name like "%'+aVal+'%" ');
		//tx.executeSql('select * from MEMBER ', [], uf_setSearchResult, errorCB);
		gEmpCurPage = 0;
	}, errorCB);
}

// 직원목록 표시
uf_setSearchResult = function(tx, results) {
	uf_showLoading("hide");
	var tLen = results.rows.length;
	var tLi;
	gEmpPages = Math.ceil(tLen / gCntPage);
	gEmpResults = results.rows;

	$("ul#emp_list").empty();
	uf_setEmpPage("ul#emp_list");
}

// 직원목록 표시 - page
uf_setEmpPage = function(aList) {
	//페이지가 넘으면 스크롤 막기
	if((gEmpCurPage+1)>gEmpPages) return;

	var tmpList = $(aList);
	var tCurI = 0;
	var tLoopCnt = gEmpResults.length-gEmpCurPage*gCntPage;
	if(tLoopCnt>gCntPage) tLoopCnt = gCntPage;

	for(var i=0;i<tLoopCnt;i++) {
		tCurI = (gEmpCurPage*gCntPage)+i ;
		//사진버젼
		//tLi = '<li><a href="#"><img src="'+gEmpLists[gEmpResults.item(tCurI).id].photo+'" height="70" align="left"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].name+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].posname+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].deptname+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		//노사진버전
		tLi = '<li><a href="#"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].HNAME+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].JWNAME+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].DPNAME+" "+gEmpLists[gEmpResults.item(tCurI).id].TMNAME+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		tmpList.append( tLi );
	}

	tmpList.listview("refresh");
	setTimeout( "uf_setCheckboxEvent()", 500 );

	gEmpCurPage++;
}

// 직원목록 넣기
uf_saveDBEmpList = function() { 
	//var emp_list = $("ul#emp_list");
	
	db.transaction(function(tx) {
		for(var i in gEmpLists)
		{
			tId = i; 
			tName = gEmpLists[i].HNAME; // gEmpLists[i].name;
			tTelcell = gEmpLists[i].HANDNO; // gEmpLists[i].telcell;
			tTelcomp = gEmpLists[i].O_TELNO; // gEmpLists[i].telcomp;
			tZonecode = gEmpLists[i].ZONECODE;
			tZonecodenm = gEmpLists[i].ZONECODENM;
			tDpcode = gEmpLists[i].DPCODE;
			tDpname = gEmpLists[i].DPNAME;
			tTmcode = gEmpLists[i].TMCODE;
			tTmname = gEmpLists[i].TMNAME;
			tJwcode = gEmpLists[i].JWCODE;
			tJwname = gEmpLists[i].JWNAME;
			// tLi = '<li><a href="#"><img src="'+gEmpLists[i].photo+'" height="70" align="left"><h2>'+gEmpLists[i].name+' <span class="emp_posname">'+gEmpLists[i].posname+'</span></h2><p>'+gEmpLists[i].deptname+'</p></a><a id="emp_detail_'+i+'" href="#"></a></li>';

			//tLi = '<li><a href="#"><img src="'+gEmpLists[i].photo+'" height="70" align="left"><h2>'+gEmpLists[i].name+' <span class="emp_posname">'+gEmpLists[i].posname+'</span></h2><p>'+gEmpLists[i].deptname+'<br />'+gEmpLists[i].telcomp+' / '+gEmpLists[i].telcell+'<br />'+gEmpLists[i].email+'</p></a><a id="emp_detail_'+i+'" href="#"></a></li>';
			//tLi = '<li><a href="#"><h2>'+(i>2?"장길산":"홍길동")+' <span class="emp_posname">과장</span></h2></a><a href="dept.html"></a></li>';
		
			// emp_list.append( tLi );
			tx.executeSql('INSERT INTO MEMBER (id, name, telcomp, telcell, zonecode, zonecodenm, dpcode, dpname, tmcode, tmname, jwcode, jwname) VALUES ('+tId+', "'+tName+'", "'+tTelcomp+'", "'+tTelcell+'", "'+tZonecode+'", "'+tZonecodenm+'", "'+tDpcode+'", "'+tDpname+'", "'+tTmcode+'", "'+tTmname+'", "'+tJwcode+'", "'+tJwname+'") ');
		}
	}, errorCB, successCB);

	uf_showLoading("hide");
	//emp_list.listview("refresh");
	//uf_setCheckboxEvent();
}

// checkbox Event 설정 - 데이터 갱신하면 실행해줍니다.
uf_setCheckboxEvent = function() {
	$("#page_emp ul#emp_list li a.ui-link-inherit").on("click", function(e) { 
		$(this).toggleClass("bg_checkbox");
	});
	
	$("#page_emp a").on("click", function(e) {
		if($(this).attr("id")&&$(this).attr("id").substr(0,10)=="emp_detail") {
			gCurrentEmp = $(this).attr("id").replace("emp_detail_", "");
			uf_setEmpInfo();
		}
	});
}

// 직원 세부정보 넣기
uf_setEmpInfo = function() { 
	// alert(gEmpLists[gCurrentEmp].name);
	$("#emp_info_photo").attr("src", "http://kabmobile.mighty-x.com:8080/Mighty/mobile/GetEmpPic.jsp?empno="+gEmpLists[gCurrentEmp].EMPNO);
	$("#emp_info_deptname").html(gEmpLists[gCurrentEmp].DPNAME+" "+gEmpLists[gCurrentEmp].TMNAME);//gEmpLists[gCurrentEmp].deptname);
	$("#emp_info_name").html(gEmpLists[gCurrentEmp].HNAME); //gEmpLists[gCurrentEmp].name);
	$("#emp_info_posname").html(gEmpLists[gCurrentEmp].JWNAME); //gEmpLists[gCurrentEmp].posname);
	$("#emp_info_telcomp a").attr("href", "tel:"+gEmpLists[gCurrentEmp].O_TELNO); //gEmpLists[gCurrentEmp].telcomp);
	$("#emp_info_telcomp span.ui-btn-inner").html("회사 : "+gEmpLists[gCurrentEmp].O_TELNO); //gEmpLists[gCurrentEmp].telcomp);
	$("#emp_info_telcell a").attr("href", "tel:"+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
	$("#emp_info_telcell span.ui-btn-inner").html("휴대폰 : "+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
	$("#emp_info_email a").attr("href", "mailto:"+gEmpLists[gCurrentEmp].EMAIL); //gEmpLists[gCurrentEmp].email);
	$("#emp_info_email span.ui-btn-inner").html("이메일 : "+gEmpLists[gCurrentEmp].EMAIL); //gEmpLists[gCurrentEmp].email);
	//$("#emp_info_telcomp").html( '<a href="tel:'+gEmpLists[gCurrentEmp].telcomp+'" data-role="button">'+gEmpLists[gCurrentEmp].telcomp+'</a>' );
	//$("#emp_info_telcell").html( '<a href="tel:'+gEmpLists[gCurrentEmp].telcell+'" data-role="button">'+gEmpLists[gCurrentEmp].telcell+'</a>' );
	//$("#emp_info_email").html( '<a href="mailto:'+gEmpLists[gCurrentEmp].email+'" data-role="button">'+gEmpLists[gCurrentEmp].email+'</a>' );
}

// 직원목록(부서별, 직위별) 넣기
uf_setPartEmpList = function(aId) {
	var emp_list_part = $("ul#emp_list_part");
	var tId = aId.split("_");
	emp_list_part.empty();
// alert(tId[0] + tId[1])
	uf_showLoading("show");
	db.transaction(function(tx) {
		//var tmpSql = 'select * from MEMBER where dpcode="'+tId[1]+'" ';
		var tmpSql = "select * from MEMBER where "+(tId[0]=="dpcode"?"dpcode='"+tId[1]+"' and tmcode='"+tId[2]+"' ":"jwcode='"+tId[1]+"' ")
		// alert(tmpSql);
		// tx.executeSql('select * from MEMBER where 1 ', [], uf_setSearchPartResult, errorCB);
		tx.executeSql( tmpSql, [], uf_setSearchPartResult, errorCB);
		//alert('select * from MEMBER where name like "%'+aVal+'%" ');
		// tx.executeSql('select * from MEMBER ', [], uf_setSearchPartResult, errorCB);
		//gEmpCurPage = 0;
	}, errorCB);

	
}

// 직원목록(부서별, 직위별) 표시
uf_setSearchPartResult = function(tx, results) { 
	uf_showLoading("hide");
	var tmpList = $("#emp_list_part");
	tmpList.empty();
	var tEmpPartResults = results.rows;
	//alert(tEmpPartResults.length);
	// alert(tEmpPartResults.item(0).name);
	
	for(var i=0;i<tEmpPartResults.length;i++) {
		//사진버젼
		//tLi = '<li><a href="#"><img src="'+gEmpLists[gEmpResults.item(tCurI).id].photo+'" height="70" align="left"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].name+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].posname+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].deptname+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		//노사진버전
		//tLi = '<li><a href="#"><h2>'+gEmpLists[tEmpPartResults.item(i).id].CB+' <span class="emp_posname">'+gEmpLists[tEmpPartResults.item(i).id].CI+'</span></h2><p>'+gEmpLists[tEmpPartResults.item(i).id].CE+'</p></a><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';
		tLi = '<li><a href="#"><h2>'+tEmpPartResults.item(i).name+' <span class="emp_posname">'+tEmpPartResults.item(i).jwname+'</span></h2><p>'+tEmpPartResults.item(i).dpname+" "+tEmpPartResults.item(i).tmname+'</p></a><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		tmpList.append( tLi );
	}
//alert(0)
	tmpList.listview("refresh");
	uf_setPartCheckboxEvent();
	//uf_setEmpPage("ul#emp_list");
}

// checkbox Event 설정 - 데이터 갱신하면 실행해줍니다.
uf_setPartCheckboxEvent = function() {
	$("#page_emp_part ul#emp_list_part li a.ui-link-inherit").on("click", function(e) { 
		$(this).toggleClass("bg_checkbox");
	});
	
	$("#page_emp_part a").on("click", function(e) {
		if($(this).attr("id")&&$(this).attr("id").substr(0,10)=="emp_detail") {
			gCurrentEmp = $(this).attr("id").replace("emp_detail_", ""); //alert(gCurrentEmp)
			uf_setEmpInfo();
			//;$.mobile.changePage("#page_emp_detail");
		}
	})
}

// 부서 listview 생성
uf_setDeptList = function(aDepts) {
	var tListview = $("#lv_dept_root");
	var tCListview;
	var tPreLevel = "";
	var arrHtml = [];
	var j = 0;
	
	for(var i in aDepts) {
		if(tPreLevel=="3"&&aDepts[i].DATA_LVL!=tPreLevel) arrHtml[j++] = '</ul>';
		if(aDepts[i].DATA_LVL<tPreLevel&&tPreLevel!="") {
			//arrHtml[j++] = "</div>";
			if(tPreLevel=="3"&&aDepts[i].DATA_LVL=="1") arrHtml[j++] = "</div></div>";
			if(tPreLevel=="3"&&aDepts[i].DATA_LVL=="2") arrHtml[j++] = "</div>";
			if(tPreLevel=="2"&&aDepts[i].DATA_LVL=="1") arrHtml[j++] = "</div></div>";
		}
		if(tPreLevel==aDepts[i].DATA_LVL&&(tPreLevel!="3")) arrHtml[j++] = "</div>";

		if(aDepts[i].DATA_LVL!="3") { 
			arrHtml[j++] = '<div id="lv_dept_'+(aDepts[i].DATA_LVL=="1"?aDepts[i].LVL_CD1:aDepts[i].LVL_CD2)+'" data-role="collapsible" '+(aDepts[i].DATA_LVL=="2"?' data-collapsed-icon="plus" data-expanded-icon="minus" data-theme="b" ':"")+'><h2>'+(aDepts[i].DATA_LVL=="1"?aDepts[i].LVL_NM1:aDepts[i].LVL_NM2)+'</h2>';
		}

		if(aDepts[i].DATA_LVL=="3"&&tPreLevel!="3") { 
			arrHtml[j++] = '<ul data-role="listview">';
		}

		if(aDepts[i].DATA_LVL=="3") { 
			arrHtml[j++] = '<li><a id="dpcode_'+aDepts[i].LVL_CD2+'_'+aDepts[i].LVL_CD3+'" href="#page_emp_part">'+aDepts[i].LVL_NM3+'<span class="ui-li-count">'+aDepts[i].LVL_CNT3+'</span></a></li>';
		}

		tPreLevel = aDepts[i].DATA_LVL;
	}
	if(tPreLevel=="3") arrHtml[j++] = '</ul>';
	arrHtml[j++] = "</div>";
	if(tPreLevel!="1") arrHtml[j++] = "</div>";
	tListview.html( arrHtml.join('') );

	tListview.trigger('create')
}

// 직위 listview 생성
uf_setJikwiList = function(aDatas) {
	var tListview = $("#listview_jikwi");
	var tCListview;
	var tMoDCode = "";
	
	for(var i in aDatas) {
		tListview.append('<li><a id="jwcode_'+aDatas[i].JWCODE+'" href="#page_emp_part">'+aDatas[i].JWNAME+' <span class="ui-li-count">'+aDatas[i].CNT+'</span></a></li>');
	}

	tListview.listview("refresh");
}




// DB 생성
function populateDB(tx) {
	tx.executeSql('DROP TABLE IF EXISTS MEMBER');
	tx.executeSql('CREATE TABLE IF NOT EXISTS MEMBER (id, empno, name, posname, deptname, telcomp, telcell, email, zonecode, zonecodenm, dpcode, dpname, tmcode, tmname, jwcode, jwname)');
}

function errorCB(err) {
	alert("준비중입니다.");
  // alert("Error processing SQL: "+err.code);
}

function successCB() {
    // alert("success!");
}

uf_showLoading = function(aTag) {
	$.mobile.loading( aTag=="show"?"show":"hide" );
}

// 인증
uf_regnumber = function() {
	gvHandno = $("#chk_phone_number").val();
	gvEmpno = $("#chk_empno").val();
	//tPhone = tPhone.replace("-", "");
	//gPhoneNum = tPhone;

	if(gvHandno&&gvEmpno) {
		// 전화번호 유효성 체크
		//var rgEx = /^01[016789]-\d{3,4}-\d{4}$/g;
		//var telOk = rgEx.test(tPhone);

		if(gvHandno.length<10) { 
			// 전화번호 형식이 잘못됐습니다.
			$("#popupDialogTel h3.ui-title").html("전화번호 형식이 맞지 않습니다.");
			$("#popupDialogTel").popup("open");
		} else {
			uf_showLoading("show");
			// 인증번호 입력 화면으로 이동
			$.ajax({
				type: "POST",
				url : gvUrl + "ChkEmpExist.jsp",
				data: { handno : gvHandno, empno : gvEmpno, mac : gvMac },
				dataType : "jsonp",
				jsonp : "callback",
				success : function(d){
					//alert(d);
					uf_showLoading("hide");

					if(d.result=="OK") {
						$.mobile.changePage("#page_login2");
					} else if(d.result=="NOT_EXIST") { 
						// 등록된 전화번호가 없습니다.
						$("#popupDialogTel h3.ui-title").html("등록된 전화번호가 없습니다.<br />직원만 이용하실 수 있습니다.");
						$("#popupDialogTel").popup("open");
					} else {
						// 등록된 전화번호가 없습니다.
						$("#popupDialogTel h3.ui-title").html("등록된 전화번호가 없습니다.<br />직원만 이용하실 수 있습니다.");
						$("#popupDialogTel").popup("open");
					}
				}
			});
		}
	} else {
		// 전화번호를 입력하셔야 합니다. return
		$("#popupDialogTel h3.ui-title").html("전화번호를 입력하세요.");
		$("#popupDialogTel").popup("open");
	}
}

uf_chkregnumber = function() {
	var tRegNo = $("#chk_phone_number2").val();

	if(tRegNo) {

		if(tRegNo.length<6) { 
			// 전화번호 형식이 잘못됐습니다.
			$("#popupDialogTel2 h3.ui-title").html("인증번호 6자리를 입력하세요.");
			$("#popupDialogTel2").popup("open");
		} else {
			uf_showLoading("show");
			// 인증번호 입력 화면으로 이동
			$.ajax({
				type: "POST",
				url : gvUrl + "SetLoginInfo.jsp",
				data: { handno : gvHandno, empno : gvEmpno, mac : gvMac, regno : tRegNo },
				dataType : "jsonp",
				jsonp : "callback",
				success : function(d){ 
					uf_showLoading("hide");

					if(d.result=="ok") {
						//$.cookie('uid', gPhoneNum);
						window.localStorage.setItem("handno", gvHandno);
						window.localStorage.setItem("empno", gvEmpno);

						uf_initialize_data();
						$.mobile.changePage("#page_index");
					} else {
						window.localStorage.setItem("handno", gvHandno);
						window.localStorage.setItem("empno", gvEmpno);

						// 등록된 전화번호가 없습니다.
						uf_initialize_data();
						$.mobile.changePage("#page_index");

						// 임시로 인증 막아둠.
						//$("#popupDialogTel2 h3.ui-title").html("인증번호가 일치하지 않습니다.<br />이용하실 수 없습니다.");
						//$("#popupDialogTel2").popup("open");
					}
				}
			});
		}
	} else {
		// 인증번호 입력하셔야 합니다. return
		$("#popupDialogTel2 h3.ui-title").html("인증번호를 입력하세요.");
		$("#popupDialogTel2").popup("open");
	}
}

