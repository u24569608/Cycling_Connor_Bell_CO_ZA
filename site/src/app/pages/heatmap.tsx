"use client";
import { useEffect, useRef } from "react";
import { Map, NavigationControl, addProtocol, removeProtocol, setWorkerUrl, type LayerSpecification, type StyleSpecification } from "maplibre-gl";
import { createRoadDetailProtocol } from "@/lib/road-detail";
import { MapScaleControl } from "@/lib/map-scale-control";
import "maplibre-gl/dist/maplibre-gl.css";
import "./heatmap.css";

const highwayColor = "#252525";

const zoomSettings = {
  buttonStep: 0.5,
  buttonDuration: 800,
  wheelRate: 1 / 900,
  trackpadRate: 1 / 200,
};

const roadColors: Record<string, string> = {
  highway_path: "#202020",
  highway_minor: "#262626",
  highway_major_casing: "#242424",
  highway_major_inner: "#242424",
  highway_major_subtle: "#242424",
  highway_motorway_casing: highwayColor,
  highway_motorway_inner: highwayColor,
  highway_motorway_subtle: highwayColor,
};

const fineRoadDetail = {
  minZoom: 7,
  overviewZoom: 10,
  detailZoom: 14,
  overviewColor: "#323232",
  tileZoomBoost: 1,
  minDetailTileZoom: 12,
  tileMinZoom: 10,
  minorTileMaxZoom: 12,
  pathTileMinZoom: 11,
  pathTileMaxZoom: 13,
};

type ZoomStops = [number, number][];
type ZoomExpression = ["interpolate", ["linear"], ["zoom"], ...number[]];

const roadWidthStops = {
  path: [[7, 0.15], [10, 0.25], [12, 0.4], [14, 0.7], [16, 1.5], [20, 6]],
  minor: [[7, 0.2], [10, 0.35], [12, 0.6], [14, 1.2], [16, 3], [20, 14]],
  major: [[6, 0.2], [10, 0.5], [12, 1], [14, 2], [16, 5], [20, 18]],
  motorway: [[4, 0.25], [8, 0.5], [10, 0.8], [12, 1.4], [14, 3], [16, 7], [20, 24]],
} satisfies Record<string, ZoomStops>;

const roadWidthLayers: Record<string, keyof typeof roadWidthStops> = {
  highway_path: "path",
  highway_minor: "minor",
  highway_major_casing: "major",
  highway_major_inner: "major",
  highway_major_subtle: "major",
  highway_motorway_casing: "motorway",
  highway_motorway_inner: "motorway",
  highway_motorway_subtle: "motorway",
};

const labelSizes: Record<string, number> = {
  water_name: 12,
  place_other: 12,
  place_suburb: 14,
  place_village: 14,
  place_town: 16,
  place_city: 18,
  place_city_large: 20,
  place_state: 22,
  place_country_other: 12,
  place_country_minor: 14,
  place_country_major: 16,
  highway_name_other: 12,
  highway_name_motorway: 11,
};

const labelColors: Record<string, string> = {
  water_name: "#3b3b3b",
  place_other: "#3b3b3b",
  place_suburb: "#3c3c3c",
  place_village: "#4f4f4f",
  place_town: "#7e7e7e",
  place_city: "#7e7e7e",
  place_city_large: "#7e7e7e",
  place_state: "#3b3b3b",
  place_country_other: "#3b3b3b",
  place_country_minor: "#515151",
  place_country_major: "#515151",
  highway_name_other: "#3b3b3b",
  highway_name_motorway: "#3b3b3b",
};

const labelStyle = {
  font: "Work Sans",
  defaultSize: 14,
  defaultColor: "#414040",
  haloColor: "#0c0c0c",
  haloWidth: 1,
};

const labelZoom = {
  overviewZoom: 8,
  overviewScale: 0.55,
  regionalZoom: 11,
  regionalScale: 0.7,
  detailZoom: 14,
  detailScale: 1,
  placePadding: 14,
  roadPadding: 3,
};

const labelMinZoom: Record<string, number> = {
  water_name: 12,
  place_other: 13,
  place_suburb: 12,
  place_village: 11,
  place_town: 9,
  place_city: 7,
  place_city_large: 5,
  highway_name_other: 13,
  highway_name_motorway: 11,
};

function zoomCurve(stops: ZoomStops): ZoomExpression {
  return ["interpolate", ["linear"], ["zoom"], ...stops.flat()];
}

function HeatmapPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }

    setWorkerUrl(
      new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
    );

    addProtocol("road-detail", createRoadDetailProtocol(
      "https://tiles.openfreemap.org/planet",
      fineRoadDetail.tileZoomBoost,
      fineRoadDetail.minDetailTileZoom,
    ));

    const map = new Map({
      container: containerRef.current,
      attributionControl: false,
      style: "https://tiles.openfreemap.org/styles/dark",
      transformStyle: (_, style) => {
        const nextStyle: StyleSpecification = {
          ...style,
          sources: {
            ...style.sources,
            "road-detail": {
              type: "vector",
              tiles: ["road-detail://tiles/{z}/{x}/{y}"],
              minzoom: fineRoadDetail.tileMinZoom,
              maxzoom: 14 - fineRoadDetail.tileZoomBoost,
            },
          },
          layers: style.layers.filter((layer) => {
            if ("source-layer" in layer) {
              return layer["source-layer"] !== "building" && layer["source-layer"] !== "poi";
            }

            return true;
          }).map((layer): LayerSpecification => {
            const roadColor = roadColors[layer.id];
            const roadWidthLayer = roadWidthLayers[layer.id];

            if (layer.type === "line" && roadColor !== undefined && roadWidthLayer !== undefined) {
              if (roadWidthLayer === "path" || roadWidthLayer === "minor") {
                const paint = { ...layer.paint };
                delete paint["line-dasharray"];

                return {
                  ...layer,
                  minzoom: fineRoadDetail.minZoom,
                  filter: [
                    "all",
                    ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
                    ["match", ["get", "class"], roadWidthLayer === "path"
                      ? ["path", "pedestrian", "raceway"]
                      : ["minor", "service", "track", "residential", "unclassified", "living_street"], true, false],
                  ],
                  paint: {
                    ...paint,
                    "line-color": [
                      "interpolate", ["linear"], ["zoom"],
                      fineRoadDetail.overviewZoom, fineRoadDetail.overviewColor,
                      fineRoadDetail.detailZoom, roadColor,
                    ],
                    "line-opacity": 1,
                    "line-width": zoomCurve(roadWidthStops[roadWidthLayer]),
                  },
                };
              }

              return {
                ...layer,
                paint: {
                  ...layer.paint,
                  "line-color": roadColor,
                  "line-width": zoomCurve(roadWidthStops[roadWidthLayer]),
                },
              };
            }

            if (layer.type !== "symbol" || layer.layout?.["text-field"] === undefined) {
              return layer;
            }

            const labelSize = labelSizes[layer.id] ?? labelStyle.defaultSize;
            const isPlaceLabel = layer.id.startsWith("place_");

            return {
              ...layer,
              minzoom: Math.max(layer.minzoom ?? 0, labelMinZoom[layer.id] ?? 0),
              layout: {
                ...layer.layout,
                "text-font": [labelStyle.font],
                "text-size": zoomCurve([
                  [labelZoom.overviewZoom, labelSize * labelZoom.overviewScale],
                  [labelZoom.regionalZoom, labelSize * labelZoom.regionalScale],
                  [labelZoom.detailZoom, labelSize * labelZoom.detailScale],
                ]),
                "text-transform": "none",
                "text-padding": isPlaceLabel ? labelZoom.placePadding : labelZoom.roadPadding,
                "text-allow-overlap": false,
                "text-ignore-placement": false,
              },
              paint: {
                ...layer.paint,
                "text-color": labelColors[layer.id] ?? labelStyle.defaultColor,
                "text-halo-color": labelStyle.haloColor,
                "text-halo-width": labelStyle.haloWidth,
              },
            };
          }),
        };

        const detailLayers: LayerSpecification[] = [
          {
            id: "road-detail-minor",
            type: "line",
            source: "road-detail",
            "source-layer": "transportation",
            minzoom: fineRoadDetail.tileMinZoom,
            maxzoom: fineRoadDetail.minorTileMaxZoom,
            filter: ["match", ["get", "class"], ["minor", "residential", "unclassified", "living_street"], true, false],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": fineRoadDetail.overviewColor,
              "line-width": zoomCurve([[10, 0.25], [12, 0.5]]),
              "line-opacity": zoomCurve([[10, 0], [10.5, 1], [12, 1]]),
            },
          },
          {
            id: "road-detail-path",
            type: "line",
            source: "road-detail",
            "source-layer": "transportation",
            minzoom: fineRoadDetail.pathTileMinZoom,
            maxzoom: fineRoadDetail.pathTileMaxZoom,
            filter: ["match", ["get", "class"], ["service", "track", "path", "pedestrian", "raceway"], true, false],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": fineRoadDetail.overviewColor,
              "line-width": zoomCurve([[11, 0.2], [13, 0.4]]),
              "line-opacity": zoomCurve([[11, 0], [11.5, 1], [13, 1]]),
            },
          },
        ];
        const firstRoadIndex = nextStyle.layers.findIndex((layer) => layer.id === "highway_path");
        nextStyle.layers.splice(firstRoadIndex < 0 ? nextStyle.layers.length : firstRoadIndex, 0, ...detailLayers);

        delete nextStyle.glyphs;
        return nextStyle;
      },
      center: [28.1528, -26.1411],
      zoom: 11,
    });

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new MapScaleControl(), "bottom-left");
    map.scrollZoom.setWheelZoomRate(zoomSettings.wheelRate);
    map.scrollZoom.setZoomRate(zoomSettings.trackpadRate);

    const container = map.getContainer();

    function handleZoomClick(event: MouseEvent) {
      if (event.target instanceof Element !== true) {
        return;
      }

      const button = event.target.closest<HTMLButtonElement>(
        ".maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out",
      );

      if (button === null || button.disabled === true) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const direction = button.classList.contains("maplibregl-ctrl-zoom-in") ? 1 : -1;
      map.zoomTo(map.getZoom() + direction * zoomSettings.buttonStep, {
        duration: zoomSettings.buttonDuration,
      }, { originalEvent: event });
    }

    container.addEventListener("click", handleZoomClick, true);

    return () => {
      container.removeEventListener("click", handleZoomClick, true);
      map.remove();
      removeProtocol("road-detail");
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Cycling map"
      className="heatmap-map min-h-0 w-full flex-1"
    />
  );
}

export default HeatmapPage;
