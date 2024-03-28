"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Map, { GeolocateControl, Layer, useMap } from "react-map-gl";
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Source from "react-map-gl/dist/esm/components/source";
import { getDistance } from "geolib";

type Location = {
  latitude: number | undefined;
  longitude: number | undefined;
};

// Replace 'YOUR_MAPBOX_ACCESS_TOKEN' with your actual MapBox access token

interface Coord {
  lng: number;
  lat: number;
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const [path, setPath] = useState<Coord[]>([]);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [showMap, setShowMap] = useState<boolean>(false);

  const startTracking = () => {
    setPath([]);
    setTracking(true);
    navigator.geolocation.watchPosition(
      (position) => {
        const newCoords: Coord = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setPath((prevPath) => [...prevPath, newCoords]);
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  };

  const stopTracking = () => {
    setTracking(false);
    setShowMap(true);
  };

  const pauseTracking = () => {
    setTracking(false);
  };

  const getDistanceTravelled = () => {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += getDistance(
        { latitude: path[i].lat, longitude: path[i].lng },
        { latitude: path[i + 1].lat, longitude: path[i + 1].lng }
      );
    }
    return totalDistance * 0.001;
  };

  // start a timer to calculate the time elapsed
  useEffect(() => {
    let interval = undefined;
    if (tracking) {
      interval = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [tracking]);

  return (
    <div className="flex justify-center items-center flex-col p-20">
      <div className="border-4 border-solid border-sky-500">
        {showMap && path.length > 0 && (
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={{
              longitude: path[0].lng,
              latitude: path[0].lat,
              zoom: 50,
            }}
            style={{ width: "500px", height: "500px" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            // disable the default attribution
            attributionControl={false}
          >
            <Source
              id="polylineLayer"
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: path.map((coord) => [coord.lng, coord.lat]),
                },
              }}
            >
              <Layer
                id="lineLayer"
                type="line"
                source="polylineLayer"
                layout={{
                  "line-join": "round",
                  "line-cap": "round",
                }}
                paint={{
                  "line-color": "red",
                  "line-width": 8,
                }}
              ></Layer>
            </Source>
            <GeolocateControl showAccuracyCircle showUserLocation />
          </Map>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button className="bg-[#67BF00]" onClick={startTracking}>
          Start a new Ride
        </Button>

        <Button className="bg-[#67BF00]" onClick={startTracking}>
          Pause Ride
        </Button>

        <Button className="bg-red-500" onClick={stopTracking}>
          Stop Ride
        </Button>
      </div>

      <div>Time Elapsed: {timeElapsed * 0.0166667}</div>
      <div>
        Current Speed: {(getDistanceTravelled() / timeElapsed) * 0.0166667}
      </div>

      <button onClick={stopTracking}>Stop Tracking</button>
      <div>Total Distance {getDistanceTravelled()}</div>
    </div>
  );
}
