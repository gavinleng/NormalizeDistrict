/*
 * Created by G on 03/05/2016.
 */


"use strict";

var request = require('sync-request');

module.exports = exports =  function(url) {
	var urlData = request('GET', url).getBody('utf8');
	urlData = JSON.parse(urlData);

	return urlData;
};
