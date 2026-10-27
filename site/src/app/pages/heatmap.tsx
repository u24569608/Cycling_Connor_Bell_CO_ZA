"use client";
import { useEffect, useRef } from "react";
import { Map, NavigationControl, setWorkerUrl, type LayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./heatmap.css";

const highwayColor = "#252525";

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

type ZoomStops = [number, number][];
type ZoomExpression = ["interpolate", ["linear"], ["zoom"], ...number[]];

const roadWidthStops = {
  path: [[8, 0.1], [11, 0.2], [13, 0.5], [16, 1.5], [20, 6]],
  minor: [[8, 0.15], [10, 0.25], [12, 0.5], [14, 1.2], [16, 3], [20, 14]],
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
  place_state: 12,
  place_country_other: 12,
  place_country_minor: 14,
  place_country_major: 16,
  highway_name_other: 12,
  highway_name_motorway: 11,
};

const labelColors: Record<string, string> = {
  water_name: "#3b3b3b",
  place_other: "#3b3b3b",
  place_suburb: "#474747",
  place_village: "#4f4f4f",
  place_town: "#5b5b5b",
  place_city: "#636363",
  place_city_large: "#717171",
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

    const map = new Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      transformStyle: (_, style) => {
        const nextStyle = {
          ...style,
          layers: style.layers.filter((layer) => {
            if ("source-layer" in layer) {
              return layer["source-layer"] !== "building" && layer["source-layer"] !== "poi";
            }

            return true;
          }).map((layer): LayerSpecification => {
            const roadColor = roadColors[layer.id];
            const roadWidthLayer = roadWidthLayers[layer.id];

            if (layer.type === "line" && roadColor !== undefined && roadWidthLayer !== undefined) {
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

        delete nextStyle.glyphs;
        return nextStyle;
      },
      center: [28.0473, -26.2041],
      zoom: 11,
    });

    map.addControl(new NavigationControl(), "top-right");

    return () => {
      map.remove();
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
