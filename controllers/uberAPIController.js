
  
var app=angular.module('app', ['atTaskServiceModule']);


app.controller('uberAPIController',   function ($scope, $http, $sce, $location, $compile,  atTaskWebService)     
{

var mainDiv = document.getElementById("uberAPIMain");

mainDiv.innerHTML = "<b>Hello verld!</b>";

});