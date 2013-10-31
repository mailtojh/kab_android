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
var uf_openapp;
var uf_sendSmsAll;
var uf_setMsgCount;

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

					if(d.result=="OK") {
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
	// 테스트 데이터 세팅
	//alert('get data')
	//gvEmpno = "90001";
	//gvMac = "d5aa0e0b9287122c";
	//gvHandno = "01037062216";


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
		uf_searchEmp("%");

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
// 인증없이 데이터 가져오기
// uf_initialize_data(); 

  	$("#page_dept ul li a").on("click", function() {
  		var tId = $(this).attr("id");
 
  		uf_setPartEmpList(tId);
  	});

  	// 임원 예외처리
  	$("#lv_dept_10000 a").on("click", function() {
  		$.mobile.changePage("#page_emp_part", {transition:"slide"});
  		uf_setPartEmpList("dpcode2_10000");
  	});

  	// 노조 예외처리
  	$("#lv_dept_9999 a").on("click", function() {
  		$.mobile.changePage("#page_emp_part", {transition:"slide"});
  		uf_setPartEmpList("dpcode2_9999");
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


// 직원목록 가져오기 - server
uf_getEmpList = function() {
	$.ajax({
		url : gvUrl + "GetEmpList.jsp",
		data : {empno:gvEmpno, handno:gvHandno, mac:gvMac},
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
		url : gvUrl+"GetDeptList.jsp",
		data : {empno:gvEmpno, handno:gvHandno, mac:gvMac},
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
		url : gvUrl+"GetJikwiList.jsp",
		data : {empno:gvEmpno, handno:gvHandno, mac:gvMac},
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
		tx.executeSql('select * from MEMBER where name like "%'+aVal+'%" and dpcode <> "9999"', [], uf_setSearchResult, errorCB);
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
		//사진버젼 gvUrl + "GetEmpPic.jsp?empno="+gEmpLists[gCurrentEmp].EMPNO
		//tLi = '<li><a href="#"><img src="'+gvUrl+"GetEmpPic2.jsp?empno="+gEmpLists[gEmpResults.item(tCurI).id].empno+'" height="70" align="left"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].name+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].posname+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].deptname+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';
		tLi = '<li><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#" data-transition="slide"><img src="'+gvUrl+"GetEmpPic2.jsp?empno="+gEmpLists[gEmpResults.item(tCurI).id].empno+'" height="70" align="left"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].HNAME+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].JWNAME+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].DPNAME+" "+gEmpLists[gEmpResults.item(tCurI).id].TMNAME+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		//노사진버전
		//tLi = '<li><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].HNAME+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].JWNAME+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].DPNAME+" "+gEmpLists[gEmpResults.item(tCurI).id].TMNAME+'</p></a></li>';

		tmpList.append( tLi );
	}

	tmpList.listview("refresh");
	setTimeout( "uf_setCheckboxEvent()", 50 );

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
			tEmpno = gEmpLists[i].EMPNO;
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
			tx.executeSql('INSERT INTO MEMBER (id, name, empno, telcomp, telcell, zonecode, zonecodenm, dpcode, dpname, tmcode, tmname, jwcode, jwname) VALUES ('+tId+', "'+tName+'", "'+tEmpno+'", "'+tTelcomp+'", "'+tTelcell+'", "'+tZonecode+'", "'+tZonecodenm+'", "'+tDpcode+'", "'+tDpname+'", "'+tTmcode+'", "'+tTmname+'", "'+tJwcode+'", "'+tJwname+'") ');
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
	$("#emp_info_photo").attr("src", gvUrl + "GetEmpPic.jsp?empno="+gEmpLists[gCurrentEmp].EMPNO);
	$("#emp_info_deptname").html(gEmpLists[gCurrentEmp].DPNAME+" "+gEmpLists[gCurrentEmp].TMNAME);//gEmpLists[gCurrentEmp].deptname);
	$("#emp_info_name").html(gEmpLists[gCurrentEmp].HNAME); //gEmpLists[gCurrentEmp].name);
	$("#emp_info_posname").html(gEmpLists[gCurrentEmp].JWNAME); //gEmpLists[gCurrentEmp].posname);
	$("#emp_info_telcomp a").attr("href", "tel:"+gEmpLists[gCurrentEmp].O_TELNO); //gEmpLists[gCurrentEmp].telcomp);
	$("#emp_info_telcomp span.ui-btn-inner").html("회사 : "+gEmpLists[gCurrentEmp].O_TELNO); //gEmpLists[gCurrentEmp].telcomp);
	$("#emp_info_telcell a").attr("href", "tel:"+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
	$("#emp_info_telcell span.ui-btn-inner").html("휴대폰 : "+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
	//$("#emp_info_smscell a").attr("href", "sms:"+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
	//$("#emp_info_smscell span.ui-btn-inner").html("문자 : "+gEmpLists[gCurrentEmp].HANDNO); //gEmpLists[gCurrentEmp].telcell);
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
		var tmpSql = "select * from MEMBER where "+(tId[0]=="dpcode"?"dpcode='"+tId[1]+"' and tmcode='"+tId[2]+"' ":(tId[0]=="jwcode"?"jwcode='"+tId[1]+"' ":"dpcode='"+tId[1]+"' ")) ;
		
		tx.executeSql( tmpSql, [], uf_setSearchPartResult, errorCB);
	}, errorCB);
}


// 직원목록(부서별, 직위별) 표시
uf_setSearchPartResult = function(tx, results) { 
	uf_showLoading("hide");
	var tmpList = $("#emp_list_part");
	tmpList.empty();
	var tEmpPartResults = results.rows;
		// alert(tEmpPartResults.length);
	  // alert(tEmpPartResults.item(0).name);
	
	for(var i=0;i<tEmpPartResults.length;i++) {
		//사진버젼
		//tLi = '<li><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#"><img src="'+gvUrl+"GetEmpPic2.jsp?empno="+gEmpLists[gEmpResults.item(tCurI).id].empno+'" height="70" align="left"><h2>'+gEmpLists[gEmpResults.item(tCurI).id].name+' <span class="emp_posname">'+gEmpLists[gEmpResults.item(tCurI).id].posname+'</span></h2><p>'+gEmpLists[gEmpResults.item(tCurI).id].deptname+'</p></a><a id="emp_detail_'+gEmpResults.item(tCurI).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';
		tLi = '<li><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#" data-transition="slide"><img src="'+gvUrl+"GetEmpPic2.jsp?empno="+gEmpLists[gEmpResults.item(tCurI).id].empno+'" height="70" align="left"><h2>'+tEmpPartResults.item(i).name+' <span class="emp_posname">'+tEmpPartResults.item(i).jwname+'</span></h2><p>'+tEmpPartResults.item(i).dpname+' '+tEmpPartResults.item(i).tmname+'</p></a><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';

		//노사진버전
		//tLi = '<li><a href="#"><h2>'+gEmpLists[tEmpPartResults.item(i).id].CB+' <span class="emp_posname">'+gEmpLists[tEmpPartResults.item(i).id].CI+'</span></h2><p>'+gEmpLists[tEmpPartResults.item(i).id].CE+'</p></a><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#page_emp_detail" data-transition="slide"></a></li>';
		//tLi = '<li><a id="emp_detail_'+tEmpPartResults.item(i).id+'" href="#page_emp_detail" data-transition="slide"><h2>'+tEmpPartResults.item(i).name+' <span class="emp_posname">'+tEmpPartResults.item(i).jwname+'</span></h2><p>'+tEmpPartResults.item(i).dpname+' '+tEmpPartResults.item(i).tmname+'</p></a></li>';

		tmpList.append( tLi );
	}

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
			arrHtml[j++] = '<div id="lv_dept_'+(aDepts[i].DATA_LVL=="1"?aDepts[i].LVL_CD1:aDepts[i].LVL_CD2)+'" dept-level="'+aDepts[i].DATA_LVL+'" data-role="collapsible" '+(aDepts[i].DATA_LVL=="2"?' data-collapsed-icon="plus" data-expanded-icon="minus" data-theme="c" ':"")+'><h2>'+(aDepts[i].DATA_LVL=="1"?aDepts[i].LVL_NM1:aDepts[i].LVL_NM2)+'</h2>';
		}

		if(aDepts[i].DATA_LVL=="3"&&tPreLevel!="3") { 
			arrHtml[j++] = '<ul data-role="listview">';
		}

		if(aDepts[i].DATA_LVL=="3") { 
			arrHtml[j++] = '<li><a id="dpcode_'+aDepts[i].LVL_CD2+'_'+aDepts[i].LVL_CD3+'" href="#page_emp_part" data-transition="slide">'+aDepts[i].LVL_NM3+'<span class="ui-li-count">'+aDepts[i].LVL_CNT3+'</span></a></li>';
		}

		tPreLevel = aDepts[i].DATA_LVL;
	}

	if(tPreLevel=="3") arrHtml[j++] = '</ul>';
	arrHtml[j++] = "</div>";
	if(tPreLevel!="1") arrHtml[j++] = "</div>";
	tListview.html( arrHtml.join('') );
//alert(arrHtml.join(''))
	$("#lv_dept_10100 ul").listview("refresh");
	tListview.trigger('create');
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
	gvCertno = Math.floor(Math.random() * 1000000)+100000;
	if(gvCertno>1000000) {
		gvCertno = gvCertno - 100000;
	}

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
				data: { handno : gvHandno, empno : gvEmpno, mac : gvMac, certno : gvCertno },
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
			// 인증번호 형식이 잘못됐습니다.
			$("#popupDialogTel2 h3.ui-title").html("인증번호 6자리를 입력하세요.");
			$("#popupDialogTel2").popup("open");
		} else {
			uf_showLoading("show");
			// 인증번호 입력 화면으로 이동

			if(gvCertno==tRegNo) {
				$.ajax({
					type: "POST",
					url : gvUrl + "SetLoginInfo.jsp",
					data: { handno : gvHandno, empno : gvEmpno, mac : gvMac, certno : tRegNo },
					dataType : "jsonp",
					jsonp : "callback",
					success : function(d){ 
						uf_showLoading("hide");

						if(d.result=="OK") {
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
			} else {
				uf_showLoading("hide");
				
				// 인증번호가 일치하지 않습니다.
				$("#popupDialogTel2 h3.ui-title").html("인증번호가 일치하지 않습니다.");
				$("#popupDialogTel2").popup("open");
			}
		}
	} else {
		// 인증번호 입력하셔야 합니다. return
		$("#popupDialogTel2 h3.ui-title").html("인증번호를 입력하세요.");
		$("#popupDialogTel2").popup("open");
	}
}

uf_openapp = function() {
	//단말 로컬에 있는 어플리케이션 실행
  //document.checkframe.location = "com.ezwel.ezmobile"; //("스키마://호스트" 양식임)
  //1초 후에 다음 펑션을 수행
	//setTimeout("checkApplicationInstall_callback()", 1000);
}


uf_sendSmsAll = function() {
	var tMsg = $("#sms_all_msa").val();
	
	if(tMsg.length==0) { // alert(0)
		//$("#popupDialogAlert").dialog();
		//$.mobile.changePage('#popupDialogAlert', {transition: 'pop', role: 'dialog'});
		//$('#popupDialogAlert').popup("open");
		//$('#popupDialogAlert').popup("open", {positionTo: '#page_sms'});
		//$('#popupDialogAlert').dialog('open');
		//$('#popupDialogSms').close();
		//$.mobile.changePage( "#popupDialogAlert", { role: "dialog" } );
		//$.mobile.changePage('#popupDialogAlert', {transition: 'pop', role: 'dialog'});
		alert("메세지 내용을 입력하세요");
		return false;
	} else {
		$.ajax({
			type: "POST",
			url : gvUrl + "SendSMS.jsp",
			data: { handno : gvHandno, empno : gvEmpno, mac : gvMac, receiver : "ALL", msg : tMsg },
			dataType : "jsonp",
			jsonp : "callback",
			success : function(d){ 
				if(d.result=="OK") {
					alert("메세지를 전송했습니다.");
					$("#sms_all_msa").val("");
				} else {
					alert("메세지 전송에 실패했습니다. 담당자에게 문의하세요.");
				}
			}
		});
	}
}

uf_setMsgCount = function() {
	$("#sms_char_count").html( "( " + fc_chk_byte($("#sms_all_msa").val() )+" / 70자 )");
}

function fc_chk_byte(aro_val)
{
	var ls_str = aro_val; // 이벤트가 일어난 컨트롤의 value 값
	var li_str_len = ls_str.length; // 전체길이
	
	// 변수초기화
	var i = 0; // for문에 사용
	var li_byte = 0; // 한글일경우는 2 그밗에는 1을 더함
	var li_len = 0; // substring하기 위해서 사용
	var ls_one_char = ""; // 한글자씩 검사한다
	var ls_str2 = ""; // 글자수를 초과하면 제한할수 글자전까지만 보여준다.
	
	for(i=0; i< li_str_len; i++)
	{
		// 한글자추출
		ls_one_char = ls_str.charAt(i);
		
		// 한글이면 2를 더한다.
		if (escape(ls_one_char).length > 4)
		{
			li_byte += 2;
		}
		// 그밗의 경우는 1을 더한다.
		else
		{
			li_byte++;
		}
	}
	
	return li_byte;
}



