declare module "frappe-charts/dist/frappe-charts.min.esm" {
  export class Chart {
    constructor(element: HTMLElement | string, options: Record<string, unknown>);
    update(data: Record<string, unknown>): void;
    addDataPoint(label: string, valueFromEachDataset: number[], index?: number): void;
    removeDataPoint(index?: number): void;
    export(): void;
    parent: HTMLElement;
  }
}
