( function () {

	var width = 500,
		height = 500,
		cellRadius = 5,
		ctrlPtLen = 1.4,
		cellsData = {}, 
		cellLinks = {},
		trTime = 750,
		nbrSegLength = 25;	
	var scl, trans, sclNbr, transNbr, cellsData, projection;
	var SVGmap, gRoads, gCells, gNbrs, rectBlk, path;
	
	var lineDraw = d3.svg.line()
						.x( function( d ) { return d.x; } )
						.y( function( d ) { return d.y; } )
						.interpolate( "basis" );
	
	SVGmap = d3.select("#chart3").append("svg").attr("width", width).attr("height", height).attr( "overflow", "hidden");
	
	gRectBlk = SVGmap.append("g");
	gRoads = SVGmap.append("g");
	gCells = SVGmap.append("g");
	gNbrs = SVGmap.append("g");

	projection = d3.geo.mercator().scale(1).translate([0, 0]);
	path = d3.geo.path().projection(projection);

	queue()
	    .defer( d3.json, "/static/other/Roads.geojson" )
	    .defer( d3.csv, "/static/other/SitesDB.csv" )
	    .await( onLoadFiles );


	function onLoadFiles( error, roadData, csvData ) {	
		zoomToCells( csvData );
		displayRoads( roadData );			
		createCellData( csvData );	
		displayCells();			
	};

	
	function zoomToCells( csvData ) {
		var latRange, longRange, tmp1, tmp2;

		//find min and max of lat and long
		latRange = d3.extent( csvData, function(d) { return +d.latitude; } );
		longRange = d3.extent( csvData, function(d) { return +d.longitude; } );
		
		//convert the min and max lat long points to current projection
		tmp1 = projection( [ longRange[0], latRange[0] ] );
		tmp2 = projection( [ longRange[1], latRange[1] ] );
		
		//calculate scale (zoom factor ) and translation point for the bounds above
		scl = 0.8 / Math.max( Math.abs( tmp1[0] - tmp2[0] ) / width, Math.abs( tmp1[1] - tmp2[1] ) / height );
		trans = [( width - scl * ( tmp1[0] + tmp2[0] ) ) / 2, ( height - scl * ( tmp1[1] + tmp2[1] ) ) / 2 ];
		
		// change the projection to new bounds
		projection.scale( scl ).translate( trans );	
		
	};

	function displayRoads( roadData ) {
		
		gRectBlk.append("rect")
			.attr("height",height)
			.attr("width",width)
			.attr("fill","rgb(80,80,80)")
			.on("click", resetMap );

		gRoads.selectAll( ".roads" ).data( roadData.features )
				.enter()
				.append( "path" )
					.attr( "class", "roads" )
					.attr( "d", path )
					.attr( "fill", "none")
					.attr( "stroke", "rgb( 95, 95, 95)" )
					.attr( "stroke-width", 1.5 );			
	};

	function resetMap() {
		gNbrs.transition().duration( trTime * 2 )
			.attr( "transform", function( d ) { return "translate(" + ( -transNbr ) + ") scale("+ 1/sclNbr +")"; });

		gRoads.transition().duration( trTime * 2 )
			.attr("transform", function( d ) { return "translate(" + ( -transNbr ) + ") scale("+ 0.5/sclNbr +")";});
					
		gCells.transition().duration( trTime * 2 )
			.attr("transform", function(d) {return "translate(" + ( -transNbr ) + ") scale("+ 1/sclNbr +")";});


		
	};


	function createCellData( csvData ) {
		var nbr_colnames = ['Nbr1','Nbr2','Nbr3','Nbr4','Nbr5','Nbr6','Nbr7','Nbr8','Nbr9','Nbr10','Nbr11','Nbr12','Nbr13','Nbr14','Nbr15','Nbr16','Nbr17','Nbr18','Nbr19','Nbr20','Nbr21','Nbr21','Nbr22','Nbr23','Nbr24','Nbr25','Nbr26','Nbr27','Nbr28','Nbr29','Nbr30','Nbr31','Nbr32'];
		
		csvData.forEach( function( cellInfo ) {
			var tmpCenter, tmpAzm, tmpNode, i;
			var tmp = [],

			
			tmpCenter =  projection( [ +cellInfo.longitude, +cellInfo.latitude ] );
			tmpCenter.x = tmpCenter[0]
			tmpCenter.y = tmpCenter[1]
			tmpAzm = 90 - ( +cellInfo.Azimuth );

			//convert angles from range -270, 90  to -180, 180 	
			tmpAzm = tmpAzm <= -180 ? tmpAzm += 360 : tmpAzm;

			//cellsData holds the cell porperties under the Cell_id
			//cellLinks holds the cell neighbors in an arrary under node name defined by Cell_id
			cellsData[ cellInfo.Cell_id ] = {
					Site: cellInfo.Site, 
					Cell_id: cellInfo.Cell_id,
					latitude: +cellInfo.latitude, 
					longitude: +cellInfo.longitude, 
					Azimuth: tmpAzm, 
					Beamwidth: +cellInfo.Beamwidth
			};
						
			//calculate center of nodes, which is the end point of the site arc along azimuth	
			tmpNode = radiusEndPoint( tmpCenter, tmpAzm, cellRadius );	
			cellsData[ cellInfo.Cell_id ].x = tmpNode.x ;
			cellsData[ cellInfo.Cell_id ].y = tmpNode.y ;
				
			i = 0;
			while( cellInfo[ nbr_colnames[i] ] != "" && i < nbr_colnames.length ) {					
				tmp[i] = cellInfo[ nbr_colnames[i] ];						
				i++			
			}	
			cellLinks[ cellInfo.Cell_id ] = tmp; 	
				
				
		});

	};

	function displayCells() {
		var arc
		//create arc using the beamwidth angle
		arc = d3.svg.arc()
					.innerRadius( 0 )
					.outerRadius( cellRadius )
					.startAngle( 0 ) 
					.endAngle( function(d) { return +d.Beamwidth * ( Math.PI / 180 ); } );

		//create and transpose the arc to the site location and rotate acccoring to azimuth
		gCells.selectAll( ".cells" ).data( d3.values( cellsData ) )
			.enter()
			.append( "path" )
				.attr( "class", "cells" )
				.attr( "id", function(d) { return d.Cell_id; } )
				.attr( "d", arc )
				.attr( "transform", function(d) { return "translate(" + projection([+d.longitude,+d.latitude]) + ") rotate(" + ((90- +d.Azimuth) - (+d.Beamwidth/2)) +")";})
				.attr( "opacity", 0 )				
				.attr( "fill", "rgb(220,220,220)" )
				.on( "click", displayNbrs )
			.append( "title" )
				.text( function(d) { return d.Cell_id; } );
		
		gCells.selectAll(".cells").transition()
			.duration( trTime * 2 ).attr( "opacity", 1 );
	};

	function displayNbrs( sNode ) {
		var i, j, nbrLine, tmp, dNode;
			zoomExtent = {};
		
		zoomExtent.max_x = sNode.x; zoomExtent.min_x = sNode.x;
		zoomExtent.min_y = sNode.y; zoomExtent.max_y = sNode.y;
		//remove existing nbr lines and reset color of cells	
		gNbrs.selectAll(".nbrLines").remove();
		gCells.selectAll(".cells").attr("fill","rgb(150,150,150)");	
		//color the source cell
		gCells.select('#' + sNode.Cell_id).attr("fill","rgb(255,51,0)")
		
		i = 0;
		for( ; i < cellLinks[ sNode.Cell_id ].length  ; i++ ) {
			
			gCells.select( '#' + cellLinks[ sNode.Cell_id ][i]).attr( "fill", "rgb(254,164,90)" )

			//fill the first 2 point along the azimuth
			nbrLine =[];
			nbrLine[0] = { 'x': sNode.x, 'y': sNode.y };
			nbrLine[1] = radiusEndPoint( nbrLine[0], sNode.Azimuth, cellRadius * ctrlPtLen );
			
			dNode = cellsData[ cellLinks[ sNode.Cell_id ][i] ];
				
			if(sNode.Site !=  dNode.Site){

				tmp = projection([ dNode.longitude, dNode.latitude ]);
				dNode.x = tmp[0];
				dNode.y = tmp[1];
				
				//find the first radial point to route the path around the cell. 
				//This will lead to the main destination pt
				nbrLine[2] = nearCellPt( nbrLine[1], dNode, sNode.Azimuth)	

				//find the path to the destination cell
				tmp = nbrLinePoints( nbrLine[ nbrLine.length - 1 ], dNode, sNode.Azimuth);
				
				j=0;
				for ( ; j < tmp.length; j++ ) {	
					nbrLine.push( tmp[j] );
				}

				
				if (zoomExtent.min_x > dNode.x){ zoomExtent.min_x = dNode.x;};
				if (zoomExtent.max_x < dNode.x){ zoomExtent.max_x = dNode.x;};
				if (zoomExtent.min_y > dNode.y){ zoomExtent.min_y = dNode.y;};
				if (zoomExtent.max_y < dNode.y){ zoomExtent.max_y = dNode.y;};
				
				// add the end node to the path
				tmp = nbrLine.length;
				nbrLine[tmp] = {}
				nbrLine[tmp].x = dNode.x;
				nbrLine[tmp].y = dNode.y;
				
				plotNbrLine( nbrLine );

					
			}
		}		
		zoomToNbrs(zoomExtent);		
	}


	function plotNbrLine( nbrLine ) {

		gNbrs.append("path")
				.attr( "class", "nbrLines" )
				.attr( "stroke", "rgba(255,220,0,0.4)" )
				.attr( "stroke-width", 1 )
				.attr( "fill", "none" )
				.attr( "opacity", 0.7 )	
				.attr( "d", lineDraw (nbrLine) );				
	}

	function nearCellPt( nbrPt, dNode, snodeAzm) {
		
		var srcDstAngle, azmDstAngle, srcDstRadial, tmpLength, tmpAngle, nextPt;
		var tmpSrcDstAngle, tmpAzmDstAngleDiff, tmpSrcDstRadial;
	
		srcDstAngle = angleCalc( nbrPt, dNode )
		azmDstAngle = angleDifference( snodeAzm, srcDstAngle );
		//returns the closest multiple of 45 to the src_dst angle reference to azimuth angle
		srcDstRadial =  radialAngle( azmDstAngle, 0, 45 );
		
		// radial end points have length greater length closer they are the the main azimuth. This is to make sure the arcs do not intersect
		//the radial angle is half of the src_dst angle + azimuth to orient it towards the azimuth
		tmpLength = cellRadius + ( ( 180 - Math.abs( srcDstRadial ) ) / 45 )	;
		tmpAngle = snodeAzm + ( srcDstRadial / 2 );
		
		nextPt = radiusEndPoint( nbrPt, tmpAngle, tmpLength );

		//check if the new point causes a change in the radial angle. if true set the path_flip to the current radial else leave it at -1
		tmpSrcDstAngle = angleCalc( nextPt, dNode );
		tmpAzmDstAngleDiff = angleDifference( snodeAzm, tmpSrcDstAngle );
		tmpSrcDstRadial =  radialAngle(tmpAzmDstAngleDiff, 0, 45);
		nextPt.path_flip = -1
		if ( tmpSrcDstRadial != srcDstRadial ){
			//if path flips keep the original angle
			nextPt.path_flip =  radialAngle( srcDstAngle, snodeAzm, 45 );
		}		
		return nextPt;
	};	

	

	function nbrLinePoints( curNode, dNode, srcAzm) {
		var destDistance, curDstAngle;
		var tmpLine = [],
			tmpPt = {},
			l = 0;

		destDistance = ptsLength( curNode, dNode );
		tmpPt = curNode;
		
		while ( destDistance > nbrSegLength * 1.2 ) {

			curDstAngle = angleCalc( tmpPt, dNode );
			nextRad =  radialAngle( curDstAngle, srcAzm, 45);

			if (tmpPt.path_flip !=-1) { nextRad = tmpPt.path_flip; }
			//next path point
			tmpPt = radiusEndPoint( tmpPt, nextRad, nbrSegLength );
			tmpPt.path_flip = -1;


			tmpLine[l] = tmpPt  ;
			destDistance = ptsLength( tmpPt, dNode );
			l++;
		}
		
		return tmpLine;
		
	};

	function zoomToNbrs(cell_zoom) {
		
		sclNbr = 0.5 / Math.max(Math.abs(cell_zoom.max_x - cell_zoom.min_x) / width, Math.abs(cell_zoom.max_y - cell_zoom.min_y) / height);

		transNbr = [(width - sclNbr*(cell_zoom.max_x + cell_zoom.min_x))/2 , ( height - sclNbr* (cell_zoom.max_y + cell_zoom.min_y ))/2 ];

		gNbrs.transition().duration(trTime*2).attr("transform", function(d) {return "translate(" + transNbr + ") scale("+ sclNbr +")";});
		
										
		gRoads.transition().duration(trTime*2).attr("transform", function(d) {return "translate(" + transNbr + ") scale("+ sclNbr +")";})
									.style("stroke-width",1/sclNbr);
		gCells.transition().duration(trTime*2).attr("transform", function(d) {return "translate(" + transNbr + ") scale("+ sclNbr +")";});

	}

	/*Gets the closest radial angle, given the ref_radial in degrees. 
		ex 45deg radial,  10 deg = 0 radial; 30deg = 45 radial; 
								120deg =  135 radial etc for ref angle 0.
	The refAngle orients 0 along the refAngle and calculated the refRadials wrt it 
			ex if ref radial is  30, then 10 = 30 radial; 60 = 75 radial etc
	*/
	function radialAngle( origAngle, refAngle, refRadial ) {
		var tmp1,
			tmp2;

		tmp1 = origAngle - refAngle + ( refRadial / 2 );
		tmp2 = Math.floor( tmp1 / refRadial );
		return ( tmp2 * refRadial ) + refAngle;
	}

	function angleCalc( src, tgt ) {
		//negative sign on the y because the svg y-axis is inverted
		return ( Math.atan2( -( tgt.y - src.y ), ( tgt.x - src.x) ) ) * 180 / Math.PI;
	}

	//returns the smallest difference between 2 angles
	function angleDifference(source,target){
		 return ( modNoBug ( target - source + 180, 360 ) - 180 );		 
	};	

	// the built-in mod has an error for negative numbers
	function modNoBug(num,den){
		return ( (num % den ) + den ) % den;
	};

	function radiusEndPoint( centerPt, angle, radiusLen ) {
		var endPt = {};
		endPt.x = centerPt.x + ( radiusLen * Math.cos( angle * Math.PI / 180) );
		endPt.y = centerPt.y - ( radiusLen * Math.sin( angle * Math.PI / 180) );
		return endPt;
	}
	// gets the distance between ponits
	function ptsLength( src, tgt ) { 
		return Math.sqrt( Math.pow( src.x - tgt.x, 2) + Math.pow( src.y - tgt.y, 2) );
	}


}) ()