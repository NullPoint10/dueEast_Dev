(function () {

var width = 500,
	height = 500;
	
var nodeCount = 100,
	linkCount = 50,
	linkLength = 50;
	
var nodes = {};

//initialize the SVG and the layer groups	
var SVGmap = d3.select( "#chart1" )
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


// gets the distance between ponits
function ptsLength( src, tgt ) { 
	return Math.sqrt( Math.pow( src.x - tgt.x, 2) + 
						Math.pow( src.y - tgt.y, 2) );
}


//gets the angle between points
function angleCalc( src, tgt ) {
	//negative sign on the y because y axis is inverted
	return ( Math.atan2( -( tgt.y - src.y ), ( tgt.x - src.x) ) ) 
														* 180 / Math.PI;
}


//gives the end pt along a radius and angle from the given center point
function radiusEndPoint( centerPt, angle, radiusLen ) {
	var endPt = [];
	endPt.x = centerPt.x + ( radiusLen * Math.cos( angle * Math.PI / 180) );
	endPt.y = centerPt.y - ( radiusLen * Math.sin( angle * Math.PI / 180) );
	return endPt;
}


//This function draws the link between the nodes along the 45 degree radials
function drawLinks( srcNode ) {
	var i ,
		n ;
	
	var tmpLen,
		targetNode,
		destDistance,
		srcToTargetAngle,
		srcToTargetRadial;
	
	var linkPoints = [];
	
	
	gLinks.selectAll( ".linkPath" ).remove();
	gNodes.selectAll( ".nodes" ).attr( "fill", "rgba(200,200,200,0.5)" );
	gNodes.selectAll( ".srcNode" ).attr( "fill", "rgba(200,200,200,0.5)" );
	
	//loop through each link and draw the link line
	tmpLen = srcNode.links.length;
	i = 0;	
	for (  ; i <  tmpLen; i++ ) {
		linkPoints = [];
		targetNode = srcNode.links[ i ];
		
	
		//color the target node
		gNodes.selectAll( '#' + targetNode )
				.attr( "fill", "rgba(255,251,0,0.5)" );
		
		//calculate anlge and distance to destination
		destDistance = ptsLength( srcNode, nodes[ targetNode ] );
		srcToTargetAngle = angleCalc( srcNode, nodes[ targetNode ] );
		srcToTargetRadial =  radialAngle( srcToTargetAngle, 0, 45 );
		
		//fill in the first point
		linkPoints[ 0 ] = 	{ 	'x' : srcNode.x, 
								'y' : srcNode.y 
							};
		
		//fill in the intermediate points to the target node
		n = 1;
		while ( destDistance > linkLength * 1.2) {

			linkPoints[ n ] = radiusEndPoint( linkPoints[ n - 1 ],  
											srcToTargetRadial, linkLength );

			//update the distance and angle with new intermediate points
			destDistance = ptsLength( linkPoints[ n ], nodes[ targetNode ] );
			srcToTargetAngle = angleCalc( linkPoints[ n ], nodes[ targetNode ]);
			srcToTargetRadial =  radialAngle(srcToTargetAngle, 0, 45);
		
			n++;
		}
		//fill in the end point
		linkPoints[n] = {	'x' : nodes[ targetNode ].x , 
							'y' : nodes[ targetNode ].y
						};
		//draw the links
		gLinks.append("path")
			.attr("class","linkPath")
			.attr("stroke", "rgba(255,220,0,0.4)")
			.attr("stroke-width",2)
			.attr("opacity",1)
			.attr("fill", "none")
			.attr("d", lineDraw(linkPoints));
				
	}
	//color the source node red
	gNodes.selectAll('#' + srcNode.label)
					.attr("fill", "rgba(255,51,0,1)")
					.attr("class","srcNode");	
}	

	
/*This function removes all existing nodes and links and then creates new nodes 
and inks, based on the inputs provided. It then plots the nodes and labels them
*/
function createNodes(nodes, nodeCount, linkCount){
	var i,
		j;
	
	gNodes.selectAll( ".nodes" ).remove();
	gNodes.selectAll( ".srcNode" ).remove();
	gLinks.selectAll( ".linkPath" ).remove();
	
	//create nodes and the links
	nodes = {};
	i = 0;
	for( ; i < nodeCount; i++ ) {
		nodes[ 'node' + i ] = { 'id' : i, 
								'label' : ( 'node' + i ), 
								'x' : Math.floor( Math.random() * width ), 
								'y' : Math.floor( Math.random() * height ) };
		
		nodes[ 'node' + i ].links = [];	
		j = 0;									
		for( ; j < linkCount; j++ ) {
			nodes[ 'node' + i ].links
				.push( 'node' + Math.floor( Math.random() * nodeCount ) ); 
		}

	}
	//plot nodes
	gNodes.selectAll( ".nodes" ).data( d3.values( nodes ) )
			.enter()
		.append( "circle" )
			.attr( "class", "nodes" )
			.attr( "id", function(d) { return d.label; } )	
			.attr( "cx", function(d) { return d.x; } )
			.attr( "cy", function(d) { return d.y; } )
			.attr( "r", 5 )
			.attr( "fill", "rgba(200,200,200,0.5)" )
			.attr( "stroke", "grey" )
			.on( "click", drawLinks )
		.append( "title" )
			.text( function(d) { return d.label; } );
	
	return nodes; 	
}



nodes = createNodes( nodes, nodeCount, linkCount );
	
d3.select( "#nodeCount" ).on( "change", function() { 
		nodeCount = this.value; 
		nodes = createNodes( nodes, nodeCount, linkCount );
});

d3.select( "#linkCount" ).on( "change", function() { 
		linkCount = this.value; 
		nodes = createNodes( nodes, nodeCount, linkCount);
});

d3.select("#linkLength").on("change", function() {
		var tmp,
			srcNode;
	
		linkLength = this.value; 
		tmp = gNodes.select(".srcNode");
		srcNode = tmp[ 0 ][ 0 ][ 'id' ];
		drawLinks( nodes[ srcNode ] );
});
	
})()