import mapboxgl from 'mapbox-gl';
import React from 'react'

const mapContainer = React.createRef()

const map = new mapboxgl.Map({
	container: mapContainer.current,
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [lng, lat],
	zoom: zoom
});
export default map