
  
var app = angular.module('app', ['atTaskServiceModule']);

uberAPIController
app.controller('uberAPIController', 
	function ($scope, $http, $sce, $location, $compile)     
	{

		var mainDiv = document.getElementById("uberAPImain");

		alert ('?');
		mainDiv.innerHTML = "<b>Hello verld!</b>";

	});