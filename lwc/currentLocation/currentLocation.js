import { LightningElement } from 'lwc';

export default class CurrentLocation extends LightningElement {
    lstMarkers = [];
    zoomlevel = "1";

    handleClick(){
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {

                // Get the Latitude and Longitude from Geolocation API
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                alert('Latitude--'+latitude+ 'longitude--'+longitude);
                // Add Latitude and Longitude to the markers list.
                this.lstMarkers = [{
                    location : {
                        Latitude: latitude,
                        Longitude : longitude
                    },
                    title : 'You are here'
                }];
                this.zoomlevel = "4";
            });
        }
    }
}