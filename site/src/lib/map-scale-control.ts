import type { IControl, Map } from "maplibre-gl";

export class MapScaleControl implements IControl {
  private map: Map | null = null;
  private container: HTMLDivElement | null = null;
  private labels: HTMLSpanElement[] = [];

  onAdd(map: Map): HTMLElement {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl heatmap-scale";
    this.container.setAttribute("role", "img");

    const labels = document.createElement("div");
    labels.className = "heatmap-scale-labels";
    this.labels = Array.from({ length: 3 }, () => {
      const label = document.createElement("span");
      labels.append(label);
      return label;
    });

    const bar = document.createElement("div");
    bar.className = "heatmap-scale-bar";
    this.container.append(labels, bar);
    map.on("move", this.update);
    map.on("resize", this.update);
    this.update();

    return this.container;
  }

  onRemove(): void {
    this.map?.off("move", this.update);
    this.map?.off("resize", this.update);
    this.container?.remove();
    this.map = null;
    this.container = null;
    this.labels = [];
  }

  private update = (): void => {
    if (this.map === null || this.container === null) {
      return;
    }

    const { clientWidth: width, clientHeight: height } = this.map.getContainer();
    const maxWidth = Math.min(280, width - 128);
    const left = this.map.unproject([width / 2 - maxWidth / 2, height / 2]);
    const right = this.map.unproject([width / 2 + maxWidth / 2, height / 2]);
    const maxMeters = left.distanceTo(right);

    if (Number.isFinite(maxMeters) !== true || maxMeters <= 0) {
      return;
    }

    const magnitude = 10 ** Math.floor(Math.log10(maxMeters));
    const normalized = maxMeters / magnitude;
    const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].reduce(
      (selected, candidate) => normalized >= candidate ? candidate : selected,
      1,
    );
    const meters = step * magnitude;
    const divisor = meters >= 1000 ? 1000 : 1;
    const unit = meters >= 1000 ? "km" : "m";
    const distance = meters / divisor;
    const format = (value: number) => Number(value.toPrecision(3)).toString();

    this.container.style.width = `${maxWidth * meters / maxMeters}px`;
    this.labels[0].textContent = `0 ${unit}`;
    this.labels[1].textContent = `${format(distance / 2)} ${unit}`;
    this.labels[2].textContent = `${format(distance)} ${unit}`;
    this.container.setAttribute("aria-label", `Map scale: ${format(distance)} ${unit}`);
  };
}
