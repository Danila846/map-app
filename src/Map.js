import React from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import "./Map.css"
import mnDistricts from './GeoJSON.geojson'

import mapboxGlDraw from 'mapbox-gl-draw';
import turf from 'turf'

import RulerControl from 'mapbox-gl-ruler-control'

var map;
var draw;
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFuaWxhODQ2IiwiYSI6ImNrem1vZjlpaTJxdzUybm8wd3VjNDlpbmMifQ.1HmKdO8hLtsQLxaa0q6y8w';


export default class MapComponent extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			lng: 93,
			lat: 56,
			zoom: 9,

			// geojsonvisible: false,
			lti: 'mapbox://styles/mapbox/streets-v11',
			modelChecked: false,
		};

		this.n = 0;
		this.map = map;
		this.mapContainer = React.createRef();
		this.drawPolygon = this.drawPolygon.bind(this);
		this.createElement = this.createElement.bind(this);
		// this.updateArea = this.updateArea.bind(this);
		// this.showPolygonData = this.showPolygonData.bind(this);
		// this.polygonDataCalc = this.polygonDataCalc.bind(this);
		// this.onGeojsonToggle = onGeojsonToggle.bind(this)
	}
	componentDidMount() {
		const { lng, lat, zoom } = this.state;
		this.map = new mapboxgl.Map({
			container: this.mapContainer.current,
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [lng, lat],
			zoom: zoom
		});

		const layerList = document.getElementById('menu');
		const inputs = layerList.getElementsByTagName('input');

		for (const input of inputs) {
			input.onclick = (layer) => {
				const layerId = layer.target.id;
				this.state.lti = 'mapbox://styles/mapbox/' + layerId;
				this.state.modelChecked = false;
				this.map.setStyle('mapbox://styles/mapbox/' + layerId);
			};
		}

		this.map.on("load", function () {
			// if (this.state.geojsonvisible) return
			this.addSource('district-source', {
				'type': 'geojson',
				'data': mnDistricts
			});

			this.addLayer({
				'id': 'district-layer',
				'type': 'fill',
				'source': 'district-source',
				"title": "Planet",
				'layout': {
					'visibility': 'visible'
				},
				'paint': {
					'fill-color': '#0080ff', // blue color fill
					'fill-opacity': 0.3,
				}
			});
			this.addLayer({
				'id': 'outline',
				'type': 'line',
				'source': 'district-source',
				'layout': {
					'visibility': 'visible'
				},
				'paint': {
					'line-color': '#0000ff',
					'line-width': 2
				}
			});
			this.on('click', 'district-layer', (e) => {
				new mapboxgl.Popup()
					.setLngLat(e.lngLat)
					.setHTML(e.features[0].properties.title)
					.addTo(this);
			});
			// Change the cursor to a pointer when
			// the mouse is over the states layer.
			this.on('mouseenter', 'district-layer', () => {
				this.getCanvas().style.cursor = 'pointer';
			});

			// Change the cursor back to a pointer
			// when it leaves the states layer.
			this.on('mouseleave', 'district-layer', () => {
				this.getCanvas().style.cursor = '';
			})
		});

		draw = new mapboxGlDraw({
			displayControlsDefault: false,
			controls: {
				point: true,
				line_string: true,
				polygon: true,
				trash: true
			},
		});

		this.map.addControl(draw, 'bottom-left');

		this.map.on('draw.create', this.createElement);
		// this.map.on('draw.update', this.updateArea);
		this.map.on('draw.delete', function (e) {

		});

		// After the last frame rendered before the map enters an "idle" state.
		// this.map.on('idle', () => {
		// 	// If these two layers were not added to the map, abort
		// 	if (!this.map.getLayer('contours') || !this.map.getLayer('museums')) {
		// 		return;
		// 	}

		// 	// Enumerate ids of the layers.
		// 	const toggleableLayerIds = ['contours', 'museums'];

		// 	// Set up the corresponding toggle button for each layer.
		// 	for (const id of toggleableLayerIds) {
		// 		// Skip layers that already have a button set up.
		// 		if (document.getElementById(id)) {
		// 			continue;
		// 		}

		// 		// Create a link.
		// 		const link = document.createElement('a');
		// 		link.id = id;
		// 		link.href = '#';
		// 		link.textContent = id;
		// 		link.className = 'active';

		// 		// Show or hide layer when the toggle is clicked.
		// 		link.onclick = function (e) {
		// 			const clickedLayer = this.textContent;
		// 			e.preventDefault();
		// 			e.stopPropagation();

		// 			const visibility = this.map.getLayoutProperty(
		// 				clickedLayer,
		// 				'visibility'
		// 			);

		// 			// Toggle layer visibility by changing the layout object's visibility property.
		// 			if (visibility === 'visible') {
		// 				this.map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		// 				this.className = '';
		// 			} else {
		// 				this.className = 'active';
		// 				this.map.setLayoutProperty(
		// 					clickedLayer,
		// 					'visibility',
		// 					'visible'
		// 				);
		// 			}
		// 		};

		// 		const layers = document.getElementById('layers');
		// 		layers.appendChild(link);
		// 	}
		// });


		// const model = document.getElementById('model')
		// const modelInput = model.getElementByTagName('input')


		model.onclick = () => {

			if (this.state.modelChecked) {
				this.map.setStyle(this.state.lti);
				this.state.modelChecked = false;
			} else if (!this.state.modelChecked) {
				this.state.modelChecked = true;

				this.map.addSource('mapbox-dem', {
					'type': 'raster-dem',
					'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
					'tileSize': 512,
					'maxzoom': 14
				});
				// add the DEM source as a terrain layer with exaggerated height
				this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

				// add a sky layer that will show when the map is highly pitched
				this.map.addLayer({
					'id': 'sky',
					'type': 'sky',
					'paint': {
						'sky-type': 'atmosphere',
						'sky-atmosphere-sun': [0.0, 0.0],
						'sky-atmosphere-sun-intensity': 15
					}
				});
			}
		};
	}
	// drawPolygon(points, n) {
	// 	this.map.addLayer({
	// 		// 'id': 'maineone',
	// 		// 'type': 'fill',
	// 		// 'source': {
	// 		// 	'type': 'geojson',
	// 		// 	'data': {
	// 		// 		'type': 'Feature',
	// 		// 		'geometry': {
	// 		// 			'type': 'Polygon',
	// 		// 			'coordinates': points
	// 		// 		}
	// 		// 	}
	// 		// },
	// 		// 'layout': {
	// 		// 	'visibility': 'none'
	// 		// },
	// 		// 'paint': {
	// 		// 	'fill-color': '#fff',
	// 		// 	'fill-opacity': 0.3
	// 		// }
	// 		'id': 'maine' + n,
	// 		'type': 'fill',
	// 		'source': {
	// 			'type': 'geojson',
	// 			'data': {
	// 				'type': 'Feature',
	// 				'geometry': {
	// 					'type': 'Polygon',
	// 					'coordinates': points
	// 				}
	// 			}
	// 		},
	// 		"title": "Planet",
	// 		'layout': {
	// 			'visibility': 'visible'
	// 		},
	// 		'paint': {
	// 			'fill-color': '#fff', // blue color fill
	// 			'fill-opacity': 0,
	// 		}
	// 	});
	// }


	// createArea(e) {
	// 	let geometry = e.features[0].geometry
	// 	if (geometry.type == 'Point') {
	// 		new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
	// 			.setLngLat(geometry.coordinates)
	// 			.setHTML(geometry.coordinates)
	// 			.addTo(this);
	// 		e.features[0].properties = "Title"
	// 		console.log(e);

	// 	} else if (geometry.type == 'Polygon') {
	// 		let area = turf.area(e.features[0]);
	// 		let centroid = turf.centroid(e.features[0]).geometry.coordinates;
	// 		let rounded_area = Math.round(area * 100) / 100;
	// 		new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
	// 			.setLngLat(centroid)
	// 			.setHTML(rounded_area)
	// 			.addTo(this);
	// 		console.log(area);
	// 	} else if (geometry.type == 'LineString') {
	// 		for (let i = 0; i < e.features.length; i += 1) {
	// 			let marker = turf.point(e.features[0].geometry.coordinates).geometry.coordinates;
	// 			let marker_line = marker[marker.length - 1];
	// 			var length = turf.lineDistance(e.features[0]);
	// 			let rounded_length = Math.round(length * 100) / 100;
	// 			new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
	// 				.setLngLat(marker_line)
	// 				.setHTML(rounded_length + ' miles')
	// 				.addTo(this);
	// 			return
	// 		}
	// 	}
	// }

	// polygonDataCalc(data) {
	// 	// let centroid1 = turf.centroid(draw.getSelected()).geometry.coordinates;
	// 	for (let i = 0; i < data.features.length; i += 1) {
	// 		let area = turf.area(data);
	// 		// let marker = turf.point(data.features[0].geometry.coordinates).geometry.coordinates;
	// 		// let marker_line = marker[marker.length - 1];
	// 		let centroid = turf.centroid(data.features[i]).geometry.coordinates;
	// 		let rounded_area = Math.round(area * 100) / 100;
	// 		// console.log(centroid);
	// 		// new mapboxgl.Popup()
	// 		// 	.setLngLat(centroid)
	// 		// 	.setHTML(rounded_area)
	// 		// 	.addTo(this.map);
	// 		var length = turf.lineDistance(data);
	// 		let rounded_length = Math.round(length * 100) / 100;
	// 		// var line = turf.lineString([[115, -32], [131, -22], [143, -25], [150, -34]]);
	// 		for (let l = 0; l < data.features.length; l += 1) {
	// 			// console.log(data);
	// 			// console.log(turf.length(line));
	// 			// console.log(length);
	// 			// console.log(marker);
	// 			// console.log(marker_line);
	// 			// console.log(rounded_length);
	// 			// console.log(turf);
	// 		}


	// 		this.map.on('click', (e) => {
	// 			if (rounded_area > 1) {
	// 				new mapboxgl.Popup()
	// 					.setLngLat(centroid)
	// 					.setHTML(rounded_area)
	// 					.addTo(this.map);
	// 				// } else if (rounded_area == 0 || !rounded_length == 0) {
	// 				// 	new mapboxgl.Popup()
	// 				// 		.setLngLat(marker_line)
	// 				// 		.setHTML(rounded_length)
	// 				// 		.addTo(this.map);
	// 				// } else if (rounded_area == 0 || rounded_length == 0) {
	// 				// 	new mapboxgl.Popup()
	// 				// 		.setLngLat(marker_line)
	// 				// 		.setHTML(marker_line)
	// 				// 		.addTo(this.map);
	// 			} else {
	// 				return
	// 			}
	// 		});
	// 		// console.log(this.map);

	// 	}
	// 	var line = turf.lineString(data);
	// 	// var lengtht = turf.length(line, { units: 'miles' });
	// 	// console.log(line);
	// 	// console.log(lengtht);
	// 	// console.log(rounded_area);
	// 	// console.log(centroid1);

	// }
	// showPolygonData(e) {
	// 	// this.map.on('click', (e) => {
	// 	// 	if (!rounded_area == 0) {
	// 	// 		new mapboxgl.Popup()
	// 	// 			.setLngLat(turf.centroid(draw.getSelected()).geometry.coordinates)
	// 	// 			.setHTML(rounded_area)
	// 	// 			.addTo(this.map);
	// 	// 	}
	// 	// });
	// }

	// deleteArea(e) {
	// 	// let data = draw.getAll();
	// 	// this.map.removeLayer('maine').removeSource('maine');
	// 	// console.log(this.n)
	// }
	// updateArea(e) {
	// 	// let data = draw.getAll();
	// 	// this.n = this.n + 1;

	// 	// // this.map.removeLayer('maine' + this.n).removeSource('maine' + this.n);
	// 	// // this.map.removeLayer('outline-new' + this.n).removeSource('outline-new' + this.n);
	// 	// const polygonData = data.features[0].geometry.coordinates;


	// 	// this.drawPolygon(polygonData, this.n);
	// 	// this.polygonDataCalc(data);
	// 	// // console.log(data);
	// 	// // console.log(polygonData);
	// 	// // console.log(turf.centroid(draw.getSelected()).geometry.coordinates);
	// 	// // console.log(this.n);

	// }

	drawPolygon(points) {
		this.map.addLayer({
			'id': 'maine',
			'type': 'fill',
			'source': {
				'type': 'geojson',
				'data': {
					'type': 'Feature',
					'geometry': {
						'type': 'Polygon',
						'coordinates': points
					},
					'properties': {
						'title': "Point"
					}
				}
			},
			// 'layout': {
			// 	'text-field': "{title}"
			// },
			'paint': {
				'fill-color': '#088',
				'fill-opacity': 0.3
			}
		});
	}

	createElement(e) {
		let geometry = e.features[0].geometry
		if (geometry.type == 'Point') {
			new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
				.setLngLat(geometry.coordinates)
				.setHTML(geometry.coordinates[0] + "<br />" + geometry.coordinates[1])
				.addTo(this.map);
			// console.log(geometry);

			// e.features[0].properties = "{title: Point }"
		} else if (geometry.type == 'Polygon') {
			let area = turf.area(e.features[0]);
			let centroid = turf.centroid(e.features[0]).geometry.coordinates;
			let rounded_area = Math.round(area * 100) / 100;
			new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
				.setLngLat(centroid)
				.setHTML(rounded_area)
				.addTo(this.map);
		} else if (geometry.type == 'LineString') {
			for (let i = 0; i < e.features.length; i += 1) {
				let marker = turf.point(e.features[0].geometry.coordinates).geometry.coordinates;
				let marker_line = marker[marker.length - 1];
				var length = turf.lineDistance(e.features[0]);
				let rounded_length = Math.round(length * 100) / 100;
				new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
					.setLngLat(marker_line)
					.setHTML(rounded_length + ' miles')
					.addTo(this.map);
			}
		}
		console.log(draw.getAll())
		// this.drawPolygon(e.features[0].geometry.coordinates)
		// drawPolygon(e)
		// console.log(this.drawPolygon(e.features[0].geometry.coordinates))
		// console.log(e.features[0])
	}

	render() {
		return (
			<div>
				<div ref={this.mapContainer} className="map map-container" />
				<div className="layers" id="layers"></div>
				<div className="menu" id="menu">
					<input id="streets-v11" type="radio" name="rtoggle" value="streets" defaultChecked="checked" />
					<label className="map-style" htmlFor="streets-v11">Streets</label>
					<input id="satellite-v9" type="radio" name="rtoggle" value="satellite" />
					<label className="map-style" htmlFor="satellite-v9">Satellite</label>
					<input id="light-v10" type="radio" name="rtoggle" value="light" />
					<label className="map-style" htmlFor="light-v10">light</label>
					<input id="dark-v10" type="radio" name="rtoggle" value="dark" />
					<label className="map-style" htmlFor="dark-v10">dark</label>
					<input id="outdoors-v11" type="radio" name="rtoggle" value="outdoors" />
					<label className="map-style" htmlFor="outdoors-v11">outdoors</label>
				</div>
				<div className="virtual-model" id="virtual-model">
					<input id="model" type="checkbox" name="model" value="model" />
					<label className="map-style" htmlFor="model">3D-model</label>
				</div>
			</div>
		);
	}
}
