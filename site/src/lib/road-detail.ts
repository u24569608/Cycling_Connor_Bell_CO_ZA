import { VectorTile } from "@mapbox/vector-tile";
import { fromVectorTileJs, type VectorTileFeatureLike } from "@maplibre/vt-pbf";
import { PbfReader } from "pbf";
import type { AddProtocolAction } from "maplibre-gl";

type TileMetadata = {
  tiles: string[];
  maxzoom?: number;
};

const extent = 8192;
const roadClasses = new Set([
  "minor", "service", "track", "path", "pedestrian", "raceway",
  "residential", "unclassified", "living_street",
]);

export function createRoadDetailProtocol(metadataUrl: string, zoomBoost: number, minimumDetailZoom: number): AddProtocolAction {
  let metadataPromise: Promise<TileMetadata> | undefined;
  let activeRequests = 0;
  const waitingRequests: Array<() => void> = [];

  async function fetchTile(url: string, signal: AbortSignal) {
    if (activeRequests >= 6) {
      await new Promise<void>((resolve) => waitingRequests.push(resolve));
    } else {
      activeRequests += 1;
    }

    try {
      signal.throwIfAborted();
      const response = await fetch(url, { signal });

      if (response.status === 404) {
        return null;
      }

      if (response.ok !== true) {
        throw new Error(`Road detail tile failed to load (${response.status}).`);
      }

      return await response.arrayBuffer();
    } finally {
      const next = waitingRequests.shift();

      if (next !== undefined) {
        next();
      } else {
        activeRequests -= 1;
      }
    }
  }

  return async (request, abortController) => {
    const { signal } = abortController;
    signal.throwIfAborted();

    metadataPromise ??= fetch(metadataUrl).then(async (response) => {
      if (response.ok !== true) {
        throw new Error(`Road detail metadata failed to load (${response.status}).`);
      }

      return await response.json() as TileMetadata;
    }).catch((error: unknown) => {
      metadataPromise = undefined;
      throw error;
    });

    const metadata = await metadataPromise;
    signal.throwIfAborted();
    const template = metadata.tiles[0];

    if (template === undefined) {
      throw new Error("Road detail tile source is missing.");
    }

    const coordinates = new URL(request.url).pathname.split("/").filter((part) => part.length > 0);
    const [zoom, x, y] = coordinates.map(Number);

    if (coordinates.length !== 3 || [zoom, x, y].every(Number.isInteger) !== true || zoom < 0 || x < 0 || y < 0) {
      throw new Error("Road detail tile coordinates are invalid.");
    }

    const detailZoom = Math.min(
      metadata.maxzoom ?? 14,
      zoom + 2,
      Math.max(minimumDetailZoom, zoom + Math.max(0, Math.min(2, Math.round(zoomBoost)))),
    );
    const scale = 2 ** Math.max(0, detailZoom - zoom);

    const tiles = await Promise.all(Array.from({ length: scale * scale }, async (_, index) => {
      const column = index % scale;
      const row = Math.floor(index / scale);
      const url = template
        .replace("{z}", String(detailZoom))
        .replace("{x}", String(x * scale + column))
        .replace("{y}", String(y * scale + row));
      const data = await fetchTile(url, signal);
      signal.throwIfAborted();
      const features: VectorTileFeatureLike[] = [];

      if (data === null) {
        return features;
      }

      const layer = new VectorTile(new PbfReader(data)).layers.transportation;

      if (layer === undefined) {
        return features;
      }

      for (let index = 0; index < layer.length; index += 1) {
        const feature = layer.feature(index);

        if (feature.type !== 2 || roadClasses.has(String(feature.properties.class)) !== true) {
          continue;
        }

        const geometry = feature.loadGeometry();

        for (const line of geometry) {
          for (const point of line) {
            point.x = Math.round((point.x / layer.extent + column) * extent / scale);
            point.y = Math.round((point.y / layer.extent + row) * extent / scale);
          }
        }

        features.push({
          type: 2,
          id: feature.id,
          properties: feature.properties,
          extent,
          loadGeometry: () => geometry,
        });
      }

      return features;
    }));

    signal.throwIfAborted();
    const features = tiles.flat();
    const data = fromVectorTileJs({
      layers: {
        transportation: {
          version: 2,
          name: "transportation",
          extent,
          length: features.length,
          feature: (index) => features[index],
        },
      },
    });

    return { data: new Uint8Array(data).buffer };
  };
}
