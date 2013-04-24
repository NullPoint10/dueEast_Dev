$(document).ready(function () {

	var width = 500,
		height = 500;
		
	var nodeCount = 100,
		linkCount = 50,
		linkLength = 50,
		sourceNode = '';

		
	var nodes = [],
		nodeLinks = [],
		linkPath = [];

	//initialize the SVG and the layer groups
	var SVGmap = d3.select( "#chart2" )
					.append( "svg" )
					.attr( "width", width )
					.attr( "height", height )
					.attr( "overflow", "hidden");

	var gLinks = SVGmap.append( "g" );
	var gNodes = SVGmap.append( "g" );

	// d3 line function to draw the beizer curve lines.
	var lineDraw = d3.svg.line()
						.x( function( d ) { return d.x; } )
						.y( function( d ) { return d.y; } )
						.interpolate( "basis" );


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

	function resetSVG () {
		gLinks.selectAll( ".linkPath" ).remove();
		gNodes.selectAll( ".nodes" ).attr( "fill", "rgba(200,200,200,0.5)" );


	}

	// gets the distance between ponits
	function ptsLength( src, tgt ) { 
		return Math.sqrt( Math.pow( src.x - tgt.x, 2) + Math.pow( src.y - tgt.y, 2) );
	}


	//gets the angle between points
	function angleCalc( src, tgt ) {
		//negative sign on the y because the svg y-axis is inverted
		return ( Math.atan2( -( tgt.y - src.y ), ( tgt.x - src.x) ) ) * 180 / Math.PI;
	}


	//gives the end pt along a radius and angle from the given center point
	function radiusEndPoint( centerPt, angle, radiusLen ) {
		var endPt = {};
		endPt.x = centerPt.x + ( radiusLen * Math.cos( angle * Math.PI / 180) );
		endPt.y = centerPt.y - ( radiusLen * Math.sin( angle * Math.PI / 180) );
		return endPt;
	}

	//returns a random integer between 0 and max_val
	function randInt( max_val ) {
		return Math.floor( Math.random() * max_val );
	}

	function clickLinks( srcNode ) {
		createLinks( srcNode.id )
	} 

	//This function draws the link between the nodes along the 45 degree radials
	function createLinks( srcNode ) {
		var i ,
			n ;
		
		var targetNode,
			destDistance,
			srcToTargetAngle,
			srcToTargetRadial;
		
		linkPath = [];	
		gNodes.selectAll( ".nodes" ).attr( "fill", "rgba(200,200,200,0.5)" );
		
		if ( sourceNode != srcNode ) sourceNode = srcNode;

		//loop through each link and draw the link line
		i = 0;	
		for (  ; i <  linkCount; i++ ) {
			
			linkPath[i] = {};
			targetNode = nodeLinks[sourceNode][i];
			gNodes.selectAll( '#n' + targetNode ).attr( "fill", "rgba(255,251,0,0.5)" );
			
			linkPath[ i ].key_data = 'l_' + sourceNode + '_' + targetNode; 
			linkPath[ i ].pts = [];
			linkPath[ i ].pts[ 0 ] = { 	
					'x' : nodes[sourceNode].x, 
					'y' : nodes[sourceNode].y 
			};
			
			destDistance = ptsLength( nodes[sourceNode], nodes[targetNode] );
			n = 1;
			while ( destDistance > linkLength * 1.2) {

				srcToTargetAngle = angleCalc( linkPath[i].pts[n-1], nodes[targetNode] );
				srcToTargetRadial = radialAngle( srcToTargetAngle, 0, 45 );

				linkPath[ i ].pts[ n ] = radiusEndPoint( linkPath[i].pts[n - 1], srcToTargetRadial, linkLength );
				//update the distance and angle with new intermediate points
				destDistance = ptsLength( linkPath[i].pts[n], nodes[targetNode] );	
				n++;
			}				

			//fill in the end point
			linkPath[i].pts[n] = {	
					'x' : nodes[targetNode].x , 
					'y' : nodes[targetNode].y
			};

								
		}


		//
		gLinks.selectAll( ".linkPath" ).data( linkPath, function (d) {return d.key_data} )			
			.exit().transition().duration(750).style('opacity',0)
				.remove();	
						
		gLinks.selectAll(".linkPath").data( linkPath, function (d) {return d.key_data})
		.enter().append("path")
			.attr( "class", "linkPath" )
			.attr( "stroke", "rgba(255,220,0,0.4)" )
			.attr( "stroke-width", 2 )
			.attr( "fill", "none" )
			.attr( "opacity", 0 )
			.transition().delay(100).duration(1500).style('opacity',1)	
			.attr( "d", function(d) {return lineDraw(d.pts);});					

		//color the source node red		
		gNodes.selectAll('#n' + nodes[ sourceNode].id )
						.attr("fill", "rgba(255,51,0,1)");	
	}	

	function addLinks( newLinkCount ) {
		var i,
			j;

		i=0;
		for( ; i < nodeCount; i++ ) {
			j=linkCount;
			for( ; j < newLinkCount; j++) {
				nodeLinks[i].push( randInt( nodeCount ) ); 
			}
		}
		linkCount = newLinkCount;
		if ( sourceNode ) {
			createLinks( sourceNode );		
		}
	}

	function delLinks( newLinkCount ) {

		nodeLinks = $.map( nodeLinks, function ( val, idx ) { 
				return [ val.splice( 1, newLinkCount ) ];
			});		 	
		linkCount = newLinkCount;
		if ( sourceNode ) {
			createLinks( sourceNode );		
		}
	}

	/*This function removes all existing nodes and links and then creates new nodes 
	and links, based on the inputs provided. It then plots the nodes and labels them
	*/
	function drawNodes() {
		
		gNodes.selectAll( ".nodes" ).data( d3.values( nodes ) )
			.enter()
				.append( "circle" )
					.attr( "class", "nodes" )
					.attr( "id", function(d) { return 'n' + d.id; } )	
					.attr( "cx", function(d) { return d.x; } )
					.attr( "cy", function(d) { return d.y; } )
					.attr('opacity',0)
					.attr( "r", 5 )
					.attr( "fill", "rgba(200,200,200,0.5)" )
					.attr( "stroke", "grey" )
					.on( "click", clickLinks )
				.append( "title" )
					.text( function(d) { return d.label; } );

		gNodes.selectAll( ".nodes" )
			.transition().duration(750)
			.attr('opacity',1);
		
		gNodes.selectAll( ".nodes" ).data( d3.values( nodes ) )			
			.exit().transition().duration(750)
					.attr('opacity',0)
					.remove();		
	}


	function addNodes( start, newNodeCount ) {
		var i;

		i = start;
		for( ; i < newNodeCount; i++ ) {
			nodes[i] = { 	
					'id' : i, 
					'label' : ('node' + i), 
					'x' : randInt( width ), 
					'y' : randInt( height ) 
			};
			//create the links
			nodeLinks[i] = [];	
			j = 0;	
			for( ; j < linkCount; j++ ) {
				nodeLinks[i].push( randInt( newNodeCount ) ); 
			}
		}
		//update the global node count with new value
		nodeCount = newNodeCount;
		drawNodes()
	}


	function delNodes( newNodeCount ) {
		var i,
			j;
		//delete the extra nodes
		nodes.splice( newNodeCount, nodeCount);
		nodeLinks.splice( newNodeCount, nodeCount );

		//replace links to deleted nodes with a random existing node
		i=0;
		for ( ; i < newNodeCount; i++ ) {
			j=0;
			for ( ; j < linkCount; j++ ) {
				nodeLinks[i][j] =  nodeLinks[i][j] < newNodeCount ? nodeLinks[i][j] : randInt( newNodeCount );
			}		 	
		}
		

		//draw the new node list
		nodeCount = newNodeCount;
		drawNodes();
		
		//if the links are curretly drawn, redraw them with the new links
		if ( sourceNode ) {
			if ( sourceNode < newNodeCount ) {
				createLinks( sourceNode )	
			} else {
				sourceNode = "";
				resetSVG();
			}
		}
	}


	addNodes( 0, nodeCount );
		
	d3.select( "#nodeCount2" ).on( "change", function() {
		+this.value < nodeCount ? delNodes( +this.value ) : addNodes( nodeCount, +this.value ); 
	});

	d3.select( "#linkCount2" ).on( "change", function() { 
		+this.value < linkCount ? delLinks( +this.value ) : addLinks( +this.value );		
	});

		
});