/*
 * Created by G on 25/04/2016.
 */


//get normalized data
var dataNormalize = require('./dataNormalize.js');

//get normalized data
var normalizedData = dataNormalize();

if (normalizedData){
	console.log('LSOA normalized population projection data set is saved.');
}
