$(document).ready(function () {

//*************************************** BASE DE DATOS WEBSQL

	var db;
	var shortName = 'ventaBD';
	var version = '1.0';
	var displayName = 'ventas';
	var maxSize = 65535;

	inicarBD();
         
	function errorBD(transaction, error)
	{
		alert('Error: ' + error.message + ' code: ' + error.code);
	}
    
    function exitoBD(){}
         
    function nullHandler(){}
         
    function inicarBD()
    {
		if (!window.openDatabase) {
			alert('Las bases de datos no son compatibles con este navegador.');
			return;
		}
		db = openDatabase(shortName, version, displayName,maxSize);
		db.transaction(function(tx){
			/*tx.executeSql( 'DROP TABLE tb_usuario',nullHandler,nullHandler);
			tx.executeSql( 'DROP TABLE tb_prospecto',nullHandler,nullHandler);
			tx.executeSql( 'DROP TABLE tb_cuenta',nullHandler,nullHandler);
			tx.executeSql( 'DROP TABLE tb_contacto',nullHandler,nullHandler);
			tx.executeSql( 'DROP TABLE tb_fase',nullHandler,nullHandler);
			tx.executeSql( 'DROP TABLE tb_estado',nullHandler,nullHandler);*/

        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_usuario(id INTEGER NOT NULL PRIMARY KEY, nombre TEXT, mail TEXT, clave TEXT)', [],nullHandler,errorBD);
        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_prospecto(id INTEGER NOT NULL PRIMARY KEY, id_cuenta INTEGER, id_contacto INTEGER, presupuesto DOUBLE, necesidad TEXT, propuesta TEXT, fecha_aprox DATE, id_fase INTEGER, id_estado INTEGER, cambio TEXT)', [],nullHandler,errorBD);
        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_cuenta(id INTEGER NOT NULL PRIMARY KEY, ruc TEXT, razon_social TEXT, volumen_venta DOUBLE, cambio TEXT)', [],nullHandler,errorBD);
        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_contacto(id INTEGER NOT NULL PRIMARY KEY, id_cuenta INTEGER, nombre TEXT, apellido TEXT, mail TEXT, celular TEXT, cambio TEXT)', [],nullHandler,errorBD);
        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_fase(id INTEGER NOT NULL PRIMARY KEY, descripcion TEXT)', [],nullHandler,errorBD);
        	tx.executeSql('CREATE TABLE IF NOT EXISTS tb_estado(id INTEGER NOT NULL PRIMARY KEY, descripcion TEXT)', [],nullHandler,errorBD);
		},errorBD,exitoBD);
	}
        
	/*function agregarItem()
	{
		if (!window.openDatabase) {
			alert('Databases are not supported in this browser.');
			return;
		}
        db.transaction(function(transaction) {
			transaction.executeSql('INSERT INTO User(FirstName, LastName) VALUES (?,?)',[$('#nombre').val(), $('#apellido').val()], nullHandler,errorHandler);
		});  
        ListDBValues();
        return false;
	}

	function editarItem() 
	{
    	if (!window.openDatabase) {
			alert('Navegador no soporta base de datos');
            return;
		}
        var q = "UPDATE User SET FirstName = '"+$('#nombre').val()+"', LastName='"+$('#apellido').val()+"' WHERE UserId ="+$('#id').val();
		db.transaction(function(transaction) {
			transaction.executeSql(q,[], nullHandler,errorHandler);
		});
		ListDBValues();
       	return false;
	}*/

//*********************************************** FIN BASE DE DATOS WEBSQL

	var idFase = 1; // ID de la Fase que se muestra
	var al = ($('body').height())+1;
	
	var alCn = al-129;
	$('.cont_main').css({height:alCn+'px'});
	$('.popup_Nusu, .popup_Nusu_n').css({height:alCn+'px'});
	var alCitm = alCn-48;
	$('.cont_item_lst').css({height:alCitm+'px'});

	//asignando valor para saber si trabaja on o offline
	localStorage.setItem('onof', 'on');

	if(localStorage.getItem('usu_alm') != null){
	   	document.getElementById('mail').value = localStorage.getItem('usu_alm');
	   	document.getElementById('clave').value = localStorage.getItem('clv_alm');
	}

	$("body").on('click', '#btn_login', function(e){
		if( $("#mail").val() == ""){
			$("#mail").focus().after("<span class='menError'>Ingresa un usuario</span>");
			return false;
		}else if( $("#clave").val() == ""){
			$("#clave").focus().after("<span class='menError'>Ingresa clave</span>");
			return false;
		}else{
			var usu = $("#mail").val();
			var clv = $("#clave").val();
			if(localStorage.getItem('onof') == 'on')
			{
				$.ajax({
					type: 'POST',
					dataType: 'json', 
					data: {usu:usu, clv:clv},
					beforeSend : function (){
			            $(".main").css({display: 'inline-block'});
			        },
					url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/login",
					success : function(data) {
						$(".main").css({display: 'none'});
						if(data != 0){
							console.log("login online")
							localStorage.setItem('id_usu', data.id_usu);
							localStorage.setItem('usu_alm', usu);
							localStorage.setItem('clv_alm', clv);
							$("#d_usu h1").html(data.nombre_usu);

							//llenando tabla websql usuario
							db.transaction(function(tx){
		             			tx.executeSql('DELETE FROM tb_usuario',nullHandler,nullHandler);
		             			tx.executeSql('INSERT INTO tb_usuario(id, nombre, mail, clave) VALUES (?,?,?,?)',[data.id_usu, data.nombre_usu, usu, clv], nullHandler,errorBD);
				            });

				            llenarVentaBD(data.id_usu);

							$.mobile.changePage("#venta", { transition: "slide"/*, changeHash: false */});
						}else{
							alert("usuario o contraseña incorrectos")
						}
					},
					error: function(data){
						console.log(data);
				    }
				});
			}else{
				db.transaction(function(transaction) {
					transaction.executeSql("SELECT * FROM tb_usuario", [],
					function(transaction, result) {
						if (result != null && result.rows.length > 0) {
		                 	var row = result.rows.item(0);
		                 	if(row.mail == usu && row.clave == clv)
							{
								localStorage.setItem('id_usu', row.id);
								console.log(" login offline")
								$("#d_usu h1").html(row.nombre);
								$.mobile.changePage("#venta", {transition:"slide"});
								mostrarDataOffline();
							}else{
								alert("usuario o contraseña incorrectos")
							}
		               	}else{
		               		alert("Debe iniciar una coneccion a internet para continuar")
		               	}
		          	},errorBD);
		       	},errorBD,nullHandler);
			}
		}
	});

	$("#mail, #clave").keyup(function(){
		if( $(this).val() != "" ){
			$(".menError").fadeOut();			
			return false;
		}		
	});

	$("body").on('click', '#btn_venta', function(e){
		var id = $('#cboFase').val();
		if(localStorage.getItem('onof') == 'on'){
			//llenarFase();
			listarProspecto(id);
		}else{
			mostrarDataOffline()
		}
		$.mobile.changePage("#venta", {transition:"slide"});
		/*console.log("ventas!!");*/
	});

	$("body").on('click', '#btn_actividad', function(e){
		$.mobile.changePage("#actividad", {transition:"slide"});
	});

	$("body").on('click', '#cont_cab_nav ul li, #cont_pie_nav ul li', function(e){
		var id = this.id;
		var res = id.split("_");
 			 console.log(id ); 
	    if(id){
			var id2 = $("#"+id+" .sub-menu-nn");

			if (res[4]){
				//console.log(id+" SI");
				//console.log(res[4]); 
			 	 
				var mnos = "_bot";
 				var evtd = id.replace(mnos,''); // myString.replace(avoid,'');  

				$("#"+evtd+" .sub-menu-nn").addClass('ocultar');
				console.log(id+" SIN Cambio!");
				console.log(evtd+" CON Cambio!");

			}else{
				console.log(id+"_bot" +"  NO");
				//console.log(res[4]); 
				$("#"+id+"_bot .sub-menu-nn").addClass('ocultar');
			}

			if(id2.hasClass('ocultar')){
				id2.removeClass('ocultar');	
			}else{
				id2.addClass('ocultar');	
			}

		}else{
			$(".sub-menu-nn").addClass('ocultar');
		}
		/*console.log($(this).attr('id')+" hehe "+ this.id);*/
	});
 
		$("body").on('click', '#btn_empresa', function(e){
			$.mobile.changePage("#contactos-empresa", {transition:"slide"});
		});

			$("body").on("click",".cont_item_contend_uni_emp", function(e){
				$.mobile.changePage("#contacto_deta_empresa", {transition:"slidedown"});
			});

		$("body").on('click', '#btn_persona', function(e){
			$.mobile.changePage("#contactos-persona", {transition:"slide"});
		});

			$("body").on("click",".cont_item_contend_uni_per", function(e){
				$.mobile.changePage("#contacto_deta_persona", {transition:"slidedown"});
			});

	$("body").on('click', '#cont_deta_emp_blank_der', function(e){
		$.mobile.changePage("#contacto_emp_nuevo_editar", {transition:"slide"});
	});

	$("body").on('click', '#cont_deta_per_blank_der', function(e){
		$.mobile.changePage("#contacto_per_nuevo_editar", {transition:"slide"});
	});

	$("body").on('click', '#btn_actividad_bot', function(e){
		$.mobile.changePage("#actividad_nuevo", {transition:"slide"});
	});

	$("body").on('click', '#text-big-add-deci', function(e){
		$.mobile.changePage("#contacto_nuevo_decisor", {transition:"slide"});
	});

	/*$("body").on('click', '#cont_ind_deta_blank_der', function(e){
		$.mobile.changePage("#contacto_nuevo_editar", {transition:"slide"});
	});*/

	// 

	$("body").on('click', '#onOf', function(e) {
		if(localStorage.getItem('onof') == 'on'){
			$(this).css({background: 'silver'});
			localStorage.setItem('onof','of');
		}else{
			$(this).css({background: 'chartreuse'});
			localStorage.setItem('onof','on');
		}
	});

	$("body").on('change', '#cboFase', function(e){
		var id = $('#cboFase').val();
		if(localStorage.getItem('onof') == 'on')
		{
			listarProspecto(id);
		}else{
			listarProspectoOff(id);
		}
	});

	$("body").on("click",".btn_opc_item", function(e){
		$.mobile.changePage("#formulario_venta", {transition:"slidedown"});
	});

	$("body").on("click",".sect_uno_item_mid", function(e){
		$.mobile.changePage("#actividad_venta_ind", {transition:"slidedown"});
	});

	//OFFLINE
	function mostrarDataOffline()
	{
		if(localStorage.getItem('onof') == 'of')
		{
			listarFaseOff();
			listarProspectoOff(idFase);
		}
	}

	function listarFaseOff()
	{
		$("#cboFase").html("");
		db.transaction(function(transaction) {
			transaction.executeSql("SELECT * FROM tb_fase", [],
			function(transaction, result) {
				if (result != null && result.rows.length > 0) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						$("#cboFase").append("<option value='"+row.id+"'>"+row.descripcion+"</option>")
						if(row.id == idFase){ $(".fase_tit div div div span span span").html(row.descripcion)}
					}
				}else{
					alert("Debe iniciar una coneccion a internet para continuar")
				}
			},errorBD);
		},errorBD,nullHandler);
	}

	function listarProspectoOff(id)
	{
		$(".scroller").html("");
		var idUsu = localStorage.getItem('id_usu');

		db.transaction(function(transaction) {
			var q = "SELECT p.id, c.id, c.razon_social, p.id_contacto, p.presupuesto FROM tb_prospecto p INNER JOIN tb_cuenta c ON p.id_cuenta = c.id WHERE p.id_fase ="+id;
			transaction.executeSql(q, [],
			function(transaction, result) {
				if (result != null && result.rows.length > 0) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						$(".scroller").append(" <article class='unid_cont_item'><section class='sect_uno_item'><article class='nom_emp_item'><label>"+row.razon_social+"</label></article><article class='valor_emp_item'><label>"+row.presupuesto+" NUEVOS SOLES</label></article></section><section class='sect_dos_item'><article class='btn_opc_item' id='"+row.id+"'><div class='icon-arrow-down3'></div></article></section></article>");
					}
				}
			},errorBD);
		},errorBD,nullHandler);
	}

	//ONLINE
	function llenarVentaBD(id)
	{
		if(localStorage.getItem('onof') == 'on'){
			llenarFase();
			llenarEstado();

			llenarProspecto(id);
			llenarCuenta(id);
			llenarContacto(id);
		}
	}

	function llenarProspecto(id)
	{
		var idP,idC,idO,pre,nec,prop,fecha,idFa,idE, cam;

		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {id:id},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getProspectoUser",
			success : function(data) {
				if(data != 0){
					db.transaction(function(tx){
						tx.executeSql("DELETE FROM tb_prospecto where cambio='n'",nullHandler,nullHandler);
						for(var i=0; i< data.length; i++)
						{ 
							idP = data[i]['id_pros'];
							idC = data[i]['id_cuen'];
							idO = data[i]['id_con'];
							pre = data[i]['presupuesto_pros'];
							nec = data[i]['necesidad_pros'];
							prop = data[i]['propuesta_pros'];
							fecha = data[i]['fecha_cierre_pros'];
							idFa = data[i]['id_fpros'];
							idE = data[i]['id_epros'];
							cam = 'n';
							tx.executeSql('INSERT INTO tb_prospecto(id, id_cuenta, id_contacto, presupuesto, necesidad, propuesta, fecha_aprox, id_fase, id_estado, cambio) VALUES (?,?,?,?,?,?,?,?,?,?)',[idP,idC,idO,pre,nec,prop,fecha,idFa,idE, cam], nullHandler,errorBD);
						}
					});
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

	function llenarCuenta(id)
	{
		var id, ruc, rs, vol, fecha, cam;
		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {id:id},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getCuentaUser",
			success : function(data) {
				if(data != 0){
					db.transaction(function(tx){
						tx.executeSql("DELETE FROM tb_cuenta where cambio='n'",nullHandler,nullHandler);
						for(var i=0; i< data.length; i++)
						{ 
							id = data[i]['id_cuen'];
							ruc = data[i]['ruc_cuen'];
							rs = data[i]['razon_social_cuen'];
							vol = data[i]['volumen_venta_cuen'];
							cam = 'n';
							tx.executeSql('INSERT INTO tb_cuenta(id, ruc, razon_social, volumen_venta, cambio) VALUES (?,?,?,?,?)',[id, ruc, rs, vol, cam], nullHandler,errorBD);
						}
					});
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

	function llenarContacto(id)
	{
		var id, idc, nom, ape, mail, cel, cam;
		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {id:id},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getContactoUser",
			success : function(data) {
				if(data != 0){
					db.transaction(function(tx){
						tx.executeSql("DELETE FROM tb_contacto where cambio='n'",nullHandler,nullHandler);
						for(var i=0; i< data.length; i++)
						{ 
							id = data[i]['id_con'];
							idc = data[i]['id_cuen'];
							nom = data[i]['nombre_con'];
							ape = data[i]['apellido_con'];
							mail = data[i]['mail_con'];
							cel = data[i]['celular_con'];
							cam = 'n';
							tx.executeSql('INSERT INTO tb_contacto(id, id_cuenta, nombre, apellido, mail, celular, cambio) VALUES (?,?,?,?,?,?,?)',[id, idc, nom, ape, mail, cel, cam], nullHandler,errorBD);
						}
					});
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

	function llenarFase()
	{
		$("#cboFase").html("");
		var id, desc;
		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getFase",
			success : function(data) {
				if(data != 0){
					db.transaction(function(tx){
						tx.executeSql( 'DELETE FROM tb_fase',nullHandler,nullHandler);
						for(var i=0; i< data.length; i++)
						{ 
							id = data[i]['id_fpros'];
							desc = data[i]['descripcion_fpros'];
							tx.executeSql('INSERT INTO tb_fase(id,descripcion) VALUES (?,?)',[id, desc], nullHandler,errorBD);
							//llenado de combo
							$("#cboFase").append("<option value='"+id+"'>"+desc+"</option>")
							if(id == idFase){ $(".fase_tit div div div span span span").html(desc)}

						}
					});

					listarProspecto(idFase);
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

	function listarProspecto(id)
	{
		$(".scroller").html("");
		var idUsu = localStorage.getItem('id_usu');
		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {idUsu:idUsu, id:id},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getProspecto",
			success : function(data) {
				if(data != 0)
				{
					for(var i=0; i< data.length; i++)
					{
						$(".scroller").append(" <article class='unid_cont_item'><section class='sect_uno_item'><article class='nom_emp_item'><label>"+data[i]['razon_social_cuen']+"</label></article><article class='valor_emp_item'><label>"+data[i]['presupuesto_pros']+" NUEVOS SOLES</label></article></section><section class='sect_dos_item'><article class='btn_opc_item' id='"+data[i]['id_pros']+"'><div class='icon-arrow-down3'></div></article></section></article>");
					}
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

	function llenarEstado()
	{
		var id, desc;
		$.ajax({
			type: 'POST',
			dataType: 'json', 
			data: {},
			beforeSend : function (){
		    },
			url: "https://roinet.pe/NWROInet/venta/index.php/mobile_controller/getEstadoProspecto",
			success : function(data) {
				if(data != 0){
					db.transaction(function(tx){
						tx.executeSql( 'DELETE FROM tb_estado',nullHandler,nullHandler);
						for(var i=0; i< data.length; i++)
						{ 
							id = data[i]['id_epros'];
							desc = data[i]['descripcion_epros'];
							tx.executeSql('INSERT INTO tb_estado(id,descripcion) VALUES (?,?)',[id, desc], nullHandler,errorBD);
						}
					});
				}
			},
			error: function(data){
				console.log(data);
			}
		});
	}

});

$( window ).load(function() {

});