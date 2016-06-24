/*
 * Created by G on 26/04/2016.
 */


"use strict";

var fs = require('fs');
var urlDataGet = require("./lib/urlDataGet.js");

//get config
var configNorm = require('./lib_normalize/configNorm.js');

module.exports = exports =  function() {
	var durl = configNorm.dataurl;
	var cpurl = configNorm.cpurl;
	var xlable = configNorm.xProjection;
	var ladurl = configNorm.ladurl;
	var outPath = configNorm.outPath;

	var checkLog = './checklog.txt';
	var checkData = 'All LSOAs - LAS (recoding the difference more than 100)\n';
	fs.writeFileSync(checkLog, checkData);

	// get LAD array
	var ladarrayurl = cpurl.split('?')[0].slice(0, -4) + 'distinct?key=area_id';

	var ladArray = urlDataGet(ladarrayurl).data;
	var lenLadArray = ladArray.length;
	
	var lenXLable = xlable.length;
	
	var i, j, k, _xlable, _scpurl, sladprjDataArray, lensladprjDataArray, sladprjData, _ladurl, lsoaArray, _durl, lsoaData, _lenLsoa, _lsoad;
	var gender, agegroup;

	var data = [];
	var jj = 0;

	var jsonkeys = '{"data":[\n';
	fs.writeFileSync(outPath, jsonkeys);

	var ii, kk, _lenLsoaData, _ladValue, _tValue,  _lsoaValue, _sLsoaArray, _lenSLsoaArray, _sLsoaArray1, _allLsoa, lsoa_lad_df;

	for (i = 0; i < lenLadArray; i++) {
		//get LSOA array from the LAD
		_ladurl = ladurl.split('?')[0].slice(0, -4) + 'distinct?key=child_id&filter={"parent_id":"' + ladArray[i] + '"}';
		lsoaArray = urlDataGet(_ladurl).data;
		_lenLsoa = lsoaArray.length;
		
		_lsoad = [];
		for (ii = 0; ii < _lenLsoa; ii++) {
			_lsoad.push('"' + lsoaArray[ii] + '"');
		}
		
		console.log(lenLadArray, i, _lenLsoa);
		
		for (j = 0; j < lenXLable; j++) {
			_xlable = xlable[j];
			
			_scpurl = cpurl + '&filter={"area_id":"' + ladArray[i] + '","year":"' + _xlable + '"}';
			
			//get LAD Projection data
			sladprjDataArray = urlDataGet(_scpurl).data;
			lensladprjDataArray  = sladprjDataArray.length;

			//get data of LSOA array
			_durl = durl + '&filter={"area_id":{"$in":[' + _lsoad + ']},"year":"' + _xlable + '"}';
			lsoaData = urlDataGet(_durl).data;
			_lenLsoaData = lsoaData.length;

			for (k = 0; k < lensladprjDataArray ; k++) {
				sladprjData = sladprjDataArray[k];
				
				gender = sladprjData.gender;
				agegroup = sladprjData.age_band;
				_ladValue = sladprjData.persons;

				_sLsoaArray = [];
				_sLsoaArray1 = [];
				for (kk = 0; kk < _lenLsoaData; kk++) {
					if ((lsoaData[kk].age_band == agegroup) && (lsoaData[kk].gender == gender)) {
						_sLsoaArray.push(lsoaData[kk]);
					} else {
						_sLsoaArray1.push(lsoaData[kk]);
					}
				}

				lsoaData = _sLsoaArray1;
				_lenLsoaData = lsoaData.length;

				_lenSLsoaArray = _sLsoaArray.length;
				_tValue = 0;
				for (ii = 0; ii < _lenSLsoaArray; ii++) {
					_tValue += _sLsoaArray[ii].persons;
				}

				for (ii = 0; ii < _lenSLsoaArray; ii++) {
					if (_tValue == 0) {
						_lsoaValue = _tValue;
					} else {
						_lsoaValue = _sLsoaArray[ii].persons / _tValue;
					}

					_sLsoaArray[ii].rate = +_lsoaValue;
					_sLsoaArray[ii].persons = +(_lsoaValue * _ladValue).toFixed(2);
					_sLsoaArray[ii].popId = 'NQM-LSOA-Pop-Projection-Normalized-2015TO2026';
					_sLsoaArray[ii].popId_description = '';

					data.push(_sLsoaArray[ii]);
					jj++;

					if ((ii >= _lenSLsoaArray - 1) && (k >= lensladprjDataArray - 1) && (j >= lenXLable - 1) && (i >= lenLadArray - 1)) {
						data = JSON.stringify(data).slice(1, -1);
						data = data + '\n]}\n';

						fs.appendFileSync(outPath, data);
					} else {
						if ( jj % 1000 == 0) {
							data = JSON.stringify(data).slice(1, -1);
							data = data + ',\n';

							fs.appendFileSync(outPath, data);

							data = [];
						}
					}
				}

				_allLsoa = 0;
				for (ii = 0; ii < _lenSLsoaArray; ii++) {
					_allLsoa += _sLsoaArray[ii].persons;
				}

				lsoa_lad_df = _allLsoa - _ladValue;
				if (Math.abs(lsoa_lad_df) > 100) {
					checkData = '----- The difference of All Lsoas and LAD is ' + _allLsoa + ', ' + _ladValue + ', '+ lsoa_lad_df + '\nLAD: ' + ladArray[i] + '\nLSOA: ' + lsoaArray.toString() + '\ngender: ' + gender + '\nagegroup: ' + agegroup + '\nyear: ' + _xlable + '\n';
					fs.appendFileSync(checkLog, checkData);
				}
			}
		}
	}

	return 1;
};
